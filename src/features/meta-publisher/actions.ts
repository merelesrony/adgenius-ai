'use server'

import { createClient } from '@/lib/supabase/server'
import { decryptMetaToken } from '@/lib/meta/meta-auth'
import { getAdAccountDetails, getPageDetails } from '@/lib/meta/meta-client'
import { validateDestinationUrl } from '@/lib/meta/meta-publisher-utils'
import type {
  PreflightInput,
  PreflightResult,
  PreflightCheck,
  PreflightCheckKey,
  PreflightCheckStatus,
} from './preflight-types'

const DRY_RUN = process.env.META_DRY_RUN === 'true'

function mk(
  key: PreflightCheckKey,
  label: string,
  status: PreflightCheckStatus,
  message?: string,
  actionPath?: string,
): PreflightCheck {
  return { key, label, status, message, actionPath }
}

function getCampaignDataChecks(input: PreflightInput): PreflightCheck[] {
  const daily = parseFloat(String(input.dailyBudget ?? '0'))
  return [
    input.hasCreative
      ? mk('creative', 'Creativo seleccionado', 'passed')
      : mk('creative', 'Creativo seleccionado', 'failed', 'Vuelve al paso de creativos y selecciona uno.'),
    input.hasCopy
      ? mk('copy', 'Copy de campaña', 'passed')
      : mk('copy', 'Copy de campaña', 'failed', 'Genera la estrategia IA para obtener el copy.'),
    input.objective
      ? mk('objective', 'Objetivo de campaña', 'passed', input.objective)
      : mk('objective', 'Objetivo de campaña', 'failed', 'Selecciona un objetivo en el paso de estrategia.'),
    daily > 0
      ? mk('budget', 'Presupuesto diario', 'passed')
      : mk('budget', 'Presupuesto diario', 'failed', 'Define un presupuesto diario mayor a 0.'),
    input.targetCountry
      ? mk('targeting', 'Segmentación geográfica', 'passed', input.targetCountry)
      : mk('targeting', 'Segmentación geográfica', 'failed', 'Selecciona un país objetivo en el paso de ubicación.'),
  ]
}

export async function validateMetaCampaignAction(
  input: PreflightInput,
): Promise<PreflightResult> {
  const checks: PreflightCheck[] = []
  let metaCurrency: string | undefined
  let metaAdAccountName: string | undefined

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return {
      valid: false,
      checks: [mk('meta_connection', 'Conexión Meta', 'failed', 'Sesión expirada. Inicia sesión nuevamente.')],
      dryRun: DRY_RUN,
    }
  }

  // ── Check 1: Meta connection exists ──────────────────────────
  const { data: conn } = await supabase
    .from('meta_connections')
    .select(
      'access_token_enc, expires_at, selected_ad_account_id, selected_ad_account_name, selected_page_id, selected_page_name',
    )
    .eq('user_id', user.id)
    .maybeSingle()

  if (!conn) {
    return {
      valid: false,
      dryRun: DRY_RUN,
      checks: [
        mk('meta_connection', 'Conexión Meta', 'failed', 'Meta no está conectado. Configura la integración en Ajustes.', '/settings'),
        mk('token_valid', 'Token de acceso', 'skipped'),
        mk('token_not_expired', 'Token vigente', 'skipped'),
        mk('ad_account_selected', 'Cuenta publicitaria', 'skipped'),
        mk('ad_account_exists', 'Verificación en Meta', 'skipped'),
        mk('ad_account_active', 'Cuenta activa', 'skipped'),
        mk('ad_account_currency', 'Moneda de cuenta', 'skipped'),
        mk('facebook_page', 'Página de Facebook', 'skipped'),
        mk('destination_url', 'URL de destino', 'skipped'),
        ...getCampaignDataChecks(input),
      ],
    }
  }
  checks.push(mk('meta_connection', 'Conexión Meta', 'passed'))

  // ── Check 2: Token decrypt ────────────────────────────────────
  let accessToken: string
  try {
    accessToken = decryptMetaToken(conn.access_token_enc as string)
    checks.push(mk('token_valid', 'Token de acceso', 'passed'))
  } catch {
    return {
      valid: false,
      dryRun: DRY_RUN,
      checks: [
        ...checks,
        mk('token_valid', 'Token de acceso', 'failed', 'El token no pudo descifrarse. Reconecta tu cuenta Meta.', '/settings'),
        mk('token_not_expired', 'Token vigente', 'skipped'),
        mk('ad_account_selected', 'Cuenta publicitaria', 'skipped'),
        mk('ad_account_exists', 'Verificación en Meta', 'skipped'),
        mk('ad_account_active', 'Cuenta activa', 'skipped'),
        mk('ad_account_currency', 'Moneda de cuenta', 'skipped'),
        mk('facebook_page', 'Página de Facebook', 'skipped'),
        mk('destination_url', 'URL de destino', 'skipped'),
        ...getCampaignDataChecks(input),
      ],
    }
  }

  // ── Check 3: Token expiry ─────────────────────────────────────
  const expiresAt = conn.expires_at as string | null
  if (expiresAt) {
    const expiresMs = new Date(expiresAt).getTime()
    if (isNaN(expiresMs)) {
      checks.push(mk('token_not_expired', 'Token vigente', 'warning', 'No se pudo verificar la fecha de expiración del token.'))
    } else if (expiresMs < Date.now()) {
      checks.push(mk('token_not_expired', 'Token vigente', 'failed', 'El token de Meta ha expirado. Reconecta tu cuenta en Ajustes.', '/settings'))
    } else {
      const daysLeft = Math.ceil((expiresMs - Date.now()) / 86_400_000)
      checks.push(
        daysLeft <= 7
          ? mk('token_not_expired', 'Token vigente', 'warning', `El token expira en ${daysLeft} día(s). Considera reconectar pronto.`)
          : mk('token_not_expired', 'Token vigente', 'passed'),
      )
    }
  } else {
    // No expiry stored — token was obtained without expires_in (no warning needed)
    checks.push(mk('token_not_expired', 'Token vigente', 'passed'))
  }

  // ── Check 4: Ad account selected ─────────────────────────────
  const adAccountId = conn.selected_ad_account_id as string | null
  const adAccountName = conn.selected_ad_account_name as string | null

  if (!adAccountId) {
    checks.push(mk('ad_account_selected', 'Cuenta publicitaria', 'failed', 'Selecciona una cuenta publicitaria en Ajustes → Meta Ads.', '/settings'))
    checks.push(mk('ad_account_exists', 'Verificación en Meta', 'skipped'))
    checks.push(mk('ad_account_active', 'Cuenta activa', 'skipped'))
    checks.push(mk('ad_account_currency', 'Moneda de cuenta', 'skipped'))
  } else {
    checks.push(mk('ad_account_selected', 'Cuenta publicitaria', 'passed', adAccountName ?? adAccountId))

    try {
      const acct = await getAdAccountDetails(accessToken, adAccountId)
      metaCurrency = acct.currency
      metaAdAccountName = acct.name
      checks.push(mk('ad_account_exists', 'Verificación en Meta', 'passed', acct.name))
      checks.push(
        acct.account_status === 1
          ? mk('ad_account_active', 'Cuenta activa', 'passed')
          : mk('ad_account_active', 'Cuenta activa', 'warning', `Estado de cuenta: ${acct.account_status}. Puede no estar activa para publicar.`),
      )
      checks.push(mk('ad_account_currency', 'Moneda de cuenta', 'passed', acct.currency))
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al verificar la cuenta'
      checks.push(mk('ad_account_exists', 'Verificación en Meta', 'failed', msg))
      checks.push(mk('ad_account_active', 'Cuenta activa', 'skipped'))
      checks.push(mk('ad_account_currency', 'Moneda de cuenta', 'skipped'))
    }
  }

  // ── Check 5: Facebook page ────────────────────────────────────
  const pageId = conn.selected_page_id as string | null
  const pageName = conn.selected_page_name as string | null

  if (!pageId) {
    checks.push(mk('facebook_page', 'Página de Facebook', 'warning', 'Sin página seleccionada. Recomendado para anuncios con identidad de marca.', '/settings'))
  } else {
    const page = await getPageDetails(accessToken, pageId)
    if (page) {
      checks.push(mk('facebook_page', 'Página de Facebook', 'passed', pageName ?? page.name))
    } else {
      checks.push(mk('facebook_page', 'Página de Facebook', 'failed', 'No se pudo acceder a la página. Verifica los permisos en Meta.', '/settings'))
    }
  }

  // ── Check 6: Destination URL (businesses.website) ─────────────
  const { data: business } = await supabase
    .from('businesses')
    .select('website')
    .eq('user_id', user.id)
    .maybeSingle()

  const urlValidation = validateDestinationUrl(business?.website)
  if (urlValidation.valid) {
    checks.push(mk('destination_url', 'URL de destino', 'passed', urlValidation.url))
  } else {
    checks.push(
      mk(
        'destination_url',
        'URL de destino',
        'failed',
        urlValidation.error + ' Agrega tu sitio web en Configuración.',
        '/settings/profile',
      ),
    )
  }

  // ── Checks 7–11: Campaign data ────────────────────────────────
  checks.push(...getCampaignDataChecks(input))

  const hasFailures = checks.some(c => c.status === 'failed')
  return { valid: !hasFailures, checks, metaCurrency, metaAdAccountName, dryRun: DRY_RUN }
}
