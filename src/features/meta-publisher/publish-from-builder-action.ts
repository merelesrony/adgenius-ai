'use server'

import { createClient } from '@/lib/supabase/server'
import { decryptMetaToken } from '@/lib/meta/meta-auth'
import { validateDestinationUrl } from '@/lib/meta/meta-publisher-utils'
import { createCampaignFromBuilderAction, type CampaignAssemblyInput } from '@/features/campaign-builder/actions'
import { validateMetaCampaignAction } from './actions'
import { publishCampaignToMeta } from './meta-publisher'
import type { MetaPublishPayload, PublishStatus } from './publisher-types'

const PUBLISH_ENABLED = process.env.META_PUBLISH_ENABLED === 'true'

// Currencies where Meta expects the full unit (no cents multiplication)
const ZERO_DECIMAL = new Set([
  'BIF', 'CLP', 'GNF', 'ISK', 'JPY', 'KMF', 'KRW', 'MGA', 'PYG',
  'RWF', 'UGX', 'VND', 'VUV', 'XAF', 'XOF', 'XPF',
])

function toBudgetUnits(amount: number, currency: string): number {
  return ZERO_DECIMAL.has(currency.toUpperCase())
    ? Math.round(amount)
    : Math.round(amount * 100)
}

function buildAdsManagerUrl(adAccountId: string, metaCampaignId: string): string {
  const actId = adAccountId.replace(/^act_/, '')
  return `https://business.facebook.com/adsmanager/manage/campaigns?act=${actId}&selected_campaign_ids=${metaCampaignId}`
}

export interface PublishFromBuilderResult {
  success: boolean
  campaignId?: string
  metaCampaignId?: string
  metaAdSetId?: string
  metaCreativeId?: string
  metaAdId?: string
  publishStatus: PublishStatus
  reason?: 'META_PUBLISH_DISABLED' | 'ALREADY_PUBLISHING' | 'PREFLIGHT_FAILED' | 'PARTIAL_FAILURE' | 'ERROR'
  error?: string
  adsManagerUrl?: string
}

export async function publishFromBuilderAction(
  input: CampaignAssemblyInput,
): Promise<PublishFromBuilderResult> {
  // Guard: disabled at environment level — return immediately, no DB write
  if (!PUBLISH_ENABLED) {
    console.log('[MetaPublish] META_PUBLISH_ENABLED=false — skipping')
    return { success: false, reason: 'META_PUBLISH_DISABLED', publishStatus: 'ready' }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, reason: 'ERROR', publishStatus: 'failed', error: 'No autenticado' }
  }

  // ── Idempotency ────────────────────────────────────────────────────────────
  // If this builder session already published a campaign, return the existing result
  // instead of creating a duplicate. Protects against double-click and retries.
  if (input.sessionId) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: session } = await (supabase as any)
      .from('campaign_builder_sessions')
      .select('campaign_id')
      .eq('id', input.sessionId)
      .eq('user_id', user.id)
      .maybeSingle() as { data: { campaign_id: string | null } | null }

    if (session?.campaign_id) {
      const { data: existing } = await supabase
        .from('campaigns')
        .select('sync_status, meta_campaign_id, meta_adset_id, meta_creative_id, meta_ad_id')
        .eq('id', session.campaign_id)
        .eq('user_id', user.id)
        .maybeSingle()

      if (existing?.sync_status === 'publishing') {
        console.log('[MetaPublish] Already publishing — returning early')
        return {
          success: false,
          reason: 'ALREADY_PUBLISHING',
          publishStatus: 'publishing',
          campaignId: session.campaign_id,
        }
      }

      if (existing?.sync_status === 'published' && existing.meta_campaign_id) {
        console.log('[MetaPublish] Already published — returning existing result')
        const { data: connForUrl } = await supabase
          .from('meta_connections')
          .select('selected_ad_account_id')
          .eq('user_id', user.id)
          .maybeSingle()
        const adAccountId = (connForUrl?.selected_ad_account_id as string | null) ?? ''
        return {
          success: true,
          campaignId: session.campaign_id,
          publishStatus: 'published',
          metaCampaignId: existing.meta_campaign_id as string,
          metaAdSetId: (existing.meta_adset_id as string | null) ?? undefined,
          metaCreativeId: (existing.meta_creative_id as string | null) ?? undefined,
          metaAdId: (existing.meta_ad_id as string | null) ?? undefined,
          adsManagerUrl: existing.meta_campaign_id && adAccountId
            ? buildAdsManagerUrl(adAccountId, existing.meta_campaign_id as string)
            : undefined,
        }
      }
    }
  }

  // ── Step 1: Create campaign in DB ──────────────────────────────────────────
  console.log('[MetaPublish] Creating campaign in DB')
  const createResult = await createCampaignFromBuilderAction(input)
  if (!createResult.success || !createResult.campaignId) {
    return {
      success: false,
      reason: 'ERROR',
      publishStatus: 'failed',
      error: createResult.error ?? 'Error al crear la campaña en la base de datos',
    }
  }
  const { campaignId } = createResult

  // ── Step 2: Destination URL from business profile ──────────────────────────
  const { data: business } = await supabase
    .from('businesses')
    .select('website')
    .eq('user_id', user.id)
    .maybeSingle()

  const urlValidation = validateDestinationUrl(business?.website)
  if (!urlValidation.valid) {
    await supabase
      .from('campaigns')
      .update({ sync_status: 'failed', error_message: urlValidation.error })
      .eq('id', campaignId)
    return {
      success: false,
      campaignId,
      reason: 'PREFLIGHT_FAILED',
      publishStatus: 'failed',
      error: urlValidation.error,
    }
  }
  const destinationUrl = urlValidation.url

  // ── Step 3: Mark validating ────────────────────────────────────────────────
  await supabase.from('campaigns').update({ sync_status: 'validating' }).eq('id', campaignId)
  console.log('[MetaPublish] Starting validation', { campaignId })

  // ── Step 4: Preflight ──────────────────────────────────────────────────────
  const preflight = await validateMetaCampaignAction({
    objective: input.aiStrategy?.objectiveLabel ?? null,
    dailyBudget: input.dailyBudget,
    totalBudget: input.totalBudget,
    targetCountry: input.country,
    platforms: input.platforms,
    hasCreative: !!input.selectedCreativeId,
    hasCopy: !!input.aiStrategy,
    hasAiStrategy: !!input.aiStrategy,
  })

  if (!preflight.valid) {
    await supabase
      .from('campaigns')
      .update({ sync_status: 'failed', error_message: 'Validación previa falló' })
      .eq('id', campaignId)
    return {
      success: false,
      campaignId,
      reason: 'PREFLIGHT_FAILED',
      publishStatus: 'failed',
      error: 'Validación con Meta falló. Verifica tu conexión y configuración.',
    }
  }

  // ── Step 5: Fetch Meta connection ──────────────────────────────────────────
  const { data: conn } = await supabase
    .from('meta_connections')
    .select('access_token_enc, selected_ad_account_id, selected_page_id, selected_instagram_id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!conn?.access_token_enc || !conn?.selected_ad_account_id) {
    await supabase
      .from('campaigns')
      .update({ sync_status: 'failed', error_message: 'Token o cuenta Meta no configurada' })
      .eq('id', campaignId)
    return {
      success: false,
      campaignId,
      reason: 'ERROR',
      publishStatus: 'failed',
      error: 'Cuenta publicitaria de Meta no configurada',
    }
  }

  let accessToken: string
  try {
    accessToken = decryptMetaToken(conn.access_token_enc as string)
  } catch {
    await supabase
      .from('campaigns')
      .update({ sync_status: 'failed', error_message: 'Error al descifrar token' })
      .eq('id', campaignId)
    return {
      success: false,
      campaignId,
      reason: 'ERROR',
      publishStatus: 'failed',
      error: 'Error al descifrar el token de Meta. Vuelve a conectar tu cuenta.',
    }
  }

  const adAccountId = conn.selected_ad_account_id as string
  const pageId = (conn.selected_page_id as string | null) ?? null
  const instagramId = (conn.selected_instagram_id as string | null) ?? null

  // ── Step 6: Build payload ──────────────────────────────────────────────────
  const selectedCreative =
    input.generatedCreatives.find(c => c.id === input.selectedCreativeId)
    ?? input.generatedCreatives[0]

  const radiusKm = parseInt(input.radius) || 50
  const productName =
    (input.productMode === 'existing' || input.productMode === 'ai' || input.productMode === 'image')
    && input.selectedProduct
      ? input.selectedProduct.name
      : input.productName || 'Campaña'

  const daily = parseFloat(input.dailyBudget) || 0
  const metaCurrency = preflight.metaCurrency ?? input.currency
  const budgetUnits = toBudgetUnits(daily, metaCurrency)

  const payload: MetaPublishPayload = {
    campaignId,
    userId: user.id,
    target: { adAccountId, pageId, instagramId },
    campaign: {
      name: `${productName} — IA`,
      objective: input.aiStrategy!.objective,
      dailyBudgetCents: budgetUnits,
      currency: metaCurrency,
      country: input.country,
      city: input.city || null,
      radiusKm: input.city ? radiusKm : null,
      ageMin: input.aiStrategy!.audience.ageMin,
      ageMax: input.aiStrategy!.audience.ageMax,
      gender: input.aiStrategy!.audience.gender,
      interests: input.aiStrategy!.audience.interests,
      platforms: input.platforms,
    },
    creative: {
      headline: selectedCreative.headline,
      primaryText: selectedCreative.primaryText,
      description: selectedCreative.description || null,
      cta: selectedCreative.cta,
      imageUrl: selectedCreative.imageUrl || null,
      destinationUrl,
    },
  }

  // ── Step 7: Mark publishing ────────────────────────────────────────────────
  await supabase.from('campaigns').update({ sync_status: 'publishing' }).eq('id', campaignId)
  console.log('[MetaPublish] Starting publication', { campaignId, adAccountId })

  // ── Step 8: Publish to Meta (Campaign + AdSet + Creative + Ad all PAUSED) ──
  const result = await publishCampaignToMeta(accessToken, payload)
  const now = new Date().toISOString()

  if (result.success) {
    await supabase
      .from('campaigns')
      .update({
        status: 'paused',
        sync_status: 'published',
        meta_campaign_id: result.metaCampaignId ?? null,
        meta_adset_id: result.metaAdSetId ?? null,
        meta_creative_id: result.metaCreativeId ?? null,
        meta_ad_id: result.metaAdId ?? null,
        meta_published_at: now,
        meta_account_id: adAccountId,
        meta_page_id: pageId,
        meta_instagram_actor_id: instagramId,
        last_sync: now,
        error_message: null,
      })
      .eq('id', campaignId)

    const adsManagerUrl = result.metaCampaignId
      ? buildAdsManagerUrl(adAccountId, result.metaCampaignId)
      : undefined

    return {
      success: true,
      campaignId,
      publishStatus: 'published',
      metaCampaignId: result.metaCampaignId,
      metaAdSetId: result.metaAdSetId,
      metaCreativeId: result.metaCreativeId,
      metaAdId: result.metaAdId,
      adsManagerUrl,
    }
  }

  // ── Failure handling ───────────────────────────────────────────────────────
  const publishStatus: PublishStatus =
    result.reason === 'PARTIAL_FAILURE' ? 'partial_failure' : 'failed'
  const reason: PublishFromBuilderResult['reason'] =
    result.reason === 'PARTIAL_FAILURE' ? 'PARTIAL_FAILURE' : 'ERROR'

  await supabase
    .from('campaigns')
    .update({
      sync_status: publishStatus,
      meta_campaign_id: result.metaCampaignId ?? null,
      meta_adset_id: result.metaAdSetId ?? null,
      meta_creative_id: result.metaCreativeId ?? null,
      meta_ad_id: result.metaAdId ?? null,
      error_message: result.error ?? null,
      last_sync: now,
    })
    .eq('id', campaignId)

  return {
    success: false,
    campaignId,
    publishStatus,
    reason,
    metaCampaignId: result.metaCampaignId,
    metaAdSetId: result.metaAdSetId,
    metaCreativeId: result.metaCreativeId,
    metaAdId: result.metaAdId,
    error: result.error,
  }
}
