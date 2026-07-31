export const COUNTRIES = [
  { value: 'AR', label: 'Argentina' },
  { value: 'BO', label: 'Bolivia' },
  { value: 'BR', label: 'Brasil' },
  { value: 'CL', label: 'Chile' },
  { value: 'CO', label: 'Colombia' },
  { value: 'CR', label: 'Costa Rica' },
  { value: 'EC', label: 'Ecuador' },
  { value: 'SV', label: 'El Salvador' },
  { value: 'GT', label: 'Guatemala' },
  { value: 'HN', label: 'Honduras' },
  { value: 'MX', label: 'México' },
  { value: 'NI', label: 'Nicaragua' },
  { value: 'PA', label: 'Panamá' },
  { value: 'PY', label: 'Paraguay' },
  { value: 'PE', label: 'Perú' },
  { value: 'DO', label: 'República Dominicana' },
  { value: 'UY', label: 'Uruguay' },
  { value: 'VE', label: 'Venezuela' },
  { value: 'ES', label: 'España' },
  { value: 'US', label: 'Estados Unidos' },
]

export const BUSINESS_CATEGORIES = [
  { value: 'restaurant', label: 'Restaurante / Comida' },
  { value: 'retail', label: 'Retail / Tienda' },
  { value: 'fashion', label: 'Moda / Ropa' },
  { value: 'beauty', label: 'Belleza / Estética' },
  { value: 'health', label: 'Salud / Bienestar' },
  { value: 'education', label: 'Educación' },
  { value: 'real_estate', label: 'Bienes Raíces' },
  { value: 'technology', label: 'Tecnología' },
  { value: 'automotive', label: 'Automotriz' },
  { value: 'travel', label: 'Viajes / Turismo' },
  { value: 'financial', label: 'Servicios Financieros' },
  { value: 'entertainment', label: 'Entretenimiento' },
  { value: 'sports', label: 'Deportes / Fitness' },
  { value: 'home', label: 'Hogar / Decoración' },
  { value: 'professional', label: 'Servicios Profesionales' },
  { value: 'nonprofit', label: 'ONG / Sin fines de lucro' },
  { value: 'other', label: 'Otro' },
]

export const CAMPAIGN_OBJECTIVES = [
  { value: 'awareness', label: 'Reconocimiento de marca', description: 'Dar a conocer tu negocio' },
  { value: 'traffic', label: 'Tráfico web', description: 'Llevar visitas a tu sitio' },
  { value: 'engagement', label: 'Engagement', description: 'Likes, comentarios y compartidos' },
  { value: 'leads', label: 'Generación de leads', description: 'Captar datos de clientes' },
  { value: 'sales', label: 'Ventas', description: 'Conversiones y compras directas' },
]

export const LANGUAGES = [
  { value: 'es', label: 'Español' },
  { value: 'en', label: 'Inglés' },
  { value: 'pt', label: 'Portugués' },
  { value: 'fr', label: 'Francés' },
  { value: 'it', label: 'Italiano' },
  { value: 'de', label: 'Alemán' },
]

export const GENDER_OPTIONS = [
  { value: 'all', label: 'Todos' },
  { value: 'male', label: 'Hombres' },
  { value: 'female', label: 'Mujeres' },
]

export const CURRENCIES = [
  { value: 'USD', label: 'USD — Dólar' },
  { value: 'MXN', label: 'MXN — Peso Mexicano' },
  { value: 'ARS', label: 'ARS — Peso Argentino' },
  { value: 'COP', label: 'COP — Peso Colombiano' },
  { value: 'CLP', label: 'CLP — Peso Chileno' },
  { value: 'PEN', label: 'PEN — Sol Peruano' },
  { value: 'BRL', label: 'BRL — Real Brasileño' },
  { value: 'EUR', label: 'EUR — Euro' },
]

export const PLAN_CONFIGS = [
  {
    name: 'starter' as const,
    displayName: 'Starter',
    price: 29,
    campaignLimit: 5,
    productLimit: 10,
    aiLimit: 20,
    metaLimit: 1,
    features: [
      '5 campañas activas',
      '10 productos',
      '20 generaciones IA/mes',
      '1 cuenta Meta Ads',
      'Soporte por email',
    ],
  },
  {
    name: 'professional' as const,
    displayName: 'Professional',
    price: 79,
    campaignLimit: 20,
    productLimit: 50,
    aiLimit: 100,
    metaLimit: 3,
    popular: true,
    features: [
      '20 campañas activas',
      '50 productos',
      '100 generaciones IA/mes',
      '3 cuentas Meta Ads',
      'Estadísticas avanzadas',
      'Soporte prioritario',
    ],
  },
  {
    name: 'agency' as const,
    displayName: 'Agency',
    price: 199,
    campaignLimit: -1,
    productLimit: -1,
    aiLimit: 500,
    metaLimit: 10,
    features: [
      'Campañas ilimitadas',
      'Productos ilimitados',
      '500 generaciones IA/mes',
      '10 cuentas Meta Ads',
      'API access',
      'White label',
      'Soporte dedicado',
    ],
  },
]
