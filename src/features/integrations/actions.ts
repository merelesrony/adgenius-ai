'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { MetaConnectionRow, UpdateMetaSelectionInput } from './types'
import type { MetaAdAccount, MetaPage, MetaInstagramAccount, MetaBusinessPortfolio } from '@/lib/meta/meta-types'

type Json = unknown

function toAdAccounts(v: Json): MetaAdAccount[] {
  return Array.isArray(v) ? (v as MetaAdAccount[]) : []
}
function toPages(v: Json): MetaPage[] {
  return Array.isArray(v) ? (v as MetaPage[]) : []
}
function toInstagram(v: Json): MetaInstagramAccount[] {
  return Array.isArray(v) ? (v as MetaInstagramAccount[]) : []
}
function toPortfolio(v: Json): MetaBusinessPortfolio | null {
  if (v && typeof v === 'object' && !Array.isArray(v)) {
    return v as MetaBusinessPortfolio
  }
  return null
}

export async function getMetaConnectionAction(): Promise<MetaConnectionRow | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data, error } = await supabase
    .from('meta_connections')
    .select(`
      id, meta_user_id, meta_user_name, token_type, expires_at, scopes,
      selected_ad_account_id, selected_ad_account_name,
      selected_page_id, selected_page_name, selected_instagram_id,
      business_portfolio, ad_accounts, pages, instagram_accounts,
      created_at, updated_at
    `)
    .eq('user_id', user.id)
    .maybeSingle()

  if (error || !data) return null

  return {
    id: data.id as string,
    meta_user_id: data.meta_user_id as string,
    meta_user_name: (data.meta_user_name as string | null) ?? null,
    token_type: (data.token_type as string) ?? 'bearer',
    expires_at: (data.expires_at as string | null) ?? null,
    scopes: Array.isArray(data.scopes) ? (data.scopes as string[]) : [],
    selected_ad_account_id: (data.selected_ad_account_id as string | null) ?? null,
    selected_ad_account_name: (data.selected_ad_account_name as string | null) ?? null,
    selected_page_id: (data.selected_page_id as string | null) ?? null,
    selected_page_name: (data.selected_page_name as string | null) ?? null,
    selected_instagram_id: (data.selected_instagram_id as string | null) ?? null,
    business_portfolio: toPortfolio(data.business_portfolio),
    ad_accounts: toAdAccounts(data.ad_accounts),
    pages: toPages(data.pages),
    instagram_accounts: toInstagram(data.instagram_accounts),
    created_at: data.created_at as string,
    updated_at: data.updated_at as string,
  }
}

export async function updateMetaSelectionAction(
  input: UpdateMetaSelectionInput,
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'No autenticado' }

    const { error } = await supabase
      .from('meta_connections')
      .update({
        selected_ad_account_id: input.adAccountId,
        selected_ad_account_name: input.adAccountName,
        selected_page_id: input.pageId ?? null,
        selected_page_name: input.pageName ?? null,
        selected_instagram_id: input.instagramId ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', user.id)

    if (error) return { success: false, error: error.message }

    revalidatePath('/settings')
    return { success: true }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Error inesperado' }
  }
}
