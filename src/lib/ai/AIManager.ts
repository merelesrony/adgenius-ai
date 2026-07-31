import Anthropic from '@anthropic-ai/sdk'

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
Respondes ÚNICAMENTE con JSON válido y bien formado, sin texto adicional, sin markdown, sin bloques de código, sin explicaciones. Solo el objeto JSON.`

async function callClaude(prompt: string, model = 'claude-haiku-4-5-20251001'): Promise<string> {
  const message = await client.messages.create({
    model,
    max_tokens: 1500,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: prompt }],
  })
  const block = message.content[0]
  return block.type === 'text' ? block.text.trim() : ''
}

function parseJSON<T>(raw: string): T {
  const cleaned = raw.replace(/^```json\n?/, '').replace(/\n?```$/, '').trim()
  return JSON.parse(cleaned) as T
}

function buildProductContext(ctx: ProductContext): string {
  return `
Producto/Servicio: ${ctx.name}
Descripción: ${ctx.description}
Categoría: ${ctx.category}
Precio: ${ctx.price ? `${ctx.currency ?? 'USD'} ${ctx.price}` : 'No especificado'}
Objetivo de la campaña: ${ctx.objective ?? 'ventas'}
País: ${ctx.country ?? 'No especificado'}
Ciudad/Zona: ${ctx.city ?? 'Todo el país'}
Presupuesto diario: ${ctx.dailyBudget ? `$${ctx.dailyBudget} USD` : 'No especificado'}`.trim()
}

export async function generateCopy(ctx: ProductContext): Promise<CopyResult> {
  const prompt = `Crea el copy para un anuncio de Facebook Ads para este producto:

${buildProductContext(ctx)}

Responde con este JSON exacto:
{
  "headline": "título principal del anuncio (máximo 40 caracteres, impactante)",
  "body": "texto principal del anuncio (100-250 caracteres, persuasivo, con emoji si aplica)",
  "description": "descripción corta (máximo 90 caracteres, beneficio clave)",
  "cta": "llamada a la acción en español (ej: Comprar Ahora, Más Información, Registrarse, Pedir Ahora)"
}`

  const raw = await callClaude(prompt, 'claude-sonnet-5')
  return parseJSON<CopyResult>(raw)
}

export async function generateHeadline(ctx: ProductContext): Promise<string> {
  const prompt = `Crea 1 título impactante para un anuncio de Facebook Ads de: ${ctx.name} - ${ctx.description}
Máximo 40 caracteres. Responde con JSON: {"headline": "..."}`

  const raw = await callClaude(prompt)
  return parseJSON<{ headline: string }>(raw).headline
}

export async function generateDescription(ctx: ProductContext): Promise<string> {
  const prompt = `Crea 1 descripción corta para Facebook Ads de: ${ctx.name} - ${ctx.description}
Máximo 90 caracteres. Responde con JSON: {"description": "..."}`

  const raw = await callClaude(prompt)
  return parseJSON<{ description: string }>(raw).description
}

export async function generateCTA(ctx: ProductContext): Promise<string> {
  const prompt = `¿Cuál es el mejor CTA para un anuncio de "${ctx.name}" con objetivo "${ctx.objective ?? 'ventas'}"?
Opciones: Comprar Ahora, Más Información, Contactar, Registrarse, Pedir Ahora, Ver Oferta, Descargar Ahora, Reservar.
Responde con JSON: {"cta": "..."}`

  const raw = await callClaude(prompt)
  return parseJSON<{ cta: string }>(raw).cta
}

export async function generateAudience(ctx: ProductContext): Promise<AudienceResult> {
  const prompt = `Analiza este producto y define la audiencia óptima para Facebook Ads:

${buildProductContext(ctx)}

Responde con este JSON exacto:
{
  "ageMin": número entre 18 y 65,
  "ageMax": número entre 18 y 65,
  "gender": "all" | "male" | "female",
  "interests": ["interés relevante 1", "interés relevante 2", "interés relevante 3", "interés relevante 4", "interés relevante 5"],
  "languages": ["es"],
  "explanation": "explicación concisa de por qué elegí esta audiencia (máx 120 chars)"
}`

  const raw = await callClaude(prompt, 'claude-sonnet-5')
  return parseJSON<AudienceResult>(raw)
}

export async function generateKeywords(ctx: ProductContext): Promise<string[]> {
  const prompt = `Lista 10 palabras clave relevantes para publicitar "${ctx.name}" en Facebook Ads.
Responde con JSON: {"keywords": ["kw1", "kw2", ...]}`

  const raw = await callClaude(prompt)
  return parseJSON<{ keywords: string[] }>(raw).keywords
}

export async function analyzeProduct(ctx: ProductContext): Promise<{
  strengths: string[]
  suggestions: string[]
  targetDemographic: string
}> {
  const prompt = `Analiza este producto para publicidad en Facebook:

${buildProductContext(ctx)}

Responde con este JSON:
{
  "strengths": ["fortaleza 1", "fortaleza 2", "fortaleza 3"],
  "suggestions": ["sugerencia de mejora 1", "sugerencia 2"],
  "targetDemographic": "descripción del comprador ideal en 1 oración"
}`

  const raw = await callClaude(prompt)
  return parseJSON(raw)
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

  const prompt = `Evalúa esta campaña de Facebook Ads y dala una puntuación:

PRODUCTO: ${ctx.name}
COPY:
- Título: ${copy.headline}
- Texto: ${copy.body}
- Descripción: ${copy.description}
- CTA: ${copy.cta}
AUDIENCIA: ${audienceInfo}
PRESUPUESTO DIARIO: ${ctx.dailyBudget ? `$${ctx.dailyBudget}` : 'No definido'}
OBJETIVO: ${ctx.objective ?? 'ventas'}

Evalúa cada categoría de 0 a 25 puntos:
- copy: calidad y persuasión del texto (0-25)
- audience: relevancia y especificidad de la audiencia (0-25)
- budget: adecuación del presupuesto al objetivo (0-25)
- targeting: precisión del targeting geográfico y de intereses (0-25)

Responde con este JSON exacto:
{
  "total": suma de los 4 valores (0-100),
  "breakdown": {
    "copy": número 0-25,
    "audience": número 0-25,
    "budget": número 0-25,
    "targeting": número 0-25
  },
  "recommendations": ["recomendación accionable 1", "recomendación 2", "recomendación 3"]
}`

  const raw = await callClaude(prompt, 'claude-sonnet-5')
  return parseJSON<ScoreResult>(raw)
}

export async function generateFlyerPrompt(ctx: ProductContext): Promise<string> {
  const prompt = `Crea un prompt en inglés para generar una imagen de anuncio publicitario con IA (DALL-E / Stable Diffusion) para:

Producto: ${ctx.name}
Descripción: ${ctx.description}
Categoría: ${ctx.category}

El prompt debe ser visual, descriptivo, profesional y específico para Facebook Ads.
Responde con JSON: {"prompt": "..."}`

  const raw = await callClaude(prompt)
  return parseJSON<{ prompt: string }>(raw).prompt
}

export async function generateAll(ctx: ProductContext): Promise<AIGenerateResult> {
  const needsAIAudience = ctx.audienceMode === 'ai'

  const manualAudienceInfo = needsAIAudience
    ? ''
    : `
AUDIENCIA DEFINIDA MANUALMENTE:
- Edad: ${ctx.targetAgeMin ?? 18}-${ctx.targetAgeMax ?? 65}
- Género: ${ctx.targetGender ?? 'all'}
- Intereses: ${ctx.targetInterests?.join(', ') || 'No especificado'}
- Idiomas: ${ctx.targetLanguages?.join(', ') || 'es'}`

  const audienceInstruction = needsAIAudience
    ? `También define la audiencia óptima para el producto basándote en tus conocimientos de marketing.`
    : `Usa la audiencia manual definida arriba para calcular el score de audiencia.`

  const prompt = `Eres un experto en Facebook Ads. Genera el contenido completo para esta campaña:

${buildProductContext(ctx)}
${manualAudienceInfo}

${audienceInstruction}

Evalúa la campaña con estas puntuaciones (0-25 cada una):
- copy: calidad y persuasión del texto
- audience: relevancia de la audiencia
- budget: ${ctx.dailyBudget ? `presupuesto de $${ctx.dailyBudget}/día para ${ctx.objective}` : 'presupuesto no definido (5 puntos máximo)'}
- targeting: precisión geográfica y de intereses

Responde con este JSON exacto (sin texto extra, solo el JSON):
{
  "headline": "título impactante máx 40 chars",
  "body": "copy principal 100-250 chars con emojis si aplica",
  "description": "descripción corta máx 90 chars con beneficio clave",
  "cta": "llamada a la acción en español"${needsAIAudience ? `,
  "audience": {
    "ageMin": número 18-65,
    "ageMax": número 18-65,
    "gender": "all" | "male" | "female",
    "interests": ["interés 1", "interés 2", "interés 3", "interés 4", "interés 5"],
    "languages": ["es"],
    "explanation": "razón de esta audiencia en 1 oración"
  }` : ''},
  "score": {
    "total": suma de breakdown (0-100),
    "breakdown": {
      "copy": 0-25,
      "audience": 0-25,
      "budget": 0-25,
      "targeting": 0-25
    },
    "recommendations": ["recomendación 1", "recomendación 2", "recomendación 3"]
  }
}`

  const raw = await callClaude(prompt, 'claude-sonnet-5')
  return parseJSON<AIGenerateResult>(raw)
}
