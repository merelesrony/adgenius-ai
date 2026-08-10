import type { MetaAdAccount, MetaPage, MetaInstagramAccount, MetaBusinessPortfolio, MetaTokenStatus } from '@/lib/meta/meta-types'

/** Status of the Meta connection, safe to expose to UI (no tokens or secrets) */
export type MetaConnectionStatusValue = MetaTokenStatus | 'invalid' | 'missing'

export interface MetaConnectionStatus {
  connected: boolean
  /** 'missing' = no connection row; 'invalid' = token decrypt failed; others from MetaTokenStatus */
  status: MetaConnectionStatusValue
  expiresAt: string | null
  selectedAdAccount: { id: string; name: string } | null
  selectedPage: { id: string; name: string } | null
  selectedInstagram: { id: string } | null
}

export interface MetaConnectionRow {
  id: string
  meta_user_id: string
  meta_user_name: string | null
  token_type: string
  expires_at: string | null
  scopes: string[]
  selected_ad_account_id: string | null
  selected_ad_account_name: string | null
  selected_page_id: string | null
  selected_page_name: string | null
  selected_instagram_id: string | null
  business_portfolio: MetaBusinessPortfolio | null
  ad_accounts: MetaAdAccount[]
  pages: MetaPage[]
  instagram_accounts: MetaInstagramAccount[]
  created_at: string
  updated_at: string
}

export interface UpdateMetaSelectionInput {
  adAccountId: string
  adAccountName: string
  pageId?: string | null
  pageName?: string | null
  instagramId?: string | null
}
