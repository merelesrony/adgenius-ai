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

// ── Creative Image Generation ──────────────────────────────────────────────────

export type CreativeModel = 'flux' | 'flux-realism' | 'flux-anime' | 'flux-3d' | 'turbo'
export type CreativeFormat = 'square' | 'landscape' | 'portrait' | 'story'

export interface CreativePreset {
  id: string
  label: string
  description: string
  visualStyle: string           // compact summary sent by client in API body
  advertisingConcept: string    // what the ad should communicate
  environment: string           // scene/setting description
  lightingStyle: string         // lighting approach
  colorStyle: string            // color palette and mood
  defaultModel: CreativeModel
}

export const CREATIVE_PRESETS: CreativePreset[] = [
  {
    id: 'automotive-premium',
    label: 'Automotriz premium',
    description: 'Concesionarios, repuestos y lujo',
    visualStyle: 'luxury automotive photography, dark studio, metallic reflections, cinematic dramatic lighting',
    advertisingConcept:
      'Premium automotive brand advertisement designed to inspire desire, trust and prestige. Evokes high-end car brands. The product must feel exclusive, powerful and aspirational. Every visual element communicates quality.',
    environment:
      'Luxury automotive showroom with polished black marble floors, or dramatic dark studio with carbon fiber and steel surfaces. Premium car parts or performance tools visible as background props. Deep depth of field isolates the product center stage.',
    lightingStyle:
      'Cinematic studio lighting with dramatic metal reflections, professional rim lighting from behind, hard key light at 45 degrees, specular highlights on every metallic surface. Automotive commercial photography standard.',
    colorStyle:
      'Deep blacks, metallic silvers and platinum, gold accent tones, high contrast ratios. Dark luxury mood. Color palette should feel like a premium car advertisement from Porsche or BMW.',
    defaultModel: 'flux-realism',
  },
  {
    id: 'commercial-offer',
    label: 'Oferta comercial',
    description: 'Promociones y descuentos',
    visualStyle: 'bold commercial photography, vibrant high contrast, clean white background, high-conversion promotional style',
    advertisingConcept:
      'High-conversion promotional advertisement designed to drive immediate purchase decisions. Must communicate value, urgency and clear product benefit. Strong visual hierarchy. Clean space reserved on one side for discount text and CTA overlay.',
    environment:
      'Clean minimalist studio with pure white or soft gradient background. Optional dynamic floating elements or geometric shapes that add energy without distracting from the product. Product must be center stage, large and clear.',
    lightingStyle:
      'Bright professional studio lighting with even illumination, no harsh shadows, clean white highlights on all product surfaces. Commercial product photography style: every label and detail perfectly visible and sharp.',
    colorStyle:
      'Energetic high-saturation palette. Bold red, orange or yellow accents to communicate urgency and value. Vibrant but clean composition. High contrast between product and background. Colors should motivate action.',
    defaultModel: 'flux',
  },
  {
    id: 'mechanic-shop',
    label: 'Taller mecánico',
    description: 'Reparaciones y servicios mecánicos',
    visualStyle: 'professional automotive workshop, organized tools, industrial authentic, trust and reliability',
    advertisingConcept:
      'Professional automotive service advertisement conveying expertise, trust and reliability to car owners seeking quality maintenance. The product is what professional mechanics choose. Authentic credibility over polished perfection.',
    environment:
      'Modern professional mechanic workshop: organized tool wall with wrenches and sockets, hydraulic lift, engine components, clean industrial concrete floor. Professional equipment visible in background. Authentic automotive service setting that mechanics and car owners recognize.',
    lightingStyle:
      'Authentic workshop lighting: overhead industrial lamps mixed with natural light from garage doors. Real-world shadows that add depth and dimension. Soft fill light on product for clarity without killing the authentic atmosphere.',
    colorStyle:
      'Industrial palette: steel grays, worn metals, safety yellows and professional blues. Tool-steel textures. Trustworthy and reliable tones. The contrast between the rugged environment and the clean product packaging creates visual interest.',
    defaultModel: 'flux-realism',
  },
  {
    id: 'social-media',
    label: 'Redes sociales',
    description: 'Lifestyle y contenido viral',
    visualStyle: 'lifestyle photography, bright airy minimal aesthetic, Instagram-worthy, high-engagement social feed',
    advertisingConcept:
      'Instagram and Facebook optimized creative designed for maximum engagement, saves and shares. Aspirational lifestyle content that makes the viewer say "I need this." Emotional connection over hard sell. Thumb-stopping visual quality that stands out in a social feed.',
    environment:
      'Clean minimal lifestyle settings: modern surface, marble counter, aspirational workspace or subtle outdoor context. The background reinforces the product\'s lifestyle benefit without competing with it. Simple enough to let the product breathe.',
    lightingStyle:
      'Soft natural window lighting or warm golden-hour warmth. Bright airy atmosphere typical of aspirational lifestyle photography. Soft directional shadows that feel organic. Instagram-worthy illumination: authentic, approachable and flattering.',
    colorStyle:
      'Fresh and modern palette: clean whites, warm neutrals, with accent tones that match the product. High saturation without being garish. The palette should feel like a curated Instagram feed — cohesive, editorial and contemporary.',
    defaultModel: 'flux',
  },
]

export const FORMAT_DIMENSIONS: Record<CreativeFormat, { width: number; height: number; label: string }> = {
  square:    { width: 1024, height: 1024, label: 'Cuadrado (1:1)' },
  landscape: { width: 1200, height: 630,  label: 'Horizontal (1.9:1)' },
  portrait:  { width: 1080, height: 1350, label: 'Vertical (4:5)' },
  story:     { width: 1080, height: 1920, label: 'Historia (9:16)' },
}

export const CREATIVE_MODELS: { value: CreativeModel; label: string }[] = [
  { value: 'flux',         label: 'FLUX (rápido)' },
  { value: 'flux-realism', label: 'FLUX Realism' },
  { value: 'flux-anime',   label: 'FLUX Anime' },
  { value: 'flux-3d',      label: 'FLUX 3D' },
  { value: 'turbo',        label: 'Turbo (ultra rápido)' },
]

// ── Plan configs ───────────────────────────────────────────────────────────────

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
