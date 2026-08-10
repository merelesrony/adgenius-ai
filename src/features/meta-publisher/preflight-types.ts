export type PreflightCheckKey =
  | 'meta_connection'
  | 'token_valid'
  | 'token_not_expired'
  | 'ad_account_selected'
  | 'ad_account_exists'
  | 'ad_account_active'
  | 'ad_account_currency'
  | 'facebook_page'
  | 'destination_url'
  | 'creative'
  | 'copy'
  | 'objective'
  | 'budget'
  | 'targeting'

export type PreflightCheckStatus = 'passed' | 'failed' | 'warning' | 'skipped'

export interface PreflightCheck {
  key: PreflightCheckKey
  label: string
  status: PreflightCheckStatus
  message?: string
  actionPath?: string
}

export interface PreflightResult {
  valid: boolean
  checks: PreflightCheck[]
  metaCurrency?: string
  metaAdAccountName?: string
  dryRun: boolean
}

export interface PreflightInput {
  objective?: string | null
  dailyBudget?: string | null
  totalBudget?: string | null
  targetCountry?: string | null
  platforms?: string[] | null
  hasCreative: boolean
  hasCopy: boolean
  hasAiStrategy: boolean
}
