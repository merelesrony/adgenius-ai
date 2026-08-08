import type { MetaAdAccount, MetaPage, MetaInstagramAccount, MetaBusinessPortfolio } from '@/lib/meta/meta-types'

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
