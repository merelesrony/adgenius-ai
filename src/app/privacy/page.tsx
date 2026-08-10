import type { Metadata } from 'next'
import Link from 'next/link'
import { Sparkles, ArrowLeft, Shield } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Política de Privacidad',
  description:
    'Política de Privacidad de AdGenius AI: cómo recopilamos, usamos y protegemos tu información.',
}

const LAST_UPDATED = '10 de agosto de 2025'

function Section({
  id,
  title,
  children,
}: {
  id: string
  title: string
  children: React.ReactNode
}) {
  return (
    <section id={id} className="scroll-mt-20">
      <h2 className="text-xl font-semibold text-foreground mb-4 pb-2 border-b border-border">
        {title}
      </h2>
      <div className="space-y-3 text-muted-foreground leading-relaxed text-[15px]">{children}</div>
    </section>
  )
}

function SubSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="font-semibold text-foreground mb-2 text-[15px]">{title}</h3>
      <div className="space-y-2 text-muted-foreground leading-relaxed text-[15px]">{children}</div>
    </div>
  )
}

function Ul({ items }: { items: React.ReactNode[] }) {
  return (
    <ul className="list-disc list-inside space-y-1 pl-1">
      {items.map((item, i) => (
        <li key={i}>{item}</li>
      ))}
    </ul>
  )
}

function Placeholder({ text }: { text: string }) {
  return (
    <span className="font-mono text-sm bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-1.5 py-0.5 rounded border border-amber-200 dark:border-amber-800">
      {text}
    </span>
  )
}

const toc = [
  { id: 'introduccion', label: '1. Introducción' },
  { id: 'informacion-recopilada', label: '2. Información que recopilamos' },
  { id: 'meta-datos', label: '3. Datos de Meta / Facebook' },
  { id: 'oauth', label: '4. Datos obtenidos mediante OAuth' },
  { id: 'uso-datos', label: '5. Uso de los datos' },
  { id: 'inteligencia-artificial', label: '6. Servicios de inteligencia artificial' },
  { id: 'meta-api', label: '7. Integración con Meta Marketing API' },
  { id: 'almacenamiento', label: '8. Almacenamiento y seguridad' },
  { id: 'tokens', label: '9. Tokens y credenciales' },
  { id: 'terceros', label: '10. Compartición con terceros' },
  { id: 'retencion', label: '11. Retención de datos' },
  { id: 'eliminacion', label: '12. Eliminación de datos' },
  { id: 'desconexion-meta', label: '13. Desconexión de Meta' },
  { id: 'derechos', label: '14. Derechos del usuario' },
  { id: 'cookies', label: '15. Cookies y tecnologías similares' },
  { id: 'cambios', label: '16. Cambios a esta política' },
  { id: 'contacto', label: '17. Contacto' },
]

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-gradient-to-br from-brand to-purple-600 shadow-sm">
              <Sparkles className="size-3.5 text-white" />
            </div>
            <span className="font-semibold text-sm text-foreground">AdGenius AI</span>
          </Link>
          <Link
            href="/login"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5"
          >
            <ArrowLeft className="size-3.5" />
            Volver
          </Link>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 lg:py-14">
        <div className="lg:grid lg:grid-cols-[240px_1fr] lg:gap-12">
          {/* Sidebar TOC — desktop */}
          <aside className="hidden lg:block">
            <div className="sticky top-24">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
                Contenido
              </p>
              <nav className="space-y-1">
                {toc.map((item) => (
                  <a
                    key={item.id}
                    href={`#${item.id}`}
                    className="block text-sm text-muted-foreground hover:text-foreground transition-colors py-0.5 truncate"
                  >
                    {item.label}
                  </a>
                ))}
              </nav>
            </div>
          </aside>

          {/* Main content */}
          <main className="min-w-0">
            {/* Hero */}
            <div className="mb-10">
              <div className="flex items-center gap-2 text-muted-foreground text-sm mb-4">
                <Shield className="size-4" />
                <span>Política de Privacidad</span>
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground mb-2">
                Política de Privacidad
              </h1>
              <p className="text-muted-foreground text-sm">
                Última actualización: {LAST_UPDATED}
              </p>

              <div className="mt-6 p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                <p className="text-sm text-amber-800 dark:text-amber-300 leading-relaxed">
                  <strong>Nota:</strong> Los campos resaltados en amarillo{' '}
                  <Placeholder text="[COMO ESTE]" /> son datos legales pendientes de completar
                  antes de publicar esta URL públicamente en Meta Developers.
                </p>
              </div>
            </div>

            <div className="space-y-10">
              {/* 1 */}
              <Section id="introduccion" title="1. Introducción">
                <p>
                  AdGenius AI (&ldquo;nosotros&rdquo;, &ldquo;nuestro&rdquo; o &ldquo;el
                  Servicio&rdquo;) es una plataforma SaaS que permite a empresas y emprendedores
                  crear y publicar campañas publicitarias en Meta (Facebook e Instagram) mediante
                  inteligencia artificial.
                </p>
                <p>
                  Esta Política de Privacidad describe qué información recopilamos cuando utilizas
                  AdGenius AI en <Placeholder text="[DOMINIO]" />, cómo la usamos, cómo la
                  protegemos y qué opciones tienes sobre ella. Al crear una cuenta y utilizar el
                  Servicio, aceptas las prácticas descritas en esta política.
                </p>
                <p>
                  Si tienes alguna pregunta, contáctanos en{' '}
                  <Placeholder text="[EMAIL DE CONTACTO]" />.
                </p>
              </Section>

              {/* 2 */}
              <Section id="informacion-recopilada" title="2. Información que recopilamos">
                <SubSection title="2.1 Información de cuenta y autenticación">
                  <p>Al registrarte, recopilamos:</p>
                  <Ul
                    items={[
                      'Dirección de correo electrónico',
                      'Contraseña (almacenada mediante hash seguro administrado por Supabase — nunca en texto plano)',
                      'Nombre del negocio',
                      'País',
                      'Categoría del negocio',
                    ]}
                  />
                  <p>Opcionalmente, puedes añadir a tu perfil:</p>
                  <Ul
                    items={[
                      'Ciudad',
                      'Número de teléfono',
                      'Sitio web del negocio',
                      'Descripción del negocio',
                    ]}
                  />
                </SubSection>

                <SubSection title="2.2 Información de productos">
                  <p>Al cargar tus productos en la plataforma, almacenamos:</p>
                  <Ul
                    items={[
                      'Nombre del producto',
                      'Descripción del producto',
                      'Precio y moneda',
                      'Categoría del producto',
                      'Imágenes del producto (almacenadas en Supabase Storage)',
                      'Análisis visual generado por IA a partir de las imágenes del producto',
                    ]}
                  />
                </SubSection>

                <SubSection title="2.3 Información de campañas">
                  <p>
                    Al crear campañas publicitarias, almacenamos toda la configuración de la campaña,
                    incluyendo:
                  </p>
                  <Ul
                    items={[
                      'Nombre y objetivo de la campaña',
                      'Presupuesto diario y total',
                      'Configuración de segmentación: país, ciudad, radio geográfico, rango de edad, género, idiomas',
                      'Plataformas seleccionadas (Facebook, Instagram, etc.)',
                      'Contenido creativo generado por IA: titular, texto principal, descripción, llamada a la acción e imágenes',
                      'Estrategia de campaña, puntuación y recomendaciones generadas por IA',
                      'Identificadores de objetos en Meta una vez publicada la campaña (IDs de campaña, conjunto de anuncios, creatividad y anuncio)',
                    ]}
                  />
                </SubSection>

                <SubSection title="2.4 Datos de uso y registro">
                  <Ul
                    items={[
                      'Registros de auditoría: dirección IP, user agent (navegador/sistema operativo), tipo de acción y recurso afectado',
                      'Uso de generaciones de IA: tipo de generación (copy, audiencia, imagen) y tokens consumidos',
                      'Datos de sesión activa gestionados mediante cookies de Supabase',
                    ]}
                  />
                </SubSection>
              </Section>

              {/* 3 */}
              <Section id="meta-datos" title="3. Información relacionada con Meta / Facebook">
                <p>
                  Cuando conectas tu cuenta de Meta a través del flujo de autorización OAuth,
                  recopilamos y almacenamos en nuestra base de datos:
                </p>
                <Ul
                  items={[
                    'Tu identificador de usuario de Meta (Facebook User ID) y nombre de display',
                    'Token de acceso OAuth (almacenado siempre cifrado — ver sección 9)',
                    'Tipo y fecha de vencimiento del token',
                    'Permisos (scopes) otorgados durante la autorización',
                    'Lista completa de cuentas publicitarias accesibles con tu token',
                    'Lista completa de Páginas de Facebook accesibles con tu token',
                    'Lista de cuentas de Instagram Business vinculadas a tus Páginas',
                    'Portfolio de negocio de Meta (si está disponible)',
                    'Cuenta publicitaria, Página de Facebook e Instagram que hayas seleccionado como predeterminados',
                  ]}
                />
                <p>
                  Esta información se utiliza exclusivamente para operar las funciones de
                  publicación de campañas en Meta. No accedemos a tus publicaciones personales,
                  mensajes privados, historial de navegación ni ningún dato fuera del contexto
                  publicitario.
                </p>
              </Section>

              {/* 4 */}
              <Section id="oauth" title="4. Datos obtenidos mediante OAuth">
                <p>
                  La conexión con Meta utiliza el estándar OAuth 2.0. Los permisos solicitados
                  durante la autorización son:
                </p>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border border-border rounded-lg overflow-hidden">
                    <thead>
                      <tr className="bg-muted text-foreground">
                        <th className="text-left px-4 py-2.5 font-semibold border-b border-border">Permiso</th>
                        <th className="text-left px-4 py-2.5 font-semibold border-b border-border">Para qué lo usamos</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {[
                        ['ads_management', 'Crear y gestionar campañas, conjuntos, creatividades y anuncios en tu cuenta publicitaria'],
                        ['ads_read', 'Leer la información de tus cuentas publicitarias disponibles'],
                        ['pages_read_engagement', 'Leer información básica de tus Páginas de Facebook'],
                        ['pages_show_list', 'Obtener la lista de Páginas de Facebook que administras'],
                        ['business_management', 'Acceder a información de tu portfolio de negocio de Meta'],
                      ].map(([perm, desc]) => (
                        <tr key={perm} className="bg-background">
                          <td className="px-4 py-2.5 font-mono text-xs text-brand">{perm}</td>
                          <td className="px-4 py-2.5">{desc}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p>
                  Utilizamos estos permisos exclusivamente dentro del contexto publicitario descrito.{' '}
                  <strong className="text-foreground">
                    Nunca utilizamos tu autorización de Meta para leer publicaciones personales,
                    acceder a mensajes, seguir a personas, publicar en tu nombre fuera del sistema
                    de anuncios, ni realizar ninguna acción no descrita en esta política.
                  </strong>
                </p>
              </Section>

              {/* 5 */}
              <Section id="uso-datos" title="5. Uso de los datos">
                <p>Utilizamos tu información únicamente para:</p>
                <Ul
                  items={[
                    'Autenticarte y mantener tu sesión activa',
                    'Crear y gestionar campañas publicitarias en Meta en tu nombre',
                    'Generar con IA contenido creativo, estrategias de campaña y segmentaciones de audiencia',
                    'Calcular puntuaciones, análisis y recomendaciones de optimización de campañas',
                    'Gestionar tu suscripción y los límites de uso del plan',
                    'Detectar y prevenir actividades fraudulentas o de seguridad (mediante audit logs)',
                    'Mejorar el Servicio basándonos en patrones de uso agregados y anónimos',
                  ]}
                />
                <p>
                  <strong className="text-foreground">
                    No vendemos, arrendamos ni compartimos tu información personal con terceros con
                    fines comerciales propios ajenos al Servicio.
                  </strong>
                </p>
              </Section>

              {/* 6 */}
              <Section id="inteligencia-artificial" title="6. Uso de servicios de inteligencia artificial">
                <p>
                  AdGenius AI utiliza proveedores externos de IA para generar contenido publicitario.
                  En todos los casos, los datos enviados se limitan a información del negocio y del
                  producto — <strong className="text-foreground">nunca</strong> se envían tu
                  dirección de correo electrónico, nombre de usuario, token de Meta ni ningún
                  identificador personal.
                </p>

                <SubSection title="6.1 Anthropic (Claude) — motor principal de IA">
                  <p>
                    Utilizamos los modelos Claude de Anthropic para generar estrategias de campaña,
                    copies publicitarios, segmentaciones de audiencia, puntuaciones y análisis.
                  </p>
                  <p>
                    <strong className="text-foreground">Datos enviados a Anthropic:</strong> nombre
                    del producto, descripción, categoría, precio, objetivo de campaña, presupuesto,
                    país y ciudad objetivo, plataformas seleccionadas. También se puede enviar la URL
                    de una imagen de producto alojada en Supabase para análisis visual (si usas la
                    función de análisis de imagen).
                  </p>
                </SubSection>

                <SubSection title="6.2 OpenAI (opcional — generación de imágenes)">
                  <p>
                    Si está configurado, utilizamos la API de OpenAI para generar imágenes
                    publicitarias. Se envía únicamente el prompt de imagen generado automáticamente
                    en inglés, describiendo la escena del producto. No contiene información personal
                    del usuario.
                  </p>
                </SubSection>

                <SubSection title="6.3 Pollinations.ai (servicio de respaldo — generación de imágenes)">
                  <p>
                    Como alternativa cuando OpenAI no está disponible, utilizamos Pollinations.ai,
                    un servicio gratuito de generación de imágenes. Los prompts se envían como
                    parámetros en la URL de la petición HTTP sin autenticación.{' '}
                    <strong className="text-foreground">
                      Dado su carácter público, los prompts enviados a Pollinations.ai podrían ser
                      visibles a nivel de red o registrados por el servicio.
                    </strong>{' '}
                    Los prompts contienen únicamente información descriptiva del producto y no incluyen
                    datos personales del usuario.
                  </p>
                </SubSection>

                <p>
                  Los resultados generados por IA (copies, estrategias, segmentaciones, imágenes) se
                  almacenan en nuestra base de datos vinculados a tu cuenta para que puedas
                  acceder a ellos en todo momento.
                </p>
              </Section>

              {/* 7 */}
              <Section id="meta-api" title="7. Integración con Meta Marketing API">
                <p>
                  Cuando publicas una campaña, AdGenius envía los siguientes datos directamente a
                  la API de Meta Marketing (Graph API v21.0) usando tu propio token de acceso OAuth:
                </p>

                <SubSection title="Campaña">
                  <Ul items={['Nombre de la campaña', 'Objetivo publicitario (ej.: OUTCOME_TRAFFIC, OUTCOME_AWARENESS)', 'Categorías especiales de anuncio (siempre vacío — no gestionamos anuncios de vivienda, crédito, empleo ni contenido social especial)']} />
                </SubSection>

                <SubSection title="Conjunto de anuncios">
                  <Ul
                    items={[
                      'Nombre del conjunto',
                      'Presupuesto diario (en la moneda de tu cuenta publicitaria)',
                      'Segmentación: país, ciudad, radio geográfico, rango de edad, género, plataformas',
                      'Estrategia de puja (coste mínimo sin cap)',
                      'ID de tu Página de Facebook seleccionada (como promoted_object)',
                    ]}
                  />
                </SubSection>

                <SubSection title="Creatividad del anuncio">
                  <Ul
                    items={[
                      'Titular del anuncio',
                      'Texto principal del anuncio',
                      'URL de destino (el sitio web de tu negocio que hayas registrado en tu perfil)',
                      'Llamada a la acción (CTA)',
                      'URL de la imagen del anuncio (si se generó o cargó una)',
                    ]}
                  />
                </SubSection>

                <p>
                  Todos los objetos se crean en estado{' '}
                  <strong className="text-foreground">PAUSADO</strong> y no se activan
                  automáticamente. La activación requiere una acción explícita del usuario.
                </p>
                <p>
                  Los datos se envían directamente desde nuestros servidores a Meta usando tu token —
                  no pasan por ningún intermediario adicional.
                </p>
              </Section>

              {/* 8 */}
              <Section id="almacenamiento" title="8. Almacenamiento y seguridad">
                <Ul
                  items={[
                    <>
                      <strong className="text-foreground">Base de datos:</strong> todos los datos
                      se almacenan en Supabase (PostgreSQL en infraestructura de AWS). Supabase
                      aplica cifrado en reposo y en tránsito.
                    </>,
                    <>
                      <strong className="text-foreground">Contraseñas:</strong> nunca se almacenan
                      en texto plano. Supabase gestiona el hashing mediante bcrypt.
                    </>,
                    <>
                      <strong className="text-foreground">Imágenes:</strong> se almacenan en
                      Supabase Storage con control de acceso. Los archivos son accesibles solo
                      mediante URLs firmadas o URLs públicas según la configuración del bucket.
                    </>,
                    <>
                      <strong className="text-foreground">Control de acceso a datos:</strong> la
                      base de datos implementa Row Level Security (RLS) — cada usuario solo puede
                      leer y modificar sus propios datos. No existe acceso cruzado entre cuentas.
                    </>,
                    <>
                      <strong className="text-foreground">Tráfico cifrado:</strong> todas las
                      comunicaciones entre el navegador y nuestros servidores se realizan mediante
                      HTTPS/TLS.
                    </>,
                    <>
                      <strong className="text-foreground">Registros de auditoría:</strong>{' '}
                      almacenamos IP, user agent y tipo de acción para monitoreo de seguridad. Estos
                      registros no se comparten con terceros.
                    </>,
                  ]}
                />
              </Section>

              {/* 9 */}
              <Section id="tokens" title="9. Tokens y credenciales">
                <p>
                  Tu token de acceso OAuth de Meta se cifra con{' '}
                  <strong className="text-foreground">AES-256-GCM</strong> antes de almacenarse
                  en la base de datos. El proceso de cifrado:
                </p>
                <Ul
                  items={[
                    'Se genera un vector de inicialización (IV) aleatorio de 12 bytes para cada operación de cifrado',
                    'La clave de cifrado se deriva de una variable de entorno del servidor que nunca se almacena en la base de datos',
                    'Se utiliza una etiqueta de autenticación GCM de 16 bytes para garantizar la integridad del token',
                    'El resultado se almacena como: {iv}:{etiqueta_autenticación}:{texto_cifrado}',
                  ]}
                />
                <p>El token de acceso de Meta:</p>
                <Ul
                  items={[
                    'Nunca se envía al navegador del usuario',
                    'Nunca aparece en logs del servidor',
                    'Nunca se incluye en respuestas JSON al cliente',
                    'Solo se descifra en el servidor en el momento exacto de realizar una llamada a la API de Meta',
                    'No se transmite a ningún servicio de terceros distinto de la propia API de Meta',
                  ]}
                />
                <p>
                  El estado del flujo OAuth se protege contra ataques CSRF mediante una firma
                  HMAC-SHA256 que incluye el identificador de usuario y una marca de tiempo con
                  validez de 10 minutos. No se utilizan cookies para este proceso.
                </p>
              </Section>

              {/* 10 */}
              <Section id="terceros" title="10. Compartición de información con terceros">
                <p>
                  Compartimos datos con los siguientes proveedores únicamente en la medida
                  estrictamente necesaria para operar el Servicio:
                </p>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border border-border rounded-lg overflow-hidden">
                    <thead>
                      <tr className="bg-muted text-foreground">
                        <th className="text-left px-4 py-2.5 font-semibold border-b border-border">Proveedor</th>
                        <th className="text-left px-4 py-2.5 font-semibold border-b border-border">Propósito</th>
                        <th className="text-left px-4 py-2.5 font-semibold border-b border-border">Datos compartidos</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {[
                        ['Supabase', 'Base de datos, autenticación y almacenamiento', 'Todos los datos de la cuenta'],
                        ['Meta Platforms', 'Publicación de campañas publicitarias', 'Datos de campaña, creatividad y segmentación (ver sección 7)'],
                        ['Anthropic', 'Generación de texto con IA', 'Información del producto y campaña (sin PII)'],
                        ['OpenAI (opcional)', 'Generación de imágenes', 'Prompts de imagen descriptivos (sin PII)'],
                        ['Pollinations.ai (respaldo)', 'Generación de imágenes', 'Prompts de imagen descriptivos (sin PII, transmitidos en URL pública)'],
                      ].map(([prov, purpose, data]) => (
                        <tr key={prov} className="bg-background">
                          <td className="px-4 py-2.5 font-medium text-foreground whitespace-nowrap">{prov}</td>
                          <td className="px-4 py-2.5">{purpose}</td>
                          <td className="px-4 py-2.5">{data}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p>
                  No vendemos información personal a terceros ni la compartimos con fines de
                  publicidad propia o marketing externo.
                </p>
              </Section>

              {/* 11 */}
              <Section id="retencion" title="11. Retención de datos">
                <p>
                  Conservamos tu información mientras tu cuenta esté activa en AdGenius AI.
                  Los datos de conexión con Meta se eliminan de inmediato cuando desconectas
                  tu cuenta (ver sección 13).
                </p>
                <p>
                  Los periodos de retención específicos para otras categorías de datos son:{' '}
                  <Placeholder text="[PENDIENTE DE DEFINIR]" />. Si deseas información sobre la
                  retención de un tipo específico de dato, contáctanos en{' '}
                  <Placeholder text="[EMAIL DE CONTACTO]" />.
                </p>
                <p>
                  En algunos casos podemos estar obligados a conservar ciertos registros por más
                  tiempo por razones legales, fiscales o de seguridad.
                </p>
              </Section>

              {/* 12 */}
              <Section id="eliminacion" title="12. Eliminación de datos">
                <SubSection title="Datos de campaña y productos">
                  <p>
                    Puedes eliminar campañas y productos directamente desde la aplicación en
                    cualquier momento.
                  </p>
                </SubSection>

                <SubSection title="Datos de conexión con Meta">
                  <p>
                    Al desconectar tu cuenta de Meta (ver sección 13), eliminamos inmediatamente
                    de nuestra base de datos: el token de acceso cifrado, los identificadores de
                    Meta, las listas de cuentas publicitarias y Páginas, y las selecciones
                    realizadas.
                  </p>
                  <p>
                    Los objetos ya creados en Meta (campañas, conjuntos de anuncios, creatividades,
                    anuncios) <strong className="text-foreground">no se eliminan de Meta</strong>{' '}
                    porque son parte de tu propia cuenta publicitaria. Puedes gestionarlos
                    directamente en Meta Ads Manager.
                  </p>
                </SubSection>

                <SubSection title="Eliminación de cuenta">
                  <p>
                    La función de eliminación completa de cuenta está actualmente en desarrollo. Si
                    deseas solicitar la eliminación de todos tus datos antes de que esta función
                    esté disponible, contáctanos en{' '}
                    <Placeholder text="[EMAIL DE CONTACTO]" /> e identificaremos y eliminaremos
                    manualmente tu información en un plazo razonable.
                  </p>
                </SubSection>
              </Section>

              {/* 13 */}
              <Section id="desconexion-meta" title="13. Desconexión de Meta">
                <p>
                  Puedes desconectar tu cuenta de Meta de AdGenius AI en cualquier momento:
                </p>
                <ol className="list-decimal list-inside space-y-1 pl-1">
                  <li>Ve a <strong className="text-foreground">Configuración</strong> en el menú lateral</li>
                  <li>En la sección de integración con Meta, haz clic en <strong className="text-foreground">Desconectar</strong></li>
                  <li>Confirma la acción</li>
                </ol>
                <p>
                  Esto elimina de forma permanente e inmediata tu token de acceso y toda la
                  información de conexión de Meta almacenada en nuestros sistemas.
                </p>
                <p>
                  Adicionalmente, puedes revocar el acceso de la aplicación directamente desde
                  Facebook en: <strong className="text-foreground">Configuración y privacidad →
                  Configuración → Aplicaciones y sitios web</strong>.
                </p>
              </Section>

              {/* 14 */}
              <Section id="derechos" title="14. Derechos del usuario">
                <p>
                  Dependiendo de tu país de residencia, puedes tener los siguientes derechos
                  sobre tu información personal:
                </p>
                <Ul
                  items={[
                    <><strong className="text-foreground">Acceso:</strong> solicitar una copia de los datos que almacenamos sobre ti.</>,
                    <><strong className="text-foreground">Rectificación:</strong> corregir datos inexactos — puedes hacerlo directamente desde tu perfil en la aplicación.</>,
                    <><strong className="text-foreground">Eliminación:</strong> solicitar la eliminación de tus datos (ver sección 12).</>,
                    <><strong className="text-foreground">Portabilidad:</strong> solicitar tus datos en un formato estructurado y legible por máquina.</>,
                    <><strong className="text-foreground">Oposición:</strong> oponerte a determinados procesamientos de tu información.</>,
                    <><strong className="text-foreground">Limitación:</strong> solicitar que restrinjamos el procesamiento de tus datos en determinadas circunstancias.</>,
                  ]}
                />
                <p>
                  Para ejercer cualquiera de estos derechos, escríbenos a{' '}
                  <Placeholder text="[EMAIL DE CONTACTO]" />. Responderemos en los plazos exigidos
                  por la legislación aplicable (ej.: 30 días bajo el RGPD).
                </p>
                <p>
                  Si consideras que el tratamiento de tus datos infringe la normativa aplicable,
                  tienes derecho a presentar una reclamación ante la autoridad de protección de
                  datos de tu país.
                </p>
              </Section>

              {/* 15 */}
              <Section id="cookies" title="15. Cookies y tecnologías similares">
                <p>
                  AdGenius AI utiliza exclusivamente cookies técnicas estrictamente necesarias
                  para el funcionamiento de la autenticación. No utilizamos cookies de seguimiento,
                  publicidad ni análisis de terceros.
                </p>

                <SubSection title="Cookies de sesión de Supabase">
                  <Ul
                    items={[
                      'Nombre: sb-[referencia-proyecto]-auth-token (el nombre exacto depende del proyecto de Supabase)',
                      'Propósito: mantener tu sesión autenticada mientras navegas por la aplicación',
                      'Tipo: HTTP-only, seguras (Secure), misma sitio (SameSite)',
                      'Duración: se eliminan al cerrar sesión o al expirar la sesión',
                    ]}
                  />
                </SubSection>

                <SubSection title="Lo que NO utilizamos">
                  <Ul
                    items={[
                      'Cookies de análisis o estadísticas de terceros (Google Analytics, Hotjar, etc.)',
                      'Cookies de publicidad o retargeting',
                      'Píxeles de seguimiento',
                      'Cookies para el flujo de conexión con Meta (se usa un parámetro firmado con HMAC-SHA256 en la URL, no una cookie)',
                    ]}
                  />
                </SubSection>

                <p>
                  Al utilizar el Servicio, aceptas el uso de las cookies técnicas descritas, que
                  son indispensables para el funcionamiento de la autenticación y no pueden
                  desactivarse.
                </p>
              </Section>

              {/* 16 */}
              <Section id="cambios" title="16. Cambios a esta política">
                <p>
                  Podemos actualizar esta Política de Privacidad periódicamente para reflejar
                  cambios en el Servicio, en la legislación aplicable o en nuestras prácticas.
                  Cuando actualicemos la política, modificaremos la fecha de &ldquo;Última
                  actualización&rdquo; al inicio de este documento.
                </p>
                <p>
                  Para cambios materiales que afecten significativamente tus derechos o la forma
                  en que tratamos tu información, te notificaremos mediante un aviso en la
                  aplicación o por correo electrónico con al menos{' '}
                  <Placeholder text="[X]" /> días de anticipación antes de que los cambios entren
                  en vigor.
                </p>
                <p>
                  El uso continuado del Servicio después de la fecha de entrada en vigor de los
                  cambios constituye tu aceptación de la política actualizada.
                </p>
              </Section>

              {/* 17 */}
              <Section id="contacto" title="17. Contacto">
                <p>
                  Si tienes preguntas, comentarios o solicitudes relacionadas con esta Política de
                  Privacidad o con el tratamiento de tu información personal, contáctanos en:
                </p>
                <div className="p-4 rounded-xl bg-muted/60 border border-border space-y-1.5">
                  <p>
                    <strong className="text-foreground">AdGenius AI</strong>
                  </p>
                  <p>
                    Correo electrónico: <Placeholder text="[EMAIL DE CONTACTO]" />
                  </p>
                  <p>
                    Sitio web: <Placeholder text="[DOMINIO]" />
                  </p>
                </div>
                <p>
                  Nos comprometemos a responder todas las solicitudes relacionadas con privacidad
                  en un plazo razonable.
                </p>
              </Section>
            </div>

            {/* Footer navigation */}
            <div className="mt-16 pt-8 border-t border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <Link
                href="/login"
                className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="size-3.5" />
                Volver al inicio de sesión
              </Link>
              <p className="text-xs text-muted-foreground">
                Última actualización: {LAST_UPDATED}
              </p>
            </div>
          </main>
        </div>
      </div>

      {/* Page footer */}
      <footer className="border-t border-border mt-8">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} AdGenius AI. Todos los derechos reservados.</p>
          <div className="flex items-center gap-4">
            <Link href="/terms" className="hover:text-foreground transition-colors">
              Términos de Servicio
            </Link>
            <span aria-hidden="true">·</span>
            <span className="text-foreground font-medium">Privacidad</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
