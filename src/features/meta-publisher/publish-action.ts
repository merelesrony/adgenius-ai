'use server'

import { createClient } from '@/lib/supabase/server'
import { decryptMetaToken } from '@/lib/meta/meta-auth'
import { validateDestinationUrl } from '@/lib/meta/meta-publisher-utils'
import { validateMetaCampaignAction } from './actions'
import { publishCampaignToMeta } from './meta-publisher'
import type { MetaPublishPayload, MetaPublishResult } from './publisher-types'

// destinationUrl is fetched from businesses.website inside this action — callers don't need to supply it
type PublishInput = Omit<MetaPublishPayload, 'userId'> & {
  creative: Omit<MetaPublishPayload['creative'], 'destinationUrl'> & { destinationUrl?: string }
}

export async function publishCampaignAction(input: PublishInput): Promise<MetaPublishResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, reason: 'ERROR', publishStatus: 'failed', error: 'No autenticado' }
  }

  // ── Idempotency check ──────────────────────────────────────────
  const { data: dbCampaign } = await supabase
    .from('campaigns')
    .select('sync_status, meta_campaign_id, meta_adset_id, meta_ad_id')
    .eq('id', input.campaignId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!dbCampaign) {
    return { success: false, reason: 'ERROR', publishStatus: 'failed', error: 'Campaña no encontrada' }
  }

  if (dbCampaign.sync_status === 'publishing') {
    return { success: false, reason: 'ALREADY_PUBLISHING', publishStatus: 'publishing' }
  }

  if (dbCampaign.sync_status === 'published' && dbCampaign.meta_campaign_id) {
    return {
      success: true,
      publishStatus: 'published',
      metaCampaignId: dbCampaign.meta_campaign_id as string,
      metaAdSetId: (dbCampaign.meta_adset_id as string | null) ?? undefined,
      metaAdId: (dbCampaign.meta_ad_id as string | null) ?? undefined,
    }
  }

  // ── Destination URL ────────────────────────────────────────────
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
      .eq('id', input.campaignId)
    return {
      success: false,
      reason: 'PREFLIGHT_FAILED',
      publishStatus: 'failed',
      error: urlValidation.error,
    }
  }

  // Build complete payload now that destinationUrl is validated
  const payload: MetaPublishPayload = {
    ...input,
    userId: user.id,
    creative: { ...input.creative, destinationUrl: urlValidation.url },
  }

  // ── Preflight ──────────────────────────────────────────────────
  await supabase
    .from('campaigns')
    .update({ sync_status: 'validating' })
    .eq('id', input.campaignId)

  const preflight = await validateMetaCampaignAction({
    objective: input.campaign.name,
    dailyBudget: String(input.campaign.dailyBudgetCents),
    totalBudget: null,
    targetCountry: input.campaign.country,
    platforms: input.campaign.platforms,
    hasCreative: !!input.creative.headline,
    hasCopy: !!input.creative.primaryText,
    hasAiStrategy: true,
  })

  if (!preflight.valid) {
    await supabase
      .from('campaigns')
      .update({ sync_status: 'failed', error_message: 'Validación previa falló' })
      .eq('id', input.campaignId)
    return { success: false, reason: 'PREFLIGHT_FAILED', publishStatus: 'failed', error: 'Validación previa falló' }
  }

  // ── Fetch token ────────────────────────────────────────────────
  const { data: conn } = await supabase
    .from('meta_connections')
    .select('access_token_enc')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!conn?.access_token_enc) {
    await supabase
      .from('campaigns')
      .update({ sync_status: 'failed', error_message: 'Token Meta no disponible' })
      .eq('id', input.campaignId)
    return { success: false, reason: 'ERROR', publishStatus: 'failed', error: 'Token Meta no disponible' }
  }

  let accessToken: string
  try {
    accessToken = decryptMetaToken(conn.access_token_enc as string)
  } catch {
    await supabase
      .from('campaigns')
      .update({ sync_status: 'failed', error_message: 'No se pudo descifrar el token' })
      .eq('id', input.campaignId)
    return { success: false, reason: 'ERROR', publishStatus: 'failed', error: 'No se pudo descifrar el token' }
  }

  // ── Mark publishing ────────────────────────────────────────────
  await supabase
    .from('campaigns')
    .update({ sync_status: 'publishing' })
    .eq('id', input.campaignId)

  const result = await publishCampaignToMeta(accessToken, payload)
  const now = new Date().toISOString()

  if (result.success) {
    await supabase
      .from('campaigns')
      .update({
        sync_status: 'published',
        meta_campaign_id: result.metaCampaignId ?? null,
        meta_adset_id: result.metaAdSetId ?? null,
        meta_creative_id: result.metaCreativeId ?? null,
        meta_ad_id: result.metaAdId ?? null,
        last_sync: now,
        error_message: null,
      })
      .eq('id', input.campaignId)

    return {
      success: true,
      publishStatus: 'published',
      metaCampaignId: result.metaCampaignId,
      metaAdSetId: result.metaAdSetId,
      metaCreativeId: result.metaCreativeId,
      metaAdId: result.metaAdId,
    }
  }

  const publishStatus =
    result.reason === 'DISABLED' ? 'ready' :
    result.reason === 'PARTIAL_FAILURE' ? 'partial_failure' :
    'failed'

  const reason: MetaPublishResult['reason'] =
    result.reason === 'DISABLED' ? 'META_PUBLISH_DISABLED' :
    result.reason === 'PARTIAL_FAILURE' ? 'PARTIAL_FAILURE' :
    'ERROR'

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
    .eq('id', input.campaignId)

  return {
    success: false,
    reason,
    publishStatus,
    metaCampaignId: result.metaCampaignId,
    metaAdSetId: result.metaAdSetId,
    metaAdId: result.metaAdId,
    error: result.error,
  }
}
