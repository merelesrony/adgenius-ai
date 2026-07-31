import type { Database } from './database'

// Table row types
export type Profile = Database['public']['Tables']['profiles']['Row']
export type Business = Database['public']['Tables']['businesses']['Row']
export type Plan = Database['public']['Tables']['plans']['Row']
export type Subscription = Database['public']['Tables']['subscriptions']['Row']
export type Product = Database['public']['Tables']['products']['Row']
export type Campaign = Database['public']['Tables']['campaigns']['Row']
export type AuditLog = Database['public']['Tables']['audit_logs']['Row']

// Insert types
export type InsertBusiness = Database['public']['Tables']['businesses']['Insert']
export type InsertProduct = Database['public']['Tables']['products']['Insert']
export type InsertCampaign = Database['public']['Tables']['campaigns']['Insert']

// Update types
export type UpdateBusiness = Database['public']['Tables']['businesses']['Update']
export type UpdateProduct = Database['public']['Tables']['products']['Update']
export type UpdateCampaign = Database['public']['Tables']['campaigns']['Update']

// Enums
export type UserRole = Database['public']['Enums']['user_role']
export type SubscriptionStatus = Database['public']['Enums']['subscription_status']
export type SubscriptionPlan = Database['public']['Enums']['subscription_plan']
export type CampaignStatus = Database['public']['Enums']['campaign_status']
export type AudienceMode = Database['public']['Enums']['audience_mode']
export type GenderTarget = Database['public']['Enums']['gender_target']

// Composite types
export interface UserWithBusiness extends Profile {
  business: Business | null
  subscription: (Subscription & { plan: Plan }) | null
}

// Server Action result
export type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string }

// Navigation
export interface NavItem {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  badge?: number | string
  adminOnly?: boolean
}

// Plan config
export interface PlanConfig {
  name: SubscriptionPlan
  displayName: string
  price: number
  campaignLimit: number
  productLimit: number
  aiLimit: number
  metaLimit: number
  features: string[]
  popular?: boolean
}
