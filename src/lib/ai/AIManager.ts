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

  console.log('[Claude]', {
    model,
    stop_reason: message.stop_reason,
    input_tokens: message.usage.input_tokens,
    output_tokens: message.usage.output_tokens,
  })

  if (message.stop_reason === 'max_tokens') {
    throw new Error(
      `Claude cortó la respuesta por límite de tokens (max_tokens: ${maxTokens}). ` +
      `Tokens usados: input=${message.usage.input_tokens} output=${message.usage.output_tokens}`,
    )
  }

  const block = message.content[0]
  if (!block || block.type !== 'text' || !block.text.trim()) {
    throw new Error(
      `Claude devolvió contenido vacío (stop_reason: ${message.stop_reason}, blocks: ${message.content.length})`,
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
  return `Producto/Servicio: ${ctx.name}
Descripción: ${ctx.description}
Categoría: ${ctx.category}
Precio: ${ctx.price ? `${ctx.currency ?? 'USD'} ${ctx.price}` : 'No especificado'}
Objetivo de la campaña: ${ctx.objective ?? 'ventas'}
País: ${ctx.country ?? 'No especificado'}
Ciudad/Zona: ${ctx.city ?? 'Todo el país'}
Presupuesto diario: ${ctx.dailyBudget ? `$${ctx.dailyBudget} USD` : 'No especificado'}`
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

  const prompt = `Evalúa esta campaña de Facebook Ads (cada categoría de 0 a 25):

PRODUCTO: ${ctx.name}
COPY — Título: ${copy.headline} | Texto: ${copy.body} | Descripción: ${copy.description} | CTA: ${copy.cta}
AUDIENCIA: ${audienceInfo}
PRESUPUESTO: ${ctx.dailyBudget ? `$${ctx.dailyBudget}/día` : 'No definido'}
OBJETIVO: ${ctx.objective ?? 'ventas'}

Devuelve únicamente este JSON (sin texto adicional, sin markdown):
{"total":75,"breakdown":{"copy":20,"audience":18,"budget":17,"targeting":20},"recommendations":["recomendación concreta 1","recomendación 2","recomendación 3"]}`

  const raw = await callClaude(prompt, 'claude-sonnet-5', 600)
  return parseJSON<ScoreResult>(raw, 'scoreCampaign')
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
