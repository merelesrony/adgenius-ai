'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  loginSchema,
  registerSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  updateProfileSchema,
} from '@/lib/validations/auth'
import type { ActionResult } from '@/types'

// ─── Login ──────────────────────────────────────────────────────────────────

export async function loginAction(
  _prevState: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const raw = {
    email: formData.get('email'),
    password: formData.get('password'),
  }

  const parsed = loginSchema.safeParse(raw)
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0].message }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword(parsed.data)

  if (error) {
    if (error.message.includes('Invalid login credentials')) {
      return { success: false, error: 'Email o contraseña incorrectos' }
    }
    if (error.message.includes('Email not confirmed')) {
      return { success: false, error: 'Confirma tu email antes de iniciar sesión' }
    }
    return { success: false, error: 'Error al iniciar sesión. Intenta de nuevo.' }
  }

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

// ─── Register ────────────────────────────────────────────────────────────────

export async function registerAction(
  _prevState: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const raw = {
    email: formData.get('email'),
    password: formData.get('password'),
    confirmPassword: formData.get('confirmPassword'),
    businessName: formData.get('businessName'),
    country: formData.get('country'),
    category: formData.get('category'),
    acceptTerms: formData.get('acceptTerms') === 'on' ? true : formData.get('acceptTerms'),
  }

  const parsed = registerSchema.safeParse(raw)
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0].message }
  }

  const supabase = await createClient()
  const headersList = await headers()
  const origin = headersList.get('origin') ?? process.env.NEXT_PUBLIC_APP_URL

  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      emailRedirectTo: `${origin}/auth/callback`,
    },
  })

  if (error) {
    if (error.message.includes('already registered')) {
      return { success: false, error: 'Ya existe una cuenta con ese email' }
    }
    return { success: false, error: 'Error al crear la cuenta. Intenta de nuevo.' }
  }

  if (!data.user) {
    return { success: false, error: 'No se pudo crear la cuenta' }
  }

  // Create business profile using admin client (bypasses RLS)
  const admin = createAdminClient()
  await admin.from('businesses').insert({
    user_id: data.user.id,
    name: parsed.data.businessName,
    country: parsed.data.country,
    category: parsed.data.category,
  })

  // Assign starter plan
  const { data: starterPlan } = await admin
    .from('plans')
    .select('id')
    .eq('name', 'starter')
    .single()

  if (starterPlan) {
    const trialEnd = new Date()
    trialEnd.setDate(trialEnd.getDate() + 14) // 14-day trial

    await admin.from('subscriptions').insert({
      user_id: data.user.id,
      plan_id: starterPlan.id,
      status: 'trial',
      trial_ends_at: trialEnd.toISOString(),
    })
  }

  return { success: true, data: undefined }
}

// ─── Logout ──────────────────────────────────────────────────────────────────

export async function logoutAction() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}

// ─── Forgot Password ─────────────────────────────────────────────────────────

export async function forgotPasswordAction(
  _prevState: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const raw = { email: formData.get('email') }
  const parsed = forgotPasswordSchema.safeParse(raw)

  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0].message }
  }

  const supabase = await createClient()
  const headersList = await headers()
  const origin = headersList.get('origin') ?? process.env.NEXT_PUBLIC_APP_URL

  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${origin}/auth/callback?next=/reset-password`,
  })

  if (error) {
    return { success: false, error: 'Error al enviar el correo. Intenta de nuevo.' }
  }

  return { success: true, data: undefined }
}

// ─── Reset Password ───────────────────────────────────────────────────────────

export async function resetPasswordAction(
  _prevState: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const raw = {
    password: formData.get('password'),
    confirmPassword: formData.get('confirmPassword'),
  }

  const parsed = resetPasswordSchema.safeParse(raw)
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0].message }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password })

  if (error) {
    return { success: false, error: 'No se pudo actualizar la contraseña' }
  }

  revalidatePath('/', 'layout')
  redirect('/login')
}

// ─── Update Business Profile ──────────────────────────────────────────────────

export async function updateProfileAction(
  _prevState: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const raw = {
    businessName: formData.get('businessName'),
    country: formData.get('country'),
    city: formData.get('city'),
    phone: formData.get('phone'),
    website: formData.get('website'),
    category: formData.get('category'),
    description: formData.get('description'),
  }

  const parsed = updateProfileSchema.safeParse(raw)
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0].message }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'No autenticado' }

  const { error } = await supabase
    .from('businesses')
    .upsert({
      user_id: user.id,
      name: parsed.data.businessName,
      country: parsed.data.country,
      city: parsed.data.city ?? null,
      phone: parsed.data.phone ?? null,
      website: parsed.data.website ?? null,
      category: parsed.data.category,
      description: parsed.data.description ?? null,
    })

  if (error) {
    return { success: false, error: 'Error al guardar los cambios' }
  }

  revalidatePath('/profile')
  revalidatePath('/settings')
  return { success: true, data: undefined }
}
