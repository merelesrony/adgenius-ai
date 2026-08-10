import { graphPost } from '@/lib/meta/meta-client'
import {
  normalizeAdAccountId,
  mapCreativeCtaToMeta,
  normalizeMetaPublisherPlatforms,
  getMetaOptimizationSettings,
} from '@/lib/meta/meta-publisher-utils'
import type { MetaPublishPayload, MetaObjectResult } from './publisher-types'

const PUBLISH_ENABLED = process.env.META_PUBLISH_ENABLED === 'true'

export interface MetaPublisherResult {
  success: boolean
  reason?: 'DISABLED' | 'PARTIAL_FAILURE' | 'ERROR'
  metaCampaignId?: string
  metaAdSetId?: string
  metaCreativeId?: string
  metaAdId?: string
  error?: string
}

// ── Creation helpers ────────────────────────────────────────────────────────

async function createMetaCampaign(
  token: string,
  payload: MetaPublishPayload,
): Promise<MetaObjectResult> {
  const { target, campaign } = payload
  const adAccountId = normalizeAdAccountId(target.adAccountId)
  const { metaObjective } = getMetaOptimizationSettings(campaign.objective)

  const campaignBody = {
    name: campaign.name,
    objective: metaObjective,
    status: 'PAUSED',
    special_ad_categories: [],
    is_adset_budget_sharing_enabled: false,
  }
  console.log('[MetaPublish] Campaign payload', {
    endpoint: `/act_${adAccountId}/campaigns`,
    rawObjective: campaign.objective,
    ...campaignBody,
  })

  return graphPost<MetaObjectResult>(`/act_${adAccountId}/campaigns`, token, campaignBody)
}

async function createMetaAdSet(
  token: string,
  payload: MetaPublishPayload,
  campaignId: string,
): Promise<MetaObjectResult> {
  const { target, campaign } = payload
  const adAccountId = normalizeAdAccountId(target.adAccountId)
  const { optimizationGoal, billingEvent } = getMetaOptimizationSettings(campaign.objective)
  const publisherPlatforms = normalizeMetaPublisherPlatforms(campaign.platforms)

  const geoLocations: Record<string, unknown> = {
    countries: [campaign.country],
  }
  if (campaign.city && campaign.radiusKm) {
    geoLocations.cities = [
      { key: campaign.city, radius: campaign.radiusKm, distance_unit: 'kilometer' },
    ]
  }

  // With advantage_audience=1, Meta treats age_max as a suggestion and requires
  // it to be at least 65. Values below 65 are rejected (error_subcode 1870189).
  const effectiveAgeMax = Math.max(campaign.ageMax, 65)

  const targeting: Record<string, unknown> = {
    geo_locations: geoLocations,
    age_min: campaign.ageMin,
    age_max: effectiveAgeMax,
    publisher_platforms: publisherPlatforms,
    targeting_automation: { advantage_audience: 1 },
  }

  // Gender: omit the field entirely for 'all' (Meta default)
  if (campaign.gender === 'male') targeting.genders = [1]
  else if (campaign.gender === 'female') targeting.genders = [2]

  // TEST A: flexible_spec temporarily removed to isolate error 1885097.
  // Interests (AI-generated strings without Meta IDs) are suspected as the cause.
  // Restore once Meta accepts the Ad Set without flexible_spec.
  // if (campaign.interests.length > 0) {
  //   targeting.flexible_spec = [
  //     {
  //       interests: campaign.interests.map(i =>
  //         typeof i === 'string' ? { name: i } : { ...(i.id ? { id: i.id } : {}), name: i.name },
  //       ),
  //     },
  //   ]
  // }

  const adSetBody = {
    name: `${campaign.name} — Conjunto`,
    campaign_id: campaignId,
    status: 'PAUSED',
    optimization_goal: optimizationGoal,
    billing_event: billingEvent,
    daily_budget: campaign.dailyBudgetCents,
    bid_strategy: 'LOWEST_COST_WITHOUT_CAP',
    destination_type: 'WEBSITE',
    ...(target.pageId ? { promoted_object: { page_id: target.pageId } } : {}),
    targeting,
  }
  console.log('[MetaPublish] FINAL AdSet request body', {
    endpoint: `/act_${adAccountId}/adsets`,
    body: adSetBody,
    diagnosis: {
      rawObjective: campaign.objective,
      currency: campaign.currency,
      age_min_sent: campaign.ageMin,
      age_max_raw: campaign.ageMax,
      age_max_sent: effectiveAgeMax,
      promoted_object_sent: !!target.pageId,
      promoted_object_page_id: target.pageId ?? '(not sent)',
      destination_type_sent: true,
    },
  })
  console.log('[MetaPublish] AdSet targeting FULL JSON', JSON.stringify(targeting, null, 2))

  return graphPost<MetaObjectResult>(`/act_${adAccountId}/adsets`, token, adSetBody)
}

async function createMetaCreative(
  token: string,
  payload: MetaPublishPayload,
): Promise<MetaObjectResult> {
  const { target, campaign, creative } = payload
  const adAccountId = normalizeAdAccountId(target.adAccountId)
  const ctaCode = mapCreativeCtaToMeta(creative.cta)

  const linkData: Record<string, unknown> = {
    // link is required by Meta API for link_data creatives
    link: creative.destinationUrl,
    message: creative.primaryText,
    name: creative.headline,
    call_to_action: { type: ctaCode },
  }
  if (creative.description) linkData.description = creative.description
  if (creative.imageUrl) linkData.picture = creative.imageUrl

  const objectStorySpec: Record<string, unknown> = { link_data: linkData }
  if (target.pageId) objectStorySpec.page_id = target.pageId

  return graphPost<MetaObjectResult>(`/act_${adAccountId}/adcreatives`, token, {
    name: `${campaign.name} — Creativo`,
    object_story_spec: objectStorySpec,
  })
}

async function createMetaAd(
  token: string,
  payload: MetaPublishPayload,
  adSetId: string,
  creativeId: string,
): Promise<MetaObjectResult> {
  const { target, campaign } = payload
  const adAccountId = normalizeAdAccountId(target.adAccountId)

  return graphPost<MetaObjectResult>(`/act_${adAccountId}/ads`, token, {
    name: `${campaign.name} — Anuncio`,
    adset_id: adSetId,
    creative: { creative_id: creativeId },
    status: 'PAUSED',
  })
}

// ── Rollback helper ─────────────────────────────────────────────────────────

async function attemptRollback(token: string, metaCampaignId: string): Promise<void> {
  try {
    await graphPost(`/${metaCampaignId}`, token, { status: 'DELETED' })
    console.log('[Meta Publisher] Rollback: campaign archived', { metaCampaignId })
  } catch (rollbackErr) {
    console.warn('[Meta Publisher] Rollback failed — campaign remains in Meta', {
      metaCampaignId,
      rollbackError: rollbackErr instanceof Error ? rollbackErr.message : String(rollbackErr),
    })
  }
}

// ── Activation ──────────────────────────────────────────────────────────────

export async function activateMetaObjects(
  token: string,
  opts: {
    metaCampaignId: string
    metaAdSetId?: string | null
    metaAdId?: string | null
  },
): Promise<{ success: boolean; error?: string }> {
  const log = (obj: string, status: string) =>
    console.log('[Meta Publisher]', { action: 'activate', obj, status })

  try {
    log('campaign', 'activating')
    await graphPost(`/${opts.metaCampaignId}`, token, { status: 'ACTIVE' })
    log('campaign', 'activated')

    if (opts.metaAdSetId) {
      log('adset', 'activating')
      await graphPost(`/${opts.metaAdSetId}`, token, { status: 'ACTIVE' })
      log('adset', 'activated')
    }

    if (opts.metaAdId) {
      log('ad', 'activating')
      await graphPost(`/${opts.metaAdId}`, token, { status: 'ACTIVE' })
      log('ad', 'activated')
    }

    return { success: true }
  } catch (err) {
    const error = err instanceof Error ? err.message : 'Error al activar en Meta'
    console.error('[Meta Publisher] activation error', { error })
    return { success: false, error }
  }
}

// ── Main publish function ───────────────────────────────────────────────────

export async function publishCampaignToMeta(
  token: string,
  payload: MetaPublishPayload,
): Promise<MetaPublisherResult> {
  const logCtx = { campaignId: payload.campaignId, userId: payload.userId }

  if (!PUBLISH_ENABLED) {
    console.log('[Meta Publisher] META_PUBLISH_ENABLED=false — skipping creation', logCtx)
    return { success: false, reason: 'DISABLED' }
  }

  const log = (step: string, status: string) =>
    console.log('[MetaPublish]', { ...logCtx, step, status })

  let metaCampaignId: string | undefined
  let metaAdSetId: string | undefined
  let metaCreativeId: string | undefined
  let metaAdId: string | undefined

  try {
    log('campaign', 'creating')
    const c = await createMetaCampaign(token, payload)
    metaCampaignId = c.id
    log('campaign', 'created')

    log('adset', 'creating')
    const s = await createMetaAdSet(token, payload, metaCampaignId)
    metaAdSetId = s.id
    log('adset', 'created')

    log('creative', 'creating')
    const cr = await createMetaCreative(token, payload)
    metaCreativeId = cr.id
    log('creative', 'created')

    log('ad', 'creating')
    const ad = await createMetaAd(token, payload, metaAdSetId, metaCreativeId)
    metaAdId = ad.id
    log('ad', 'created')

    console.log('[MetaPublish] Publication completed PAUSED', logCtx)
    return { success: true, metaCampaignId, metaAdSetId, metaCreativeId, metaAdId }
  } catch (err) {
    const error = err instanceof Error ? err.message : 'Error desconocido al publicar en Meta'
    const isPartial = !!(metaCampaignId || metaAdSetId || metaCreativeId)
    const failedAt = !metaCampaignId
      ? 'campaign'
      : !metaAdSetId
        ? 'adset'
        : !metaCreativeId
          ? 'creative'
          : 'ad'
    // Never log the token or secrets
    console.error('[MetaPublish] error', { ...logCtx, step: failedAt, errorMessage: error })

    // Best-effort rollback: if campaign was created but later steps failed, archive it
    if (metaCampaignId && !metaAdId) {
      await attemptRollback(token, metaCampaignId)
    }

    return {
      success: false,
      reason: isPartial ? 'PARTIAL_FAILURE' : 'ERROR',
      metaCampaignId,
      metaAdSetId,
      metaCreativeId,
      metaAdId,
      error,
    }
  }
}
