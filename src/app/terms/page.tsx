import type { Metadata } from 'next'
import Link from 'next/link'
import { Sparkles, ArrowLeft, FileText } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Términos y Condiciones',
  description:
    'Términos y Condiciones de uso de AdGenius AI: derechos, obligaciones y condiciones del servicio.',
}

const EFFECTIVE_DATE = '[FECHA DE VIGENCIA]'

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

function Ol({ items }: { items: React.ReactNode[] }) {
  return (
    <ol className="list-decimal list-inside space-y-1 pl-1">
      {items.map((item, i) => (
        <li key={i}>{item}</li>
      ))}
    </ol>
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
  { id: 'identificacion', label: '1. Identificación del servicio' },
  { id: 'aceptacion', label: '2. Aceptación de los términos' },
  { id: 'descripcion', label: '3. Descripción del servicio' },
  { id: 'inteligencia-artificial', label: '4. Uso de inteligencia artificial' },
  { id: 'responsabilidades', label: '5. Responsabilidades del usuario' },
  { id: 'cuenta-seguridad', label: '6. Cuenta y seguridad' },
  { id: 'integracion-meta', label: '7. Integración con Meta / Facebook' },
  { id: 'campanas', label: '8. Campañas y publicidad' },
  { id: 'contenido-ia', label: '9. Contenido generado por IA' },
  { id: 'propiedad-intelectual', label: '10. Propiedad intelectual' },
  { id: 'uso-aceptable', label: '11. Uso aceptable' },
  { id: 'pagos', label: '12. Pagos y suscripciones' },
  { id: 'limitacion', label: '13. Limitación de responsabilidad' },
  { id: 'disponibilidad', label: '14. Disponibilidad del servicio' },
  { id: 'suspension', label: '15. Suspensión y cancelación' },
  { id: 'modificaciones', label: '16. Modificaciones de los términos' },
  { id: 'legislacion', label: '17. Legislación aplicable' },
  { id: 'contacto', label: '18. Contacto' },
]

export default function TermsPage() {
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
                <FileText className="size-4" />
                <span>Términos y Condiciones</span>
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground mb-2">
                Términos y Condiciones de Uso
              </h1>
              <p className="text-muted-foreground text-sm">
                Fecha de vigencia: <Placeholder text={EFFECTIVE_DATE} />
              </p>

              <div className="mt-6 p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                <p className="text-sm text-amber-800 dark:text-amber-300 leading-relaxed">
                  <strong>Nota:</strong> Los campos resaltados en amarillo{' '}
                  <Placeholder text="[COMO ESTE]" /> son datos legales pendientes de completar
                  antes de publicar esta URL en Meta Developers u otros servicios externos.
                </p>
              </div>
            </div>

            <div className="space-y-10">
              {/* 1 */}
              <Section id="identificacion" title="1. Identificación del servicio">
                <p>
                  <strong className="text-foreground">AdGenius AI</strong> (en adelante,
                  &ldquo;el Servicio&rdquo;, &ldquo;nosotros&rdquo; o &ldquo;nuestro&rdquo;) es
                  una plataforma de software como servicio (SaaS) disponible en{' '}
                  <Placeholder text="[DOMINIO]" /> que permite a empresas y emprendedores crear,
                  optimizar y publicar campañas publicitarias en Meta (Facebook e Instagram)
                  utilizando inteligencia artificial generativa.
                </p>
                <p>
                  Para cualquier consulta sobre estos Términos, puedes contactarnos en{' '}
                  <Placeholder text="[EMAIL DE CONTACTO]" />.
                </p>
              </Section>

              {/* 2 */}
              <Section id="aceptacion" title="2. Aceptación de los términos">
                <p>
                  Al acceder a AdGenius AI, crear una cuenta o utilizar cualquiera de las
                  funciones del Servicio, aceptas quedar vinculado por estos Términos y
                  Condiciones, nuestra{' '}
                  <Link href="/privacy" className="text-brand hover:underline">
                    Política de Privacidad
                  </Link>{' '}
                  y cualquier política adicional que publiquemos.
                </p>
                <p>
                  Si no estás de acuerdo con alguno de estos términos, no debes usar el Servicio.
                  Si utilizas el Servicio en nombre de una empresa u organización, declaras que
                  tienes autoridad para vincular a dicha entidad a estos Términos.
                </p>
                <p>
                  Debes tener al menos 18 años para usar el Servicio. Al aceptar estos Términos,
                  declaras que cumples este requisito de edad mínima.
                </p>
              </Section>

              {/* 3 */}
              <Section id="descripcion" title="3. Descripción del servicio">
                <p>AdGenius AI proporciona las siguientes funcionalidades principales:</p>
                <Ul
                  items={[
                    'Generación automatizada de estrategias de campaña publicitaria mediante IA',
                    'Creación de copys publicitarios (titular, texto principal, descripción, llamada a la acción) mediante modelos de lenguaje',
                    'Generación de imágenes publicitarias mediante IA a partir de información del producto',
                    'Segmentación de audiencias optimizada por IA',
                    'Puntuación y análisis de campañas',
                    'Publicación directa de campañas en Meta Ads (Facebook e Instagram) a través de la Meta Marketing API',
                    'Gestión de productos y activos visuales',
                    'Panel de métricas y seguimiento de campañas',
                  ]}
                />
                <p>
                  El Servicio está en constante evolución. Podemos añadir, modificar o eliminar
                  funcionalidades en cualquier momento, con o sin previo aviso, salvo que la
                  legislación aplicable exija lo contrario.
                </p>
              </Section>

              {/* 4 */}
              <Section id="inteligencia-artificial" title="4. Uso de inteligencia artificial">
                <p>
                  AdGenius AI utiliza modelos de inteligencia artificial de terceros para
                  generar contenido publicitario. Debes entender y aceptar lo siguiente:
                </p>
                <SubSection title="4.1 Naturaleza del contenido generado">
                  <p>
                    El contenido generado por IA (copys, estrategias, segmentaciones, imágenes)
                    es generado de forma automática y puede contener inexactitudes, sesgos o
                    información inapropiada. <strong className="text-foreground">Eres
                    responsable de revisar, aprobar y verificar todo el contenido generado por IA
                    antes de publicarlo.</strong>
                  </p>
                </SubSection>
                <SubSection title="4.2 Proveedores de IA">
                  <p>
                    Utilizamos proveedores de IA externos (incluyendo Anthropic, OpenAI y
                    Pollinations.ai) para procesar tu información y generar contenido. El uso
                    de estos servicios está sujeto a las políticas de privacidad y términos de
                    uso de cada proveedor.
                  </p>
                </SubSection>
                <SubSection title="4.3 Sin garantía de resultados">
                  <p>
                    No garantizamos que el contenido generado por IA sea preciso, completo,
                    adecuado para tu negocio específico, ni que genere resultados publicitarios
                    concretos (ventas, clics, conversiones o retorno de inversión). Los
                    resultados publicitarios dependen de múltiples factores fuera de nuestro
                    control, incluyendo la calidad de tu producto, la competencia en tu mercado
                    y el rendimiento de la plataforma publicitaria.
                  </p>
                </SubSection>
              </Section>

              {/* 5 */}
              <Section id="responsabilidades" title="5. Responsabilidades del usuario">
                <p>Al utilizar AdGenius AI, te comprometes a:</p>
                <Ul
                  items={[
                    'Proporcionar información veraz, precisa y actualizada sobre tu negocio, productos y campañas',
                    'Revisar y aprobar todo el contenido generado por IA antes de publicarlo en Meta u otras plataformas',
                    'Asegurarte de que tus anuncios cumplen con las Políticas Publicitarias de Meta y con la legislación publicitaria aplicable en tu país o mercado objetivo',
                    'Ser el único responsable de las campañas que publicas, incluyendo su contenido, veracidad y cumplimiento normativo',
                    'No publicar anuncios engañosos, fraudulentos o que violen los derechos de terceros',
                    'Mantener la confidencialidad de tus credenciales de acceso',
                    'Notificarnos inmediatamente si detectas un uso no autorizado de tu cuenta',
                    'Cumplir con las Políticas Publicitarias de Meta, las normas de la plataforma y cualquier legislación aplicable',
                  ]}
                />
                <p>
                  <strong className="text-foreground">
                    AdGenius AI actúa como herramienta de automatización en tu nombre. La
                    responsabilidad legal de los anuncios publicados, su contenido y su impacto
                    recae sobre ti como anunciante.
                  </strong>
                </p>
              </Section>

              {/* 6 */}
              <Section id="cuenta-seguridad" title="6. Cuenta y seguridad">
                <SubSection title="6.1 Registro">
                  <p>
                    Para utilizar el Servicio debes crear una cuenta proporcionando tu correo
                    electrónico, una contraseña y datos básicos de tu negocio. Debes proporcionar
                    información veraz y mantenerla actualizada.
                  </p>
                </SubSection>
                <SubSection title="6.2 Seguridad de la cuenta">
                  <p>
                    Eres responsable de mantener la confidencialidad de tu contraseña y de todas
                    las actividades que ocurran bajo tu cuenta. Debes notificarnos inmediatamente
                    en <Placeholder text="[EMAIL DE CONTACTO]" /> si sospechas acceso no
                    autorizado.
                  </p>
                </SubSection>
                <SubSection title="6.3 Una cuenta por usuario">
                  <p>
                    Cada cuenta es personal e intransferible. No está permitido compartir
                    credenciales con terceros ni ceder el acceso a tu cuenta.
                  </p>
                </SubSection>
                <SubSection title="6.4 Cuenta única por negocio">
                  <p>
                    Salvo que el plan contratado lo permita explícitamente, cada negocio o
                    entidad legal debe operar con una única cuenta en AdGenius AI.
                  </p>
                </SubSection>
              </Section>

              {/* 7 */}
              <Section id="integracion-meta" title="7. Integración con Meta / Facebook">
                <SubSection title="7.1 Autorización OAuth">
                  <p>
                    Para publicar campañas, debes conectar tu cuenta de Meta mediante el flujo de
                    autorización OAuth 2.0. Al hacerlo, autorizas a AdGenius AI a actuar en tu
                    nombre para crear objetos publicitarios (campañas, conjuntos de anuncios,
                    creatividades y anuncios) en tu cuenta publicitaria de Meta.
                  </p>
                </SubSection>
                <SubSection title="7.2 Alcance de la autorización">
                  <p>
                    AdGenius AI utilizará los permisos otorgados exclusivamente para crear y
                    gestionar objetos publicitarios en tu nombre, tal como se describe en nuestra{' '}
                    <Link href="/privacy" className="text-brand hover:underline">
                      Política de Privacidad
                    </Link>
                    . No utilizaremos tu acceso de Meta para ningún otro propósito.
                  </p>
                </SubSection>
                <SubSection title="7.3 Cumplimiento con las Políticas de Meta">
                  <p>
                    El uso de AdGenius AI está sujeto a las{' '}
                    <strong className="text-foreground">
                      Políticas Publicitarias de Meta, los Términos de Servicio de Meta for
                      Developers y las Condiciones de Uso de la Plataforma de Meta
                    </strong>
                    . Eres responsable de asegurarte de que tu uso del Servicio cumple con dichas
                    políticas en todo momento.
                  </p>
                </SubSection>
                <SubSection title="7.4 Responsabilidad de las cuentas publicitarias">
                  <p>
                    Debes ser el titular o tener autorización legítima para usar la cuenta
                    publicitaria de Meta que conectas a AdGenius AI. No nos hacemos responsables
                    de sanciones, suspensiones o bloqueos de Meta derivados de campañas que no
                    cumplen sus políticas.
                  </p>
                </SubSection>
                <SubSection title="7.5 Cambios en la API de Meta">
                  <p>
                    Meta puede modificar, restringir o descontinuar su API en cualquier momento.
                    No garantizamos la disponibilidad continua de las integraciones con Meta y no
                    nos hacemos responsables de interrupciones causadas por cambios en la
                    plataforma de Meta.
                  </p>
                </SubSection>
              </Section>

              {/* 8 */}
              <Section id="campanas" title="8. Campañas y publicidad">
                <SubSection title="8.1 Publicación en estado pausado">
                  <p>
                    Todas las campañas se crean inicialmente en estado{' '}
                    <strong className="text-foreground">PAUSADO</strong>. La activación requiere
                    una acción explícita del usuario. AdGenius AI no activa campañas
                    automáticamente.
                  </p>
                </SubSection>
                <SubSection title="8.2 Presupuesto y gasto publicitario">
                  <p>
                    El presupuesto publicitario es gestionado directamente por Meta en tu cuenta
                    publicitaria. <strong className="text-foreground">AdGenius AI no cobra ni
                    gestiona ningún presupuesto publicitario.</strong> El gasto en anuncios se
                    factura directamente por Meta según las condiciones de tu cuenta publicitaria.
                    Eres el único responsable de controlar tu presupuesto y gasto en Meta.
                  </p>
                </SubSection>
                <SubSection title="8.3 Contenido de los anuncios">
                  <p>
                    Eres responsable de que el contenido de tus anuncios sea veraz, no engañoso,
                    no viole derechos de terceros (marcas, derechos de autor, imagen) y cumpla
                    con la legislación publicitaria de tu jurisdicción y del país donde se
                    publican.
                  </p>
                </SubSection>
                <SubSection title="8.4 URL de destino">
                  <p>
                    El sitio web de destino configurado en tu perfil de negocio es el que se
                    utiliza en los anuncios. Garantizas que dicha URL es un destino legítimo,
                    funcional y que su contenido cumple con las políticas de Meta.
                  </p>
                </SubSection>
              </Section>

              {/* 9 */}
              <Section id="contenido-ia" title="9. Contenido generado por IA">
                <SubSection title="9.1 Tu responsabilidad sobre el contenido">
                  <p>
                    Aunque AdGenius AI genera copys, estrategias e imágenes publicitarias mediante
                    IA, <strong className="text-foreground">tú eres el único responsable del
                    contenido que publicas</strong>. Antes de publicar cualquier campaña, debes
                    revisar y aprobar:
                  </p>
                  <Ul
                    items={[
                      'Que el texto publicitario es veraz y no induce a error',
                      'Que las imágenes generadas son apropiadas y no infringen derechos de terceros',
                      'Que el contenido cumple con las Políticas Publicitarias de Meta',
                      'Que el contenido cumple con la legislación de publicidad aplicable en tu mercado',
                    ]}
                  />
                </SubSection>
                <SubSection title="9.2 Posibles imprecisiones">
                  <p>
                    Los modelos de IA pueden generar contenido incorrecto, sesgado, desactualizado
                    o inapropiado. No garantizamos la exactitud ni idoneidad del contenido
                    generado. El uso de contenido generado por IA sin revisión humana previa es
                    bajo tu propio riesgo.
                  </p>
                </SubSection>
                <SubSection title="9.3 Propiedad del contenido generado">
                  <p>
                    El contenido generado por IA en el contexto de tu cuenta y con tus datos de
                    producto es tuyo. No reclamamos derechos de propiedad sobre los copys e
                    imágenes generados a partir de tu información.
                  </p>
                </SubSection>
              </Section>

              {/* 10 */}
              <Section id="propiedad-intelectual" title="10. Propiedad intelectual">
                <SubSection title="10.1 Propiedad de AdGenius AI">
                  <p>
                    El Servicio, incluyendo su código fuente, diseño, interfaz, algoritmos,
                    modelos, flujos de trabajo, nombre comercial y marca &ldquo;AdGenius AI&rdquo;,
                    son propiedad exclusiva de AdGenius AI o sus licenciantes. Estos Términos no
                    te otorgan ningún derecho sobre dichos activos más allá del uso del Servicio
                    durante la vigencia de tu suscripción.
                  </p>
                </SubSection>
                <SubSection title="10.2 Licencia de uso">
                  <p>
                    Te otorgamos una licencia limitada, no exclusiva, no transferible y revocable
                    para acceder y utilizar el Servicio de acuerdo con estos Términos y las
                    condiciones de tu plan de suscripción.
                  </p>
                </SubSection>
                <SubSection title="10.3 Tu contenido">
                  <p>
                    Conservas la propiedad de toda la información, imágenes y contenido que
                    subes a AdGenius AI (información del negocio, imágenes de productos, etc.).
                    Nos concedes una licencia limitada para procesar y utilizar dicho contenido
                    exclusivamente para prestarte el Servicio.
                  </p>
                </SubSection>
                <SubSection title="10.4 Derechos de terceros">
                  <p>
                    No debes subir ni utilizar contenido que infrinja derechos de autor, marcas
                    registradas, derechos de imagen u otros derechos de terceros. Eres responsable
                    de asegurarte de que tienes los derechos necesarios sobre el contenido que
                    utilizas en tus campañas.
                  </p>
                </SubSection>
              </Section>

              {/* 11 */}
              <Section id="uso-aceptable" title="11. Uso aceptable">
                <p>
                  Queda <strong className="text-foreground">prohibido</strong> utilizar AdGenius AI
                  para:
                </p>
                <Ul
                  items={[
                    'Publicar anuncios engañosos, fraudulentos o que contengan información falsa',
                    'Promover productos o servicios ilegales en el país de destino',
                    'Crear campañas que violen las Políticas Publicitarias de Meta o de cualquier otra plataforma',
                    'Anunciar categorías especiales restringidas (armas, productos para adultos, juegos de azar, servicios financieros de alto riesgo) sin cumplir los requisitos legales y de plataforma aplicables',
                    'Publicar contenido discriminatorio, ofensivo, difamatorio o que incite al odio',
                    'Intentar acceder de forma no autorizada a sistemas, cuentas de otros usuarios o infraestructura del Servicio',
                    'Realizar ingeniería inversa, descompilar o intentar extraer el código fuente del Servicio',
                    'Utilizar el Servicio de forma que supere los límites del plan contratado o de un modo que perjudique a otros usuarios',
                    'Revender, sublicenciar o transferir el acceso al Servicio a terceros sin autorización expresa',
                    'Introducir malware, virus u otro código dañino en el Servicio',
                    'Usar el Servicio con fines ilegales o contrarios a estos Términos',
                  ]}
                />
                <p>
                  Nos reservamos el derecho de suspender o cancelar cuentas que incumplan estas
                  restricciones, con o sin previo aviso, según la gravedad del incumplimiento.
                </p>
              </Section>

              {/* 12 */}
              <Section id="pagos" title="12. Pagos y suscripciones">
                <SubSection title="12.1 Planes y precios">
                  <p>
                    AdGenius AI ofrece diferentes planes de suscripción con distintos límites de
                    uso (campañas, productos, generaciones de IA, cuentas de Meta, etc.). Los
                    precios y características de cada plan se publican en{' '}
                    <Placeholder text="[DOMINIO]" /> y pueden cambiar con previo aviso.
                  </p>
                </SubSection>
                <SubSection title="12.2 Período de prueba">
                  <p>
                    Los nuevos usuarios tienen acceso a un período de prueba gratuito. Al
                    finalizar el período de prueba, necesitas contratar un plan de pago para
                    continuar usando el Servicio.
                  </p>
                </SubSection>
                <SubSection title="12.3 Facturación">
                  <p>
                    Las suscripciones se facturan de forma recurrente (mensual o anual, según el
                    plan elegido). La gestión de pagos se realiza a través de{' '}
                    <Placeholder text="[PROCESADOR DE PAGOS]" />. Al suscribirte, autorizas el
                    cobro recurrente del importe correspondiente.
                  </p>
                </SubSection>
                <SubSection title="12.4 Reembolsos">
                  <p>
                    <Placeholder text="[POLÍTICA DE REEMBOLSOS PENDIENTE DE DEFINIR]" />. Si
                    tienes dudas sobre reembolsos, contáctanos en{' '}
                    <Placeholder text="[EMAIL DE CONTACTO]" />.
                  </p>
                </SubSection>
                <SubSection title="12.5 Cambios de precio">
                  <p>
                    Podemos modificar los precios de las suscripciones con al menos{' '}
                    <Placeholder text="[X]" /> días de antelación antes del siguiente ciclo de
                    facturación. El uso continuado del Servicio tras la entrada en vigor del nuevo
                    precio constituye tu aceptación.
                  </p>
                </SubSection>
                <SubSection title="12.6 Gasto publicitario">
                  <p>
                    El gasto en campañas publicitarias en Meta se factura directamente por Meta y
                    es completamente independiente de tu suscripción a AdGenius AI. No somos
                    responsables de los cargos de Meta en tu cuenta publicitaria.
                  </p>
                </SubSection>
              </Section>

              {/* 13 */}
              <Section id="limitacion" title="13. Limitación de responsabilidad">
                <p>
                  En la máxima medida permitida por la legislación aplicable:
                </p>
                <SubSection title="13.1 Exclusión de garantías">
                  <p>
                    El Servicio se proporciona <strong className="text-foreground">&ldquo;tal
                    cual&rdquo;</strong> y <strong className="text-foreground">&ldquo;según
                    disponibilidad&rdquo;</strong>, sin garantías de ningún tipo, expresas o
                    implícitas. No garantizamos que el Servicio sea ininterrumpido, libre de
                    errores, seguro o que los resultados obtenidos sean precisos o fiables.
                  </p>
                </SubSection>
                <SubSection title="13.2 Limitación de daños">
                  <p>
                    AdGenius AI no será responsable por daños indirectos, incidentales, especiales,
                    consecuentes o punitivos, incluyendo pérdida de beneficios, pérdida de datos,
                    pérdida de clientes, daño reputacional o cualquier otro daño intangible,
                    incluso si hemos sido advertidos de la posibilidad de dichos daños.
                  </p>
                </SubSection>
                <SubSection title="13.3 Responsabilidad máxima">
                  <p>
                    La responsabilidad total acumulada de AdGenius AI hacia ti por cualquier
                    reclamación derivada del uso del Servicio no superará el importe que hayas
                    pagado a AdGenius AI durante los{' '}
                    <Placeholder text="[X]" /> meses anteriores al evento que dio lugar a la
                    reclamación, o <Placeholder text="[IMPORTE MÍNIMO]" />, lo que sea mayor.
                  </p>
                </SubSection>
                <SubSection title="13.4 Campañas y resultados publicitarios">
                  <p>
                    No somos responsables de los resultados de las campañas publicitarias
                    (impresiones, clics, conversiones, ventas, ROI), de las decisiones
                    algorítmicas de Meta, de suspensiones o rechazos de anuncios por parte de
                    Meta, ni del gasto publicitario incurrido en tu cuenta de Meta.
                  </p>
                </SubSection>
              </Section>

              {/* 14 */}
              <Section id="disponibilidad" title="14. Disponibilidad del servicio">
                <p>
                  Nos esforzamos por mantener AdGenius AI disponible de forma continua, pero no
                  podemos garantizar una disponibilidad del 100%. El Servicio puede estar
                  temporalmente no disponible por:
                </p>
                <Ul
                  items={[
                    'Mantenimiento planificado o no planificado',
                    'Actualizaciones del sistema',
                    'Fallos de proveedores externos (Supabase, Anthropic, Meta, etc.)',
                    'Causas de fuerza mayor (desastres naturales, ciberataques, interrupciones de infraestructura)',
                  ]}
                />
                <p>
                  No nos hacemos responsables de los daños derivados de interrupciones del
                  Servicio fuera de nuestro control razonable.
                </p>
              </Section>

              {/* 15 */}
              <Section id="suspension" title="15. Suspensión y cancelación">
                <SubSection title="15.1 Cancelación por el usuario">
                  <p>
                    Puedes cancelar tu suscripción en cualquier momento desde la sección de
                    Suscripción en tu cuenta. La cancelación tendrá efecto al final del período
                    de facturación en curso.
                  </p>
                </SubSection>
                <SubSection title="15.2 Suspensión por incumplimiento">
                  <p>
                    Podemos suspender o cancelar tu acceso al Servicio de forma inmediata y sin
                    previo aviso si:
                  </p>
                  <Ul
                    items={[
                      'Incumples estos Términos o nuestra Política de Privacidad',
                      'Utilizas el Servicio para actividades ilegales o fraudulentas',
                      'Tu uso pone en riesgo la seguridad o integridad del Servicio o de otros usuarios',
                      'No pagas los importes debidos dentro del plazo establecido',
                      'Meta suspende o limita nuestra capacidad de operar en su plataforma',
                    ]}
                  />
                </SubSection>
                <SubSection title="15.3 Efectos de la cancelación">
                  <p>
                    Tras la cancelación o suspensión de tu cuenta:
                  </p>
                  <Ul
                    items={[
                      'Perderás acceso al Servicio y a los datos almacenados en AdGenius AI',
                      'Los objetos publicitarios ya creados en Meta permanecerán en tu cuenta de Meta y no serán eliminados automáticamente',
                      'Podrás solicitar la exportación de tus datos antes de la cancelación escribiendo a ' ,
                    ]}
                  />
                  <p>
                    Puedes solicitar la exportación de tus datos antes de la cancelación
                    escribiendo a <Placeholder text="[EMAIL DE CONTACTO]" />.
                  </p>
                </SubSection>
              </Section>

              {/* 16 */}
              <Section id="modificaciones" title="16. Modificaciones de los términos">
                <p>
                  Podemos modificar estos Términos en cualquier momento. Cuando lo hagamos:
                </p>
                <Ol
                  items={[
                    'Publicaremos la versión actualizada en esta página con una nueva fecha de vigencia',
                    <>
                      Para cambios materiales que afecten significativamente tus derechos u
                      obligaciones, te notificaremos con al menos{' '}
                      <Placeholder text="[X]" /> días de antelación por correo electrónico o
                      mediante un aviso prominente en la aplicación
                    </>,
                    'El uso continuado del Servicio después de la fecha de vigencia de los cambios constituye tu aceptación de los nuevos Términos',
                  ]}
                />
                <p>
                  Si no estás de acuerdo con las modificaciones, debes dejar de utilizar el
                  Servicio antes de la fecha de entrada en vigor.
                </p>
              </Section>

              {/* 17 */}
              <Section id="legislacion" title="17. Legislación aplicable y resolución de conflictos">
                <SubSection title="17.1 Legislación aplicable">
                  <p>
                    Estos Términos se rigen e interpretan de conformidad con las leyes de{' '}
                    <Placeholder text="[JURISDICCIÓN]" />, sin perjuicio de las normas de
                    protección al consumidor obligatorias que puedan aplicarse en tu país de
                    residencia.
                  </p>
                </SubSection>
                <SubSection title="17.2 Resolución de conflictos">
                  <p>
                    Ante cualquier disputa derivada de estos Términos o del uso del Servicio, las
                    partes se comprometen a intentar resolverla de manera amistosa en primer lugar,
                    contactando a <Placeholder text="[EMAIL DE CONTACTO]" />. Si no se alcanza
                    una solución amistosa en un plazo de <Placeholder text="[X]" /> días, las
                    disputas se someterán a los tribunales competentes de{' '}
                    <Placeholder text="[JURISDICCIÓN]" />.
                  </p>
                </SubSection>
                <SubSection title="17.3 Nulidad parcial">
                  <p>
                    Si alguna disposición de estos Términos es declarada inválida o inaplicable,
                    las demás disposiciones permanecerán en plena vigencia.
                  </p>
                </SubSection>
              </Section>

              {/* 18 */}
              <Section id="contacto" title="18. Contacto">
                <p>
                  Para cualquier pregunta, reclamación o solicitud relacionada con estos Términos
                  y Condiciones, contáctanos en:
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
                  Nos comprometemos a responder todas las solicitudes en un plazo razonable.
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
                Fecha de vigencia: <Placeholder text={EFFECTIVE_DATE} />
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
            <span className="text-foreground font-medium">Términos de Servicio</span>
            <span aria-hidden="true">·</span>
            <Link href="/privacy" className="hover:text-foreground transition-colors">
              Política de Privacidad
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
