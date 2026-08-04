import type { ComponentType } from 'react'
import {
  Package, DollarSign, MapPin, Target, Sparkles, CheckCircle, Palette, Rocket,
} from 'lucide-react'
import type { BuilderStep, MetaPlatform } from './types'

export interface BuilderStepConfig {
  id: BuilderStep
  label: string
  sublabel: string
  icon: ComponentType<{ className?: string }>
}

export const BUILDER_STEPS: BuilderStepConfig[] = [
  { id: 1, label: 'Producto',    sublabel: '¿Qué vendes?',          icon: Package     },
  { id: 2, label: 'Presupuesto', sublabel: 'Define tu inversión',    icon: DollarSign  },
  { id: 3, label: 'Destino',     sublabel: 'Dónde anunciar',         icon: MapPin      },
  { id: 4, label: 'Meta',        sublabel: 'Plataforma de destino',  icon: Target      },
  { id: 5, label: 'IA Brain',    sublabel: 'Procesando estrategia',  icon: Sparkles    },
  { id: 6, label: 'Estrategia',  sublabel: 'Revisa y confirma',      icon: CheckCircle },
  { id: 7, label: 'Creativos',   sublabel: 'Motor creativo IA',      icon: Palette     },
  { id: 8, label: 'Final',       sublabel: 'Lista para publicar',    icon: Rocket      },
]

export const WORKING_STEPS = [
  'Analizando producto',
  'Generando estrategia',
  'Creando copy',
  'Generando imagen',
  'Configurando audiencia',
  'Preparando campaña',
] as const

export const TOTAL_STEPS = BUILDER_STEPS.length  // 8

export interface MetaPlatformConfig {
  id: MetaPlatform
  label: string
  description: string
  initial: string
  colorClass: string
}

export const META_PLATFORMS: MetaPlatformConfig[] = [
  {
    id: 'page',
    label: 'Página de Facebook',
    description: 'Publicaciones orgánicas en tu página',
    initial: 'P',
    colorClass: 'bg-blue-600',
  },
  {
    id: 'facebook',
    label: 'Facebook Feed',
    description: 'Anuncios en el feed de Facebook',
    initial: 'f',
    colorClass: 'bg-blue-500',
  },
  {
    id: 'instagram',
    label: 'Instagram',
    description: 'Feed, Reels e historias',
    initial: 'IG',
    colorClass: 'bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400',
  },
  {
    id: 'messenger',
    label: 'Messenger',
    description: 'Anuncios en Facebook Messenger',
    initial: 'M',
    colorClass: 'bg-indigo-500',
  },
  {
    id: 'whatsapp',
    label: 'WhatsApp Business',
    description: 'Anuncios que abren WhatsApp',
    initial: 'W',
    colorClass: 'bg-green-500',
  },
]
