export interface MetaAdAccount {
  id: string
  name: string
  currency: string
  account_status: number
  timezone_name?: string
}

export interface MetaPage {
  id: string
  name: string
  category?: string
  picture?: { data?: { url?: string } }
}

export interface MetaInstagramAccount {
  id: string
  username: string
  name?: string
  profile_picture_url?: string
}

export interface MetaBusinessPortfolio {
  id: string
  name: string
}

export interface MetaUserInfo {
  id: string
  name: string
}

export interface MetaTokenResponse {
  access_token: string
  token_type: string
  expires_in?: number
}

export interface MetaConnection {
  id: string
  userId: string
  metaUserId: string
  metaUserName: string | null
  tokenType: string
  expiresAt: string | null
  scopes: string[]
  selectedAdAccountId: string | null
  selectedAdAccountName: string | null
  selectedPageId: string | null
  selectedPageName: string | null
  selectedInstagramId: string | null
  businessPortfolio: MetaBusinessPortfolio | null
  adAccounts: MetaAdAccount[]
  pages: MetaPage[]
  instagramAccounts: MetaInstagramAccount[]
  createdAt: string
  updatedAt: string
}

export interface MetaAccountSelection {
  adAccountId: string
  adAccountName: string
  pageId?: string | null
  pageName?: string | null
  instagramId?: string | null
}
