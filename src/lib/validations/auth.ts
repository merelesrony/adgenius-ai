import { z } from 'zod'

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'El email es requerido')
    .email('Ingresa un email válido'),
  password: z
    .string()
    .min(1, 'La contraseña es requerida')
    .min(6, 'La contraseña debe tener al menos 6 caracteres'),
})

export const registerSchema = z
  .object({
    email: z
      .string()
      .min(1, 'El email es requerido')
      .email('Ingresa un email válido'),
    password: z
      .string()
      .min(8, 'La contraseña debe tener al menos 8 caracteres')
      .regex(/[A-Z]/, 'Debe contener al menos una mayúscula')
      .regex(/[0-9]/, 'Debe contener al menos un número'),
    confirmPassword: z.string().min(1, 'Confirma tu contraseña'),
    businessName: z
      .string()
      .min(2, 'El nombre del negocio debe tener al menos 2 caracteres')
      .max(100, 'El nombre es demasiado largo'),
    country: z.string().min(1, 'El país es requerido'),
    category: z.string().min(1, 'La categoría es requerida'),
    acceptTerms: z.literal(true, {
      errorMap: () => ({ message: 'Debes aceptar los términos y condiciones' }),
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  })

export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, 'El email es requerido')
    .email('Ingresa un email válido'),
})

export const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, 'La contraseña debe tener al menos 8 caracteres')
      .regex(/[A-Z]/, 'Debe contener al menos una mayúscula')
      .regex(/[0-9]/, 'Debe contener al menos un número'),
    confirmPassword: z.string().min(1, 'Confirma tu contraseña'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  })

export const updateProfileSchema = z.object({
  businessName: z
    .string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(100),
  country: z.string().min(1, 'El país es requerido'),
  city: z.string().optional(),
  phone: z.string().optional(),
  website: z.string().url('Ingresa una URL válida').optional().or(z.literal('')),
  category: z.string().min(1, 'La categoría es requerida'),
  description: z.string().max(500, 'Máximo 500 caracteres').optional(),
})

export type LoginInput = z.infer<typeof loginSchema>
export type RegisterInput = z.infer<typeof registerSchema>
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>
