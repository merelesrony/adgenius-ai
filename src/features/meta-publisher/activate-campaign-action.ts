'use server'

import { createClient } from '@/lib/supabase/server'
import { decryptMetaToken } from '@/lib/meta/meta-auth'
import { activateMetaObjects } from './meta-publisher'

export interface ActivateCampaignResult {
  success: boolean
  error?: string
}

function classifyMetaError(raw: string): string {
  const msg = raw.toLowerCase()
  if (msg.includes('token') || msg.includes('oauth') || msg.includes('session')) {
    return 'Tu sesión con Meta expiró. Ve a Configuración → Meta Ads y vuelve a conectar tu cuenta.'
  }
  if (msg.includes('permission') || msg.includes('authorized')) {
    return 'No tienes permisos para activar esta campaña. Verifica los permisos de tu cuenta Meta.'
  }
  if (msg.includes('billing') || msg.includes('payment') || msg.includes('spend limit')) {
    return 'Hay un problema de facturación en tu cuenta Meta. Revisa tu método de pago.'
  }
  if (msg.includes('account disabled') || msg.includes('account suspended')) {
    return 'Tu cuenta publicitaria de Meta está deshabilitada. Contacta el soporte de Meta.'
  }
  return 'Error al activar en Meta. Intenta de nuevo o activa la campaña directamente en el Administrador de Anuncios.'
}

export async function activateMetaCampaignAction(
  campaignId: string,
): Promise<ActivateCampaignResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: 'No autenticado' }
  }

  // Fetch campaign scoped to this user (RLS enforced)
  const { data: campaign } = await supabase
    .from('campaigns')
    .select('id, sync_status, status, meta_campaign_id, meta_adset_id, meta_ad_id')
    .eq('id', campaignId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!campaign) {
    return { success: false, error: 'Campaña no encontrada' }
  }

  if (campaign.sync_status !== 'published') {
    return {
      success: false,
      error: `La campaña no está lista para activar (estado: ${campaign.sync_status})`,
    }
  }

  if (!campaign.meta_campaign_id) {
    return { success: false, error: 'Esta campaña no tiene un ID de Meta asociado' }
  }

  // Fetch Meta connection token
  const { data: conn } = await supabase
    .from('meta_connections')
    .select('access_token_enc')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!conn?.access_token_enc) {
    return {
      success: false,
      error: 'Cuenta de Meta no conectada. Ve a Configuración → Meta Ads.',
    }
  }

  let accessToken: string
  try {
    accessToken = decryptMetaToken(conn.access_token_enc as string)
  } catch {
    return {
      success: false,
      error: 'Error al descifrar el token de Meta. Vuelve a conectar tu cuenta.',
    }
  }

  console.log('[MetaActivate]', {
    action: 'activate',
    campaignId,
    userId: user.id,
    metaCampaignId: campaign.meta_campaign_id,
  })

  const result = await activateMetaObjects(accessToken, {
    metaCampaignId: campaign.meta_campaign_id as string,
    metaAdSetId: campaign.meta_adset_id as string | null,
    metaAdId: campaign.meta_ad_id as string | null,
  })

  if (!result.success) {
    const friendlyError = result.error ? classifyMetaError(result.error) : 'Error al activar en Meta'
    console.error('[MetaActivate] failed', { campaignId, userId: user.id })
    return { success: false, error: friendlyError }
  }

  const now = new Date().toISOString()
  await supabase
    .from('campaigns')
    .update({ status: 'active', last_sync: now })
    .eq('id', campaignId)
    .eq('user_id', user.id)

  console.log('[MetaActivate] activated', { campaignId, userId: user.id })
  return { success: true }
}
