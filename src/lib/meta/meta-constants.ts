export const META_API_VERSION = process.env.META_API_VERSION ?? 'v21.0'
export const META_GRAPH_BASE = `https://graph.facebook.com/${META_API_VERSION}`

// Used in scope-based flow (Business app without config_id configured yet).
// instagram_basic belongs to the deprecated Instagram Basic Display API — NOT valid here.
// Instagram Business accounts are accessed via /{page-id}?fields=instagram_business_account.
export const META_OAUTH_SCOPES = [
  'ads_management',
  'ads_read',
  'pages_read_engagement',
  'pages_show_list',
  'business_management',
].join(',')

// Facebook Login for Business configuration ID.
// Created in: App Dashboard → Facebook Login for Business → Configurations → Create.
// When set, the OAuth flow uses config_id instead of scope (recommended for SaaS/Tech Providers).
export const META_CONFIG_ID = process.env.META_CONFIG_ID ?? ''

export const META_OAUTH_STATE_COOKIE = 'meta_oauth_state'
export const META_OAUTH_STATE_TTL_SECONDS = 600
