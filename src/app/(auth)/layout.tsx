import Link from 'next/link'
import { Sparkles } from 'lucide-react'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Left panel — branding */}
      <div className="hidden lg:flex flex-col justify-between p-10 bg-brand">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-white/20">
            <Sparkles className="size-4 text-white" />
          </div>
          <span className="text-lg font-semibold text-white">AdGenius AI</span>
        </Link>

        <div className="space-y-4">
          <blockquote className="space-y-2">
            <p className="text-lg text-white/90 leading-relaxed">
              &ldquo;Aumentamos nuestras ventas un 40% en el primer mes usando AdGenius para nuestras
              campañas de Facebook.&rdquo;
            </p>
            <footer className="text-white/70 text-sm">
              — María García, Tienda La Moda
            </footer>
          </blockquote>
        </div>

        <div className="space-y-3">
          {[
            'Crea campañas con IA en segundos',
            'Audiencias optimizadas automáticamente',
            'Conecta directamente con Meta Ads',
          ].map((text) => (
            <div key={text} className="flex items-center gap-2.5 text-white/80 text-sm">
              <div className="size-1.5 rounded-full bg-white/60 flex-shrink-0" />
              {text}
            </div>
          ))}
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex flex-col items-center justify-center p-6 sm:p-10">
        {/* Mobile logo */}
        <Link href="/" className="flex items-center gap-2 mb-8 lg:hidden">
          <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-brand">
            <Sparkles className="size-4 text-white" />
          </div>
          <span className="font-semibold text-foreground">AdGenius AI</span>
        </Link>

        <div className="w-full max-w-sm">{children}</div>
      </div>
    </div>
  )
}
