'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { ActionResult } from '@/types'

const productSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido').max(150),
  description: z.string().max(1000).nullable().optional(),
  category: z.string().nullable().optional(),
  price: z.number().positive().nullable().optional(),
  currency: z.string().default('USD'),
  is_active: z.boolean().default(true),
  images: z.array(z.string()).default([]),
})

export type ProductInput = z.infer<typeof productSchema>

export async function createProductAction(input: ProductInput): Promise<ActionResult<string>> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'No autenticado' }

    const parsed = productSchema.safeParse(input)
    if (!parsed.success) {
      return { success: false, error: parsed.error.errors[0]?.message ?? 'Datos inválidos' }
    }

    const { count } = await supabase
      .from('products')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)

    if ((count ?? 0) >= 200) {
      return { success: false, error: 'Límite de productos alcanzado' }
    }

    const d = parsed.data
    const { data, error } = await supabase
      .from('products')
      .insert({
        user_id: user.id,
        name: d.name,
        description: d.description ?? null,
        category: d.category ?? null,
        price: d.price ?? null,
        currency: d.currency,
        is_active: d.is_active,
        images: JSON.parse(JSON.stringify(d.images)),
      })
      .select('id')
      .single()

    const row = data as { id: string } | null
    if (error || !row) {
      console.error('[createProductAction]', error)
      return { success: false, error: 'Error al crear el producto' }
    }

    revalidatePath('/products')
    return { success: true, data: row.id }
  } catch (err) {
    console.error('[createProductAction]', err)
    return { success: false, error: 'Error inesperado' }
  }
}

export async function updateProductAction(id: string, input: ProductInput): Promise<ActionResult<void>> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'No autenticado' }

    const parsed = productSchema.safeParse(input)
    if (!parsed.success) {
      return { success: false, error: parsed.error.errors[0]?.message ?? 'Datos inválidos' }
    }

    const d = parsed.data
    const { error } = await supabase
      .from('products')
      .update({
        name: d.name,
        description: d.description ?? null,
        category: d.category ?? null,
        price: d.price ?? null,
        currency: d.currency,
        is_active: d.is_active,
        images: JSON.parse(JSON.stringify(d.images)),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) {
      console.error('[updateProductAction]', error)
      return { success: false, error: 'Error al actualizar el producto' }
    }

    revalidatePath('/products')
    return { success: true, data: undefined }
  } catch (err) {
    console.error('[updateProductAction]', err)
    return { success: false, error: 'Error inesperado' }
  }
}

export async function deleteProductAction(id: string): Promise<ActionResult<void>> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'No autenticado' }

    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) {
      console.error('[deleteProductAction]', error)
      return { success: false, error: 'Error al eliminar el producto' }
    }

    revalidatePath('/products')
    return { success: true, data: undefined }
  } catch (err) {
    console.error('[deleteProductAction]', err)
    return { success: false, error: 'Error inesperado' }
  }
}

export async function assignCreativeToCampaignAction(
  creativeId: string,
  campaignId: string,
  imageUrl: string,
): Promise<ActionResult<void>> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'No autenticado' }

    const { error: e1 } = await supabase
      .from('campaign_creatives')
      .update({ campaign_id: campaignId, is_primary: true })
      .eq('id', creativeId)
      .eq('user_id', user.id)

    if (e1) return { success: false, error: 'Error asignando creativo' }

    const { error: e2 } = await supabase
      .from('campaigns')
      .update({ flyer_url: imageUrl })
      .eq('id', campaignId)
      .eq('user_id', user.id)

    if (e2) return { success: false, error: 'Error actualizando campaña' }

    revalidatePath(`/campaigns/${campaignId}`)
    revalidatePath(`/campaigns/${campaignId}/review`)
    revalidatePath('/products')
    return { success: true, data: undefined }
  } catch (err) {
    console.error('[assignCreativeToCampaignAction]', err)
    return { success: false, error: 'Error inesperado' }
  }
}

export async function toggleCreativeFavoriteAction(
  creativeId: string,
  isFavorite: boolean,
): Promise<ActionResult<void>> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'No autenticado' }

    const { error } = await supabase
      .from('campaign_creatives')
      .update({ is_favorite: isFavorite })
      .eq('id', creativeId)
      .eq('user_id', user.id)

    if (error) return { success: false, error: 'Error actualizando favorito' }
    revalidatePath('/products')
    return { success: true, data: undefined }
  } catch (err) {
    console.error('[toggleCreativeFavoriteAction]', err)
    return { success: false, error: 'Error inesperado' }
  }
}

export async function deleteCreativeAction(
  creativeId: string,
  storagePath?: string,
): Promise<ActionResult<void>> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'No autenticado' }

    const { error } = await supabase
      .from('campaign_creatives')
      .delete()
      .eq('id', creativeId)
      .eq('user_id', user.id)

    if (error) return { success: false, error: 'Error eliminando creativo' }

    if (storagePath) {
      await supabase.storage.from('product-images').remove([storagePath])
    }

    revalidatePath('/products')
    return { success: true, data: undefined }
  } catch (err) {
    console.error('[deleteCreativeAction]', err)
    return { success: false, error: 'Error inesperado' }
  }
}
