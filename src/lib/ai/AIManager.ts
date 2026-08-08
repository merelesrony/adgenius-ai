import Anthropic from '@anthropic-ai/sdk'
import { formatCurrency, getBudgetContextForAI } from '@/lib/currency'
import type { MarketingStrategyInput, MarketingStrategy } from '@/features/ai-strategy/types'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export interface ProductContext {
  name: string
  description: string
  category: string
  price?: number | null
  currency?: string
  country?: string
  city?: string
  objective?: string
  audienceMode?: 'manual' | 'ai'
  dailyBudget?: number | null
  targetAgeMin?: number
  targetAgeMax?: number
  targetGender?: string
  targetInterests?: string[]
  targetLanguages?: string[]
}

export interface CopyResult {
  headline: string
  body: string
  description: string
  cta: string
}

export interface AudienceResult {
  ageMin: number
  ageMax: number
  gender: 'all' | 'male' | 'female'
  interests: string[]
  languages: string[]
  explanation: string
}

export interface ScoreResult {
  total: number
  breakdown: {
    copy: number
    audience: number
    budget: number
    targeting: number
  }
  recommendations: string[]
}

export interface AIGenerateResult extends CopyResult {
  audience?: AudienceResult
  score: ScoreResult
}

const SYSTEM_PROMPT = `Eres un experto senior en marketing digital y publicidad en Facebook Ads para mercados de habla hispana (Latinoamérica y España).
Tienes más de 10 años de experiencia creando campañas de alto rendimiento para pequeñas y medianas empresas.
Devuelve ÚNICAMENTE JSON válido y bien formado. No uses markdown. No uses bloques de código. No agregues texto antes ni después del JSON. La respuesta debe comenzar con { y terminar con }.`

// ── Core API call ──────────────────────────────────────────────────────────────

async function callClaude(
  prompt: string,
  model = 'claude-haiku-4-5-20251001',
  maxTokens = 1500,
): Promise<string> {
  const message = await client.messages.create({
    model,
    max_tokens: maxTokens,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: prompt }],
  })

  console.log('[Claude DEBUG]', {
    model,
    stop_reason: message.stop_reason,
    input_tokens: message.usage.input_tokens,
    output_tokens: message.usage.output_tokens,
    content_blocks: message.content.map((b) => b.type),
  })

  if (message.stop_reason === 'max_tokens') {
    throw new Error(
      `Claude cortó la respuesta por límite de tokens (max_tokens: ${maxTokens}). ` +
      `Tokens usados: input=${message.usage.input_tokens} output=${message.usage.output_tokens}`,
    )
  }

  const block = message.content.find((b) => b.type === 'text')
  if (!block || block.type !== 'text' || !block.text.trim()) {
    throw new Error(
      `Claude devolvió contenido vacío (stop_reason: ${message.stop_reason}, blocks: ${message.content.length}, types: ${message.content.map((b) => b.type).join(',')})`,
    )
  }

  return block.text.trim()
}

// ── JSON parsing ───────────────────────────────────────────────────────────────

function parseJSON<T>(raw: string, context = 'unknown'): T {
  console.log(`[AI RAW RESPONSE][${context}]\n${raw}`)

  if (!raw || !raw.trim()) {
    console.error(`[AI JSON PARSE ERROR][${context}] Respuesta vacía`)
    throw new Error(`Claude devolvió respuesta vacía (context: ${context})`)
  }

  // Strip markdown code fences: ```json...``` or ```...```
  let cleaned = raw
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```\s*$/i, '')
    .trim()

  // If Claude still added surrounding text, extract the JSON object
  const jsonStart = cleaned.indexOf('{')
  const jsonEnd = cleaned.lastIndexOf('}')
  if (jsonStart !== -1 && jsonEnd > jsonStart) {
    cleaned = cleaned.slice(jsonStart, jsonEnd + 1)
  }

  console.log(`[AI CLEANED RESPONSE][${context}]\n${cleaned}`)

  try {
    return JSON.parse(cleaned) as T
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error(`[AI JSON PARSE ERROR][${context}]`, {
      error: msg,
      cleanedPreview: cleaned.slice(0, 400),
    })
    throw new Error(`Error al parsear respuesta de Claude como JSON (${context}): ${msg}`)
  }
}

// ── Shared helpers ─────────────────────────────────────────────────────────────

function buildProductContext(ctx: ProductContext): string {
  const currency = ctx.currency ?? 'USD'
  const priceStr = ctx.price
    ? formatCurrency(ctx.price, currency)
    : 'No especificado'
  const budgetStr = ctx.dailyBudget
    ? getBudgetContextForAI(ctx.dailyBudget, currency)
    : 'No especificado'
  return `Producto/Servicio: ${ctx.name}
Descripción: ${ctx.description}
Categoría: ${ctx.category}
Precio: ${priceStr}
Objetivo de la campaña: ${ctx.objective ?? 'ventas'}
País: ${ctx.country ?? 'No especificado'}
Ciudad/Zona: ${ctx.city ?? 'Todo el país'}
Presupuesto diario: ${budgetStr}`
}

// ── Individual generators ──────────────────────────────────────────────────────

export async function generateCopy(ctx: ProductContext): Promise<CopyResult> {
  const prompt = `Crea el copy para un anuncio de Facebook Ads para este producto:

${buildProductContext(ctx)}

Devuelve únicamente este JSON (sin texto adicional, sin markdown):
{"headline":"título principal máx 40 chars","body":"texto principal 100-250 chars persuasivo","description":"descripción máx 90 chars","cta":"llamada a la acción en español"}`

  const raw = await callClaude(prompt, 'claude-sonnet-5', 800)
  return parseJSON<CopyResult>(raw, 'generateCopy')
}

export async function generateHeadline(ctx: ProductContext): Promise<string> {
  const prompt = `Título impactante para Facebook Ads de: ${ctx.name} - ${ctx.description}. Máximo 40 caracteres.
Devuelve únicamente: {"headline":"..."}`

  const raw = await callClaude(prompt)
  return parseJSON<{ headline: string }>(raw, 'generateHeadline').headline
}

export async function generateDescription(ctx: ProductContext): Promise<string> {
  const prompt = `Descripción corta para Facebook Ads de: ${ctx.name} - ${ctx.description}. Máximo 90 caracteres.
Devuelve únicamente: {"description":"..."}`

  const raw = await callClaude(prompt)
  return parseJSON<{ description: string }>(raw, 'generateDescription').description
}

export async function generateCTA(ctx: ProductContext): Promise<string> {
  const prompt = `Mejor CTA para anuncio de "${ctx.name}" con objetivo "${ctx.objective ?? 'ventas'}". Opciones: Comprar Ahora, Más Información, Contactar, Registrarse, Pedir Ahora, Ver Oferta, Descargar Ahora, Reservar.
Devuelve únicamente: {"cta":"..."}`

  const raw = await callClaude(prompt)
  return parseJSON<{ cta: string }>(raw, 'generateCTA').cta
}

export async function generateAudience(ctx: ProductContext): Promise<AudienceResult> {
  const prompt = `Audiencia óptima de Facebook Ads para este producto:

${buildProductContext(ctx)}

Devuelve únicamente este JSON (sin texto adicional, sin markdown):
{"ageMin":25,"ageMax":45,"gender":"all","interests":["interés 1","interés 2","interés 3","interés 4","interés 5"],"languages":["es"],"explanation":"razón concisa de esta audiencia"}`

  const raw = await callClaude(prompt, 'claude-sonnet-5', 600)
  return parseJSON<AudienceResult>(raw, 'generateAudience')
}

export async function generateKeywords(ctx: ProductContext): Promise<string[]> {
  const prompt = `10 palabras clave para publicitar "${ctx.name}" en Facebook Ads.
Devuelve únicamente: {"keywords":["kw1","kw2","kw3","kw4","kw5","kw6","kw7","kw8","kw9","kw10"]}`

  const raw = await callClaude(prompt)
  return parseJSON<{ keywords: string[] }>(raw, 'generateKeywords').keywords
}

export async function analyzeProduct(ctx: ProductContext): Promise<{
  strengths: string[]
  suggestions: string[]
  targetDemographic: string
}> {
  const prompt = `Analiza este producto para publicidad en Facebook:

${buildProductContext(ctx)}

Devuelve únicamente este JSON (sin texto adicional, sin markdown):
{"strengths":["fortaleza 1","fortaleza 2","fortaleza 3"],"suggestions":["sugerencia 1","sugerencia 2"],"targetDemographic":"descripción del comprador ideal en 1 oración"}`

  const raw = await callClaude(prompt)
  return parseJSON(raw, 'analyzeProduct')
}

export async function scoreCampaign(params: {
  ctx: ProductContext
  copy: CopyResult
  audience: AudienceResult | null
  audienceMode: 'manual' | 'ai'
}): Promise<ScoreResult> {
  const { ctx, copy, audience, audienceMode } = params

  const audienceInfo = audience
    ? `Edad: ${audience.ageMin}-${audience.ageMax} | Género: ${audience.gender} | Intereses: ${audience.interests.slice(0, 3).join(', ')}`
    : audienceMode === 'manual' && ctx.targetAgeMin
      ? `Edad: ${ctx.targetAgeMin}-${ctx.targetAgeMax} | Género: ${ctx.targetGender} | Intereses: ${ctx.targetInterests?.slice(0, 3).join(', ')}`
      : 'No definida'

  const currency = ctx.currency ?? 'USD'
  const prompt = `Evalúa esta campaña de Facebook Ads (cada categoría de 0 a 25):

PRODUCTO: ${ctx.name}
COPY — Título: ${copy.headline} | Texto: ${copy.body} | Descripción: ${copy.description} | CTA: ${copy.cta}
AUDIENCIA: ${audienceInfo}
PRESUPUESTO: ${ctx.dailyBudget ? getBudgetContextForAI(ctx.dailyBudget, currency) : 'No definido'}
OBJETIVO: ${ctx.objective ?? 'ventas'}

Devuelve únicamente este JSON (sin texto adicional, sin markdown):
{"total":75,"breakdown":{"copy":20,"audience":18,"budget":17,"targeting":20},"recommendations":["recomendación concreta 1","recomendación 2","recomendación 3"]}`

  const raw = await callClaude(prompt, 'claude-sonnet-5', 600)
  return parseJSON<ScoreResult>(raw, 'scoreCampaign')
}

export interface CategoryDetectionResult {
  category: string
  label: string
  confidence: 'high' | 'medium' | 'low'
}

export async function detectProductCategory(
  productName: string,
  productDescription: string,
): Promise<CategoryDetectionResult> {
  const prompt = `Analiza este producto y determina su categoría de negocio más adecuada.

Producto: ${productName}
Descripción: ${productDescription}

Categorías disponibles: automotive, electronics, fashion, beauty, cosmetics, health, pharmacy, technology, home, furniture, construction, hardware, food, beverages, restaurant, education, sports, pets, toys, real_estate, professional, financial, travel, industrial, entertainment, retail, nonprofit, other

Devuelve únicamente este JSON (sin texto adicional):
{"category":"valor_de_la_lista","label":"Nombre legible en español","confidence":"high"}`

  const raw = await callClaude(prompt, 'claude-haiku-4-5-20251001', 150)
  return parseJSON<CategoryDetectionResult>(raw, 'detectProductCategory')
}

export async function generateFlyerPrompt(ctx: ProductContext): Promise<string> {
  const prompt = `Prompt en inglés para generar imagen publicitaria con IA (DALL-E/Stable Diffusion) para:
Producto: ${ctx.name} | Descripción: ${ctx.description} | Categoría: ${ctx.category}
El prompt debe ser visual, profesional, específico para Facebook Ads.
Devuelve únicamente: {"prompt":"..."}`

  const raw = await callClaude(prompt)
  return parseJSON<{ prompt: string }>(raw, 'generateFlyerPrompt').prompt
}

// ── Main: generateAll ──────────────────────────────────────────────────────────

export async function generateAll(ctx: ProductContext): Promise<AIGenerateResult> {
  const needsAIAudience = ctx.audienceMode === 'ai'

  const manualAudienceSection = needsAIAudience
    ? ''
    : `\nAUDIENCIA MANUAL:
- Edad: ${ctx.targetAgeMin ?? 18}-${ctx.targetAgeMax ?? 65}
- Género: ${ctx.targetGender ?? 'all'}
- Intereses: ${ctx.targetInterests?.join(', ') || 'No especificado'}
- Idiomas: ${ctx.targetLanguages?.join(', ') || 'es'}`

  const audienceField = needsAIAudience
    ? `,"audience":{"ageMin":25,"ageMax":45,"gender":"all","interests":["interés 1","interés 2","interés 3","interés 4","interés 5"],"languages":["es"],"explanation":"razón de esta audiencia en 1 oración"}`
    : ''

  const audienceInstruction = needsAIAudience
    ? 'Define también la audiencia óptima para este producto.'
    : 'Usa la audiencia manual para calcular el score de audiencia.'

  const prompt = `Genera el contenido completo de esta campaña de Facebook Ads. ${audienceInstruction}

PRODUCTO:
${buildProductContext(ctx)}${manualAudienceSection}

INSTRUCCIÓN: Devuelve únicamente JSON válido. No uses markdown. No agregues texto antes ni después. La respuesta debe empezar con { y terminar con }.

Estructura requerida (reemplaza los valores de ejemplo con el contenido real):
{"headline":"título impactante máx 40 chars","body":"copy principal 100-250 chars con emojis si aplica","description":"descripción máx 90 chars con beneficio clave","cta":"llamada a la acción en español"${audienceField},"score":{"total":75,"breakdown":{"copy":20,"audience":18,"budget":17,"targeting":20},"recommendations":["recomendación accionable 1","recomendación 2","recomendación 3"]}}`

  const raw = await callClaude(prompt, 'claude-sonnet-5', 2048)
  const result = parseJSON<AIGenerateResult>(raw, 'generateAll')

  // Validate required fields before returning
  if (!result.headline || !result.body || !result.cta) {
    console.error('[generateAll] Campos requeridos ausentes en respuesta:', result)
    throw new Error('La respuesta de Claude no contiene los campos requeridos (headline, body, cta)')
  }
  if (!result.score || typeof result.score.total !== 'number') {
    console.error('[generateAll] Campo score ausente o inválido:', result)
    throw new Error('La respuesta de Claude no contiene un score válido')
  }

  return result
}

export async function generateMarketingStrategy(
  input: MarketingStrategyInput,
): Promise<MarketingStrategy> {
  const { productName, productDescription, productPrice, productCurrency = 'USD', productCategory } = input

  const priceStr = productPrice
    ? formatCurrency(productPrice, productCurrency)
    : 'No especificado'

  const categoryStr = productCategory?.trim()
    ? `Categoría indicada: ${productCategory}`
    : 'Detectar categoría automáticamente según nombre y descripción'

  const prompt =
    `Analiza este producto y genera una estrategia completa de marketing digital para Meta Ads.\n\n` +
    `PRODUCTO:\n` +
    `- Nombre: ${productName}\n` +
    `- Descripción: ${productDescription}\n` +
    `- Precio: ${priceStr} (${productCurrency})\n` +
    `- ${categoryStr}\n\n` +
    `REGLA CRÍTICA: Los valores de presupuesto (testingUSD, scalingUSD, maximumUSD) SIEMPRE en dólares USD.\n` +
    `Adapta la estrategia al tipo de producto, industria y mercado de habla hispana.\n\n` +
    `Devuelve ÚNICAMENTE este JSON válido (sin markdown, sin texto adicional):\n` +
    `{\n` +
    `  "productAnalysis": {\n` +
    `    "detectedCategory": "categoría detectada en español",\n` +
    `    "industry": "nombre de la industria",\n` +
    `    "clientType": "tipo de cliente ideal en pocas palabras",\n` +
    `    "priceLevel": "economy",\n` +
    `    "positioning": "cómo posicionar el producto en el mercado (1-2 oraciones)"\n` +
    `  },\n` +
    `  "recommendedObjective": {\n` +
    `    "value": "sales",\n` +
    `    "label": "nombre del objetivo en español",\n` +
    `    "reason": "por qué este objetivo es el más adecuado para este producto"\n` +
    `  },\n` +
    `  "targetAudience": {\n` +
    `    "ageMin": 25,\n` +
    `    "ageMax": 45,\n` +
    `    "gender": "all",\n` +
    `    "interests": ["interés 1","interés 2","interés 3","interés 4","interés 5"],\n` +
    `    "behaviors": ["comportamiento 1","comportamiento 2","comportamiento 3"]\n` +
    `  },\n` +
    `  "budgetRecommendation": {\n` +
    `    "testingUSD": 5,\n` +
    `    "scalingUSD": 15,\n` +
    `    "maximumUSD": 50,\n` +
    `    "explanation": "explicación del presupuesto para este tipo de producto"\n` +
    `  },\n` +
    `  "schedule": {\n` +
    `    "bestDays": ["Lunes","Martes","Miércoles","Jueves","Viernes"],\n` +
    `    "bestHours": "18:00 - 22:00",\n` +
    `    "explanation": "por qué estos horarios son óptimos para este producto y audiencia"\n` +
    `  },\n` +
    `  "visualStrategy": {\n` +
    `    "creativeType": "tipo de creativo recomendado",\n` +
    `    "style": "estilo visual recomendado",\n` +
    `    "description": "descripción detallada del creativo ideal para este producto"\n` +
    `  },\n` +
    `  "adCopy": {\n` +
    `    "headline": "título del anuncio máximo 40 caracteres",\n` +
    `    "primaryText": "texto principal del anuncio 100-200 caracteres con gancho emocional",\n` +
    `    "cta": "Comprar ahora"\n` +
    `  },\n` +
    `  "metaAdsConfig": {\n` +
    `    "objective": "objetivo de Meta Ads",\n` +
    `    "optimization": "evento de optimización sugerido",\n` +
    `    "placements": ["Facebook Feed","Instagram Feed"],\n` +
    `    "notes": "configuración adicional recomendada"\n` +
    `  }\n` +
    `}`

  const raw = await callClaude(prompt, 'claude-haiku-4-5-20251001', 1400)
  const result = parseJSON<MarketingStrategy>(raw, 'generateMarketingStrategy')

  if (!result.productAnalysis || !result.recommendedObjective || !result.adCopy) {
    throw new Error('La respuesta de Claude no contiene los campos requeridos de la estrategia')
  }

  return result
}

// ── Product from free-text description ─────────────────────────────────────────

export interface ProductFromDescriptionResult {
  name: string
  description: string
  category: string
  categoryLabel: string
  brand: string | null
  keywords: string[]
  suggestedAudience: string
  price: number | null
  currency: string
  confidence: 'high' | 'medium' | 'low'
}

export async function generateProductFromDescription(
  userDescription: string,
): Promise<ProductFromDescriptionResult> {
  const prompt = `El usuario describió lo que vende de forma libre. Analiza la descripción y extrae la información del producto.

Descripción del usuario: "${userDescription}"

Instrucciones:
- Extrae o genera un nombre comercial atractivo y corto (máx 60 chars)
- Escribe una descripción profesional y persuasiva (2-3 oraciones)
- Detecta la categoría de la lista
- Extrae la marca si está mencionada, o null
- Genera 3-6 keywords relevantes en español
- Extrae el precio numérico si está mencionado (solo número, sin separadores de miles: 450000 no 450.000)
- Detecta la moneda: ₲ o Gs o guaraníes → "PYG" | $ o USD → "USD" | € → "EUR" | S/ → "PEN" | COP → "COP" | sin moneda → "USD"
- Describe el público objetivo en 1 oración

Categorías disponibles: automotive, electronics, fashion, beauty, cosmetics, health, pharmacy, technology, home, furniture, construction, hardware, food, beverages, restaurant, education, sports, pets, toys, real_estate, professional, financial, travel, industrial, entertainment, retail, nonprofit, other

Devuelve únicamente este JSON (sin texto adicional):
{"name":"nombre comercial","description":"descripción profesional","category":"valor_de_lista","categoryLabel":"Nombre en español","brand":null,"keywords":["kw1","kw2","kw3"],"suggestedAudience":"descripción del público objetivo","price":450000,"currency":"PYG","confidence":"high"}`

  const raw = await callClaude(prompt, 'claude-haiku-4-5-20251001', 700)
  return parseJSON<ProductFromDescriptionResult>(raw, 'generateProductFromDescription')
}

// ── Campaign strategy generator ────────────────────────────────────────────────

export interface AudienceStrategy {
  ageMin: number
  ageMax: number
  gender: 'all' | 'male' | 'female'
  interests: string[]
  behaviors: string[]
}

export interface CampaignStrategy {
  objective: string
  objectiveLabel: string
  recommendedCTA: string
  headline: string
  primaryText: string
  description: string
  audience: AudienceStrategy
  location: {
    country: string
    city: string | null
    radius: number
  }
  budgetRecommendation: {
    daily: number
    reason: string
  }
  creativeDirection: {
    style: string
    format: string
    concept: string
  }
}

export async function generateCampaignStrategy(input: {
  productName: string
  productDescription: string | null
  userProductDescription?: string | null
  productCategory: string | null
  productPrice: number | null
  productCurrency: string | null
  dailyBudget: number
  budgetCurrency: string
  country: string
  city: string
  radius: number
  platforms: string[]
}): Promise<CampaignStrategy> {
  const {
    productName, productDescription, userProductDescription,
    productCategory, productPrice, productCurrency,
    dailyBudget, budgetCurrency,
    country, city, radius, platforms,
  } = input

  const priceStr = productPrice ? formatCurrency(productPrice, productCurrency ?? 'USD') : 'No especificado'
  const budgetStr = getBudgetContextForAI(dailyBudget, budgetCurrency)
  const platformStr = platforms.length > 0 ? platforms.join(', ') : 'Facebook, Instagram'
  const locationStr = city ? `${city}, ${country} (radio ${radius} km)` : `${country} (radio ${radius} km)`

  const sellerBlock = userProductDescription
    ? `⚠️ DESCRIPCIÓN ORIGINAL DEL VENDEDOR (AUTORITATIVA):\n"${userProductDescription}"\nNo modificar estos datos. Úsalos para construir la estrategia.\n\n`
    : ''

  const prompt = `Eres experto en Meta Ads para mercados hispanohablantes. Genera una estrategia completa de campaña publicitaria.

${sellerBlock}PRODUCTO:
- Nombre: ${productName}
- Descripción: ${productDescription ?? 'No especificada'}
- Categoría: ${productCategory ?? 'General'}
- Precio: ${priceStr}

CAMPAÑA:
- Presupuesto diario: ${budgetStr}
- Ubicación: ${locationStr}
- Plataformas: ${platformStr}

Devuelve ÚNICAMENTE este JSON (sin texto, sin markdown, sin bloques de código):
{"objective":"sales","objectiveLabel":"Ventas / Conversiones","recommendedCTA":"Comprar ahora","headline":"título impactante máx 40 chars","primaryText":"copy principal 100-200 chars con gancho emocional y emoji si aplica","description":"descripción máx 90 chars con beneficio clave","audience":{"ageMin":25,"ageMax":45,"gender":"all","interests":["interés 1","interés 2","interés 3","interés 4","interés 5"],"behaviors":["comportamiento 1","comportamiento 2","comportamiento 3"]},"location":{"country":"${country}","city":${city ? `"${city.replace(/"/g, '\\"')}"` : 'null'},"radius":${radius}},"budgetRecommendation":{"daily":${dailyBudget},"reason":"explicación breve del presupuesto en 1 oración"},"creativeDirection":{"style":"Profesional y aspiracional","format":"Imagen única o carrusel","concept":"descripción del concepto visual en 1-2 oraciones"}}`

  const raw = await callClaude(prompt, 'claude-sonnet-5', 1400)
  const result = parseJSON<CampaignStrategy>(raw, 'generateCampaignStrategy')

  if (!result.headline || !result.primaryText || !result.audience) {
    throw new Error('La respuesta de Claude no contiene los campos requeridos de la estrategia')
  }

  return result
}

// ── Campaign Optimizer ────────────────────────────────────────────────────────

export interface CampaignOptimizationInput {
  productName: string
  productDescription: string | null
  productCategory: string | null
  productPrice: number | null
  productCurrency: string | null
  objective: string | null
  dailyBudget: number | null
  budgetCurrency: string
  country: string
  city: string | null
  targetAgeMin: number | null
  targetAgeMax: number | null
  targetGender: string
  targetInterests: string[]
  aiCopy: { headline: string; body: string; description: string; cta: string } | null
  hasCreative: boolean
}

export interface OptimizationImprovement {
  id: string
  type: 'copy' | 'audience' | 'creative' | 'budget' | 'cta'
  priority: 'high' | 'medium' | 'low'
  problem: string
  recommendation: string
  before: string
  after: string
}

export interface CampaignOptimizationResult {
  score: number
  summary: string
  strengths: string[]
  improvements: OptimizationImprovement[]
}

export async function analyzeCampaignOptimization(
  input: CampaignOptimizationInput,
): Promise<CampaignOptimizationResult> {
  const {
    productName, productDescription, productCategory,
    productPrice, productCurrency,
    objective, dailyBudget, budgetCurrency,
    country, city,
    targetAgeMin, targetAgeMax, targetGender, targetInterests,
    aiCopy, hasCreative,
  } = input

  const currency = productCurrency ?? budgetCurrency ?? 'USD'
  const priceStr = productPrice ? formatCurrency(productPrice, currency) : 'No especificado'
  const budgetStr = dailyBudget ? `${formatCurrency(dailyBudget, budgetCurrency)}` : 'No especificado'
  const locationStr = city ? `${city}, ${country}` : country
  const genderStr = targetGender === 'all' ? 'Todos' : targetGender === 'male' ? 'Hombres' : 'Mujeres'
  const interestStr = targetInterests.length > 0 ? targetInterests.slice(0, 5).join(', ') : 'No definidos'
  const ageStr = `${targetAgeMin ?? 18}–${targetAgeMax ?? 65} años`

  const prompt =
    `Eres un experto senior en Meta Ads con 10 años optimizando campañas para mercados hispanohablantes.\n` +
    `Analiza esta campaña y devuelve hasta 5 mejoras priorizadas por impacto.\n\n` +
    `PRODUCTO: ${productName} (${productCategory ?? 'sin categoría'})\n` +
    `Descripción: ${productDescription ?? 'No especificada'}\n` +
    `Precio: ${priceStr}\n\n` +
    `CAMPAÑA:\n` +
    `- Objetivo: ${objective ?? 'ventas'}\n` +
    `- Presupuesto diario: ${budgetStr}/día\n` +
    `- Ubicación: ${locationStr}\n` +
    `- Audiencia: ${ageStr}, ${genderStr}, intereses: ${interestStr}\n` +
    `- Tiene creativo IA: ${hasCreative ? 'Sí' : 'No'}\n\n` +
    `COPY ACTUAL:\n` +
    `- Headline: ${aiCopy?.headline ?? '(sin headline)'}\n` +
    `- Texto principal: ${aiCopy?.body ?? '(sin texto)'}\n` +
    `- Descripción: ${aiCopy?.description ?? '(sin descripción)'}\n` +
    `- CTA: ${aiCopy?.cta ?? '(sin CTA)'}\n\n` +
    `REGLAS PARA EL CAMPO "after" SEGÚN TIPO:\n` +
    `- "copy": JSON con los campos mejorados: {"headline":"...","body":"...","description":"..."}\n` +
    `- "cta": solo el texto del nuevo CTA (ej: "Comprar Ahora")\n` +
    `- "audience": JSON: {"ageMin":N,"ageMax":N,"gender":"all|male|female","interests":["...","...","..."]}\n` +
    `- "budget": solo el número del nuevo presupuesto diario en ${budgetCurrency} (ej: "15")\n` +
    `- "creative": descripción del nuevo creativo recomendado en 1 oración en español\n\n` +
    `Devuelve ÚNICAMENTE este JSON (sin markdown, sin texto adicional):\n` +
    `{"score":72,"summary":"análisis de la campaña en 2-3 oraciones concretas","strengths":["fortaleza 1","fortaleza 2","fortaleza 3"],"improvements":[{"id":"imp_1","type":"copy","priority":"high","problem":"problema específico y concreto","recommendation":"qué hacer exactamente","before":"texto/valor actual","after":"texto/valor mejorado según el formato indicado para este tipo"}]}`

  const raw = await callClaude(prompt, 'claude-sonnet-5', 2000)
  const result = parseJSON<CampaignOptimizationResult>(raw, 'analyzeCampaignOptimization')

  if (typeof result.score !== 'number') result.score = 70
  if (!Array.isArray(result.strengths)) result.strengths = []
  if (!Array.isArray(result.improvements)) result.improvements = []

  return result
}

// ── Ad Creative Engine ─────────────────────────────────────────────────────────

export interface AdCreativeVariant {
  variant: 'premium' | 'lifestyle' | 'minimal'
  variantLabel: string
  headline: string
  primaryText: string
  description: string
  cta: string
  imagePrompt: string
  style: string
  concept: string
}

export interface BrandKitResult {
  colors: string[]
  visualStyle: string
  toneOfVoice: string
  photographyStyle: string
  recommendedTypography: string
}

export interface AdCreativeAIResult {
  creatives: AdCreativeVariant[]
  brandKit: BrandKitResult
}

export async function generateAdCreative(input: {
  productName: string
  productDescription: string | null
  productCategory: string | null
  productPrice: number | null
  productCurrency: string | null
  ageMin: number
  ageMax: number
  gender: string
  interests: string[]
  objective: string
  objectiveLabel: string
  recommendedCTA: string
  dailyBudget: number
  budgetCurrency: string
  creativeStyle: string
  creativeConcept: string
  platforms: string[]
  userProductDescription?: string | null
}): Promise<AdCreativeAIResult> {
  const {
    productName, productDescription, productCategory,
    productPrice, productCurrency,
    ageMin, ageMax, gender, interests,
    objective, objectiveLabel, recommendedCTA,
    dailyBudget, budgetCurrency,
    creativeStyle, creativeConcept, platforms,
    userProductDescription,
  } = input

  const priceStr = productPrice
    ? formatCurrency(productPrice, productCurrency ?? 'USD')
    : 'No especificado'

  const genderStr = gender === 'all' ? 'Todos' : gender === 'male' ? 'Hombres' : 'Mujeres'
  const audienceStr = `${genderStr}, ${ageMin}-${ageMax} años, intereses: ${interests.slice(0, 4).join(', ')}`
  const budgetStr = getBudgetContextForAI(dailyBudget, budgetCurrency)
  const platformStr = platforms.length > 0 ? platforms.join(', ') : 'Facebook, Instagram'

  const authorityBlock = userProductDescription
    ? `⚠️ DESCRIPCIÓN ORIGINAL DEL VENDEDOR (FUENTE DE VERDAD):\n"${userProductDescription}"\n` +
      `REGLA CRÍTICA: esta descripción es autoritativa. No la modifiques, resumir, ni contradigas. ` +
      `Úsala tal cual en el copy. Puedes añadir elementos creativos, pero los datos explícitos (precio, modelo, compatibilidad, promoción) deben respetarse exactamente.\n\n`
    : ''

  const prompt =
    `Eres Senior Creative Director de una agencia de publicidad digital. ` +
    `Genera 3 variantes de creativos publicitarios profesionales para Meta Ads.\n\n` +
    authorityBlock +
    `PRODUCTO:\n- Nombre: ${productName}\n- Descripción: ${productDescription ?? 'No especificada'}\n` +
    `- Categoría: ${productCategory ?? 'General'}\n- Precio: ${priceStr}\n\n` +
    `CAMPAÑA:\n- Objetivo: ${objectiveLabel} (${objective})\n- CTA recomendado: ${recommendedCTA}\n` +
    `- Presupuesto: ${budgetStr}/día\n- Plataformas: ${platformStr}\n\n` +
    `AUDIENCIA:\n- ${audienceStr}\n\n` +
    `DIRECCIÓN CREATIVA BASE:\n- Estilo: ${creativeStyle}\n- Concepto: ${creativeConcept}\n\n` +
    `REGLAS CRÍTICAS:\n` +
    `1. SIEMPRE específico a la categoría: perfume→fragancia de lujo, ropa→moda, comida→gastronomía. ` +
    `NUNCA estética automotriz para productos no automotrices.\n` +
    `2. imagePrompt en INGLÉS, mínimo 60 palabras, describiendo la escena fotográfica.\n` +
    `3. Copy en español hispanohablante.\n` +
    `4. A=Premium/Luxury: aspiracional, elegante. B=Lifestyle/Humano: personas+emoción. C=Minimal/Producto: limpio+foco en producto.\n\n` +
    `Devuelve ÚNICAMENTE este JSON (sin markdown):\n` +
    `{"creatives":[` +
    `{"variant":"premium","variantLabel":"Premium / Luxury","headline":"máx 40 chars","primaryText":"100-200 chars con emoji","description":"máx 90 chars","cta":"CTA","imagePrompt":"60+ words in English describing the full photographic scene specific to ${productCategory ?? 'this product'} category, not automotive","style":"Estilo 3-5 palabras","concept":"Concepto 1 oración"},` +
    `{"variant":"lifestyle","variantLabel":"Lifestyle / Humano","headline":"...","primaryText":"...","description":"...","cta":"...","imagePrompt":"...","style":"...","concept":"..."},` +
    `{"variant":"minimal","variantLabel":"Minimal / Producto","headline":"...","primaryText":"...","description":"...","cta":"...","imagePrompt":"...","style":"...","concept":"..."}` +
    `],"brandKit":{"colors":["#HEX1","#HEX2"],"visualStyle":"3-5 palabras","toneOfVoice":"3-5 palabras","photographyStyle":"3-5 palabras","recommendedTypography":"tipo recomendado"}}`

  const raw = await callClaude(prompt, 'claude-sonnet-5', 2200)
  const result = parseJSON<AdCreativeAIResult>(raw, 'generateAdCreative')

  if (!result.creatives || result.creatives.length < 3) {
    throw new Error('La respuesta no contiene las 3 variantes de creativos')
  }
  if (!result.brandKit?.colors) {
    throw new Error('La respuesta no contiene el Brand Kit')
  }

  return result
}

// ── Campaign Intelligence ─────────────────────────────────────────────────────

export interface CampaignIntelligenceInput {
  productName: string
  productDescription: string | null
  productCategory: string | null
  productPrice: number | null
  productCurrency: string
  objective: string
  dailyBudget: number | null
  budgetCurrency: string
  country: string
  city: string | null
  targetAgeMin: number | null
  targetAgeMax: number | null
  targetGender: string
  targetInterests: string[]
  platforms: string[]
  aiCopy: { headline: string; body: string; description: string; cta: string } | null
  hasCreative: boolean
  hasVisualDNA: boolean
  hasBrandKit: boolean
  currentScore: number | null
}

export interface CampaignIntelligenceSubScores {
  visual: number
  copy: number
  audience: number
  budget: number
  brand: number
  conversion: number
  metaBestPractices: number
}

export interface CampaignIntelligenceFinding {
  id: string
  category: string
  title: string
  description: string
  priority: 'high' | 'medium' | 'low'
}

export interface CampaignIntelligenceRecommendation {
  id: string
  priority: 'high' | 'medium' | 'low'
  category: string
  title: string
  description: string
  oneClickFix: {
    available: boolean
    field: 'cta' | 'headline' | 'primary_text' | 'description' | null
    value: string | null
  }
}

export interface CampaignIntelligencePrediction {
  estimatedReach: { min: number; max: number; label: string }
  expectedCTR: { min: number; max: number }
  conversionProbability: 'low' | 'medium' | 'high' | 'very_high'
  competitionLevel: 'low' | 'medium' | 'high' | 'very_high'
  difficulty: 'easy' | 'medium' | 'hard' | 'very_hard'
  reasoning: string
}

export interface CampaignIntelligenceRisk {
  id: string
  severity: 'error' | 'warning' | 'info'
  title: string
  description: string
}

export interface CampaignIntelligenceResult {
  overallScore: number
  subScores: CampaignIntelligenceSubScores
  findings: CampaignIntelligenceFinding[]
  recommendations: CampaignIntelligenceRecommendation[]
  prediction: CampaignIntelligencePrediction
  risks: CampaignIntelligenceRisk[]
  coachAdvice: string
  quickWins: string[]
  summary: string
}

export async function analyzeCampaignIntelligence(
  input: CampaignIntelligenceInput,
): Promise<CampaignIntelligenceResult> {
  const {
    productName, productDescription, productCategory,
    productPrice, productCurrency,
    objective, dailyBudget, budgetCurrency,
    country, city,
    targetAgeMin, targetAgeMax, targetGender, targetInterests,
    platforms, aiCopy, hasCreative, hasVisualDNA, hasBrandKit,
  } = input

  const currency = productCurrency ?? budgetCurrency ?? 'USD'
  const priceStr = productPrice ? formatCurrency(productPrice, currency) : 'No especificado'
  const budgetStr = dailyBudget ? `${formatCurrency(dailyBudget, budgetCurrency)}/día` : 'No especificado'
  const locationStr = city ? `${city}, ${country}` : country
  const genderStr = targetGender === 'all' ? 'Todos los géneros' : targetGender === 'male' ? 'Solo hombres' : 'Solo mujeres'
  const ageStr = `${targetAgeMin ?? 18}–${targetAgeMax ?? 65} años`
  const interestStr = targetInterests.length > 0 ? targetInterests.slice(0, 8).join(', ') : 'No definidos'
  const platformStr = platforms.length > 0 ? platforms.join(', ') : 'No especificadas'

  const prompt = [
    `Eres un especialista senior en Meta Ads con 10+ años de experiencia en mercados hispanohablantes.`,
    `Analiza EXHAUSTIVAMENTE esta campaña y devuelve un diagnóstico profesional completo basado en los datos reales.`,
    ``,
    `DATOS DE LA CAMPAÑA:`,
    `PRODUCTO: ${productName} | Categoría: ${productCategory ?? 'No especificada'} | Precio: ${priceStr}`,
    `Descripción: ${productDescription ?? 'No especificada'}`,
    ``,
    `CONFIGURACIÓN:`,
    `- Objetivo: ${objective}`,
    `- Presupuesto: ${budgetStr}`,
    `- Plataformas: ${platformStr}`,
    `- Ubicación: ${locationStr}`,
    `- Audiencia: ${ageStr}, ${genderStr}`,
    `- Intereses: ${interestStr}`,
    `- Tiene creativo/imagen: ${hasCreative ? 'Sí' : 'No'}`,
    `- Tiene Visual DNA: ${hasVisualDNA ? 'Sí' : 'No'}`,
    `- Tiene Brand Kit: ${hasBrandKit ? 'Sí' : 'No'}`,
    ``,
    `COPY ACTUAL:`,
    `- Headline: ${aiCopy?.headline ?? '(sin headline)'}`,
    `- Texto principal: ${aiCopy?.body ?? '(sin texto)'}`,
    `- Descripción: ${aiCopy?.description ?? '(sin descripción)'}`,
    `- CTA: ${aiCopy?.cta ?? '(sin CTA)'}`,
    ``,
    `INSTRUCCIONES CRÍTICAS:`,
    `1. Analiza CADA elemento real (no uses generalidades vacías)`,
    `2. Scores deben reflejar calidad real: 0-49=muy malo, 50-69=regular, 70-84=bueno, 85-100=excelente`,
    `3. Si no hay creativo → visual score bajo (30-45)`,
    `4. Si no hay CTA o está genérico → conversion score bajo`,
    `5. Si el presupuesto no está definido → budget score bajo (20-35)`,
    `6. Las recommendations con oneClickFix deben incluir el valor EXACTO a aplicar`,
    `7. El campo "field" en oneClickFix: usa "primary_text" para el texto del anuncio, "headline", "description" o "cta"`,
    `8. El coachAdvice debe hablar de ESTA campaña específica en primera persona ("Si esta fuera mi campaña...")`,
    `9. Las predicciones deben basarse en los datos reales (presupuesto, audiencia, objetivo, ubicación)`,
    `10. Los riesgos deben ser concretos y accionables`,
    ``,
    `Devuelve ÚNICAMENTE este JSON:`,
    `{"overallScore":78,"subScores":{"visual":60,"copy":82,"audience":70,"budget":65,"brand":80,"conversion":72,"metaBestPractices":85},"findings":[{"id":"f1","category":"copy","title":"Título concreto del hallazgo","description":"Diagnóstico específico sobre esta campaña","priority":"high"},{"id":"f2","category":"audience","title":"...","description":"...","priority":"medium"}],"recommendations":[{"id":"r1","priority":"high","category":"copy","title":"Título accionable","description":"Explicación de por qué y qué hacer","oneClickFix":{"available":true,"field":"cta","value":"Comprar Ahora"}},{"id":"r2","priority":"medium","category":"audience","title":"...","description":"...","oneClickFix":{"available":false,"field":null,"value":null}}],"prediction":{"estimatedReach":{"min":3000,"max":12000,"label":"personas/día"},"expectedCTR":{"min":1.2,"max":2.8},"conversionProbability":"medium","competitionLevel":"medium","difficulty":"medium","reasoning":"Explicación de la predicción basada en los datos reales"},"risks":[{"id":"risk1","severity":"warning","title":"Título del riesgo","description":"Descripción concreta del riesgo y su impacto"}],"coachAdvice":"Si esta fuera mi campaña, primero cambiaría... porque...","quickWins":["Acción concreta 1","Acción concreta 2","Acción concreta 3"],"summary":"Resumen ejecutivo de 2-3 oraciones sobre el estado real de esta campaña"}`,
  ].join('\n')

  const raw = await callClaude(prompt, 'claude-sonnet-5', 6000)
  const result = parseJSON<CampaignIntelligenceResult>(raw, 'analyzeCampaignIntelligence')

  // Normalize to avoid runtime crashes
  if (typeof result.overallScore !== 'number') result.overallScore = 70
  if (!result.subScores) {
    result.subScores = { visual: 70, copy: 70, audience: 70, budget: 70, brand: 70, conversion: 70, metaBestPractices: 70 }
  }
  if (!Array.isArray(result.findings)) result.findings = []
  if (!Array.isArray(result.recommendations)) result.recommendations = []
  if (!result.prediction) {
    result.prediction = {
      estimatedReach: { min: 1000, max: 5000, label: 'personas/día' },
      expectedCTR: { min: 1.0, max: 3.0 },
      conversionProbability: 'medium',
      competitionLevel: 'medium',
      difficulty: 'medium',
      reasoning: 'Estimación basada en los parámetros de la campaña.',
    }
  }
  if (!Array.isArray(result.risks)) result.risks = []
  if (!result.coachAdvice) result.coachAdvice = ''
  if (!Array.isArray(result.quickWins)) result.quickWins = []
  if (!result.summary) result.summary = ''

  return result
}
