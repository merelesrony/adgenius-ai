'use client'

import { useState } from 'react'
import { ThumbsUp, MessageCircle, Share2, Heart, Bookmark, MoreHorizontal, Send } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { GeneratedCreative } from '../creative-types'

type PreviewFormat = 'facebook' | 'instagram' | 'stories' | 'messenger'

const TABS: { id: PreviewFormat; label: string }[] = [
  { id: 'facebook', label: 'Facebook' },
  { id: 'instagram', label: 'Instagram' },
  { id: 'stories', label: 'Stories' },
  { id: 'messenger', label: 'Messenger' },
]

interface AdPreviewProps {
  creative: GeneratedCreative
  pageName?: string
}

function ImagePlaceholder({ src, alt, className }: { src: string; alt: string; className?: string }) {
  const [loaded, setLoaded] = useState(false)
  const hasUrl = !!src
  return (
    <div className={cn('relative bg-muted overflow-hidden', className)}>
      {(!hasUrl || !loaded) && (
        <div className="absolute inset-0 bg-gradient-to-br from-muted to-muted/60 animate-pulse" />
      )}
      {/* Never render <img> with empty src */}
      {hasUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={alt}
          className={cn('w-full h-full object-cover transition-opacity duration-500', loaded ? 'opacity-100' : 'opacity-0')}
          onLoad={() => setLoaded(true)}
        />
      )}
    </div>
  )
}

function FacebookPreview({ creative, pageName }: { creative: GeneratedCreative; pageName: string }) {
  return (
    <div className="rounded-xl border border-border bg-white dark:bg-[#1c1e21] overflow-hidden shadow-sm max-w-sm mx-auto text-[#050505] dark:text-white">
      {/* Post header */}
      <div className="flex items-start gap-2 p-3">
        <div className="size-9 rounded-full bg-brand/20 flex items-center justify-center shrink-0">
          <span className="text-xs font-bold text-brand">{pageName[0]?.toUpperCase()}</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold leading-tight">{pageName}</p>
          <div className="flex items-center gap-1 mt-0.5">
            <span className="text-[10px] text-muted-foreground">Patrocinado</span>
            <span className="text-[10px] text-muted-foreground">·</span>
            <span className="text-[10px] text-muted-foreground">🌐</span>
          </div>
        </div>
        <MoreHorizontal className="size-4 text-muted-foreground shrink-0" />
      </div>
      {/* Copy */}
      <div className="px-3 pb-2">
        <p className="text-xs leading-relaxed line-clamp-3">{creative.primaryText}</p>
      </div>
      {/* Image (landscape crop) */}
      <ImagePlaceholder src={creative.imageUrl} alt={creative.headline} className="w-full aspect-[1.91/1]" />
      {/* Headline block */}
      <div className="border-t border-border/30 p-3 flex items-center justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground">tu-tienda.com</p>
          <p className="text-xs font-bold truncate mt-0.5">{creative.headline}</p>
          <p className="text-[10px] text-muted-foreground truncate">{creative.description}</p>
        </div>
        <button className="shrink-0 text-[11px] font-semibold px-3 py-1.5 rounded border border-border bg-muted hover:bg-muted/80 transition-colors">
          {creative.cta}
        </button>
      </div>
      {/* Engagement row */}
      <div className="px-3 pb-3 flex items-center justify-between border-t border-border/20 pt-2">
        <div className="flex items-center gap-0.5">
          <span className="text-[11px]">👍❤️😮</span>
          <span className="text-[10px] text-muted-foreground ml-1">247</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[10px] text-muted-foreground">18 comentarios</span>
          <span className="text-[10px] text-muted-foreground">4 veces compartido</span>
        </div>
      </div>
      <div className="flex border-t border-border/20">
        {[{ icon: ThumbsUp, label: 'Me gusta' }, { icon: MessageCircle, label: 'Comentar' }, { icon: Share2, label: 'Compartir' }].map(({ icon: Icon, label }) => (
          <button key={label} className="flex-1 flex items-center justify-center gap-1.5 py-2 hover:bg-muted/40 transition-colors">
            <Icon className="size-3.5 text-muted-foreground" />
            <span className="text-[10px] text-muted-foreground">{label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

function InstagramPreview({ creative, pageName }: { creative: GeneratedCreative; pageName: string }) {
  return (
    <div className="rounded-xl border border-border bg-white dark:bg-black overflow-hidden shadow-sm max-w-sm mx-auto">
      {/* Header */}
      <div className="flex items-center gap-2.5 p-3">
        <div className="size-8 rounded-full bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 p-0.5">
          <div className="size-full rounded-full bg-white dark:bg-black flex items-center justify-center">
            <span className="text-[10px] font-bold text-foreground">{pageName[0]?.toUpperCase()}</span>
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold leading-tight dark:text-white">{pageName.toLowerCase().replace(/\s/g, '_')}</p>
          <p className="text-[10px] text-muted-foreground">Patrocinado</p>
        </div>
        <MoreHorizontal className="size-4 text-muted-foreground" />
      </div>
      {/* Square image */}
      <ImagePlaceholder src={creative.imageUrl} alt={creative.headline} className="w-full aspect-square" />
      {/* Actions */}
      <div className="p-3 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Heart className="size-5 dark:text-white" />
            <MessageCircle className="size-5 dark:text-white" />
            <Send className="size-5 dark:text-white" />
          </div>
          <Bookmark className="size-5 dark:text-white" />
        </div>
        <p className="text-xs font-bold dark:text-white">1,247 Me gusta</p>
        <p className="text-xs dark:text-white">
          <span className="font-bold">{pageName.toLowerCase().replace(/\s/g, '_')}</span>{' '}
          <span className="line-clamp-2 dark:text-gray-300">{creative.primaryText}</span>
        </p>
        <button className="w-full text-[11px] font-bold py-2 rounded-lg bg-brand text-white">
          {creative.cta}
        </button>
      </div>
    </div>
  )
}

function StoriesPreview({ creative, pageName }: { creative: GeneratedCreative; pageName: string }) {
  return (
    <div className="mx-auto" style={{ width: 200, height: 355 }}>
      <div className="relative w-full h-full rounded-2xl overflow-hidden border border-border shadow-sm">
        {/* Background image */}
        <ImagePlaceholder src={creative.imageUrl} alt={creative.headline} className="absolute inset-0 w-full h-full" />
        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60" />
        {/* Top bar */}
        <div className="absolute top-0 left-0 right-0 p-2">
          <div className="flex gap-0.5 mb-2">
            {[0, 1, 2].map((i) => (
              <div key={i} className={cn('flex-1 h-0.5 rounded-full', i === 0 ? 'bg-white' : 'bg-white/40')} />
            ))}
          </div>
          <div className="flex items-center gap-1.5">
            <div className="size-5 rounded-full bg-brand/80" />
            <span className="text-[10px] text-white font-semibold truncate">{pageName}</span>
            <span className="text-[9px] text-white/70">· Patrocinado</span>
          </div>
        </div>
        {/* Bottom CTA */}
        <div className="absolute bottom-0 left-0 right-0 p-3 space-y-1">
          <p className="text-xs text-white font-bold line-clamp-2">{creative.headline}</p>
          <div className="flex items-center justify-center gap-1 pt-1">
            <span className="text-[9px] text-white/80">↑ Desliza hacia arriba</span>
          </div>
          <button className="w-full text-[10px] font-bold py-1.5 rounded-lg bg-white text-black">
            {creative.cta}
          </button>
        </div>
      </div>
    </div>
  )
}

function MessengerPreview({ creative, pageName }: { creative: GeneratedCreative; pageName: string }) {
  return (
    <div className="max-w-sm mx-auto rounded-xl border border-border bg-white dark:bg-[#1c1e21] overflow-hidden shadow-sm">
      {/* Chat header */}
      <div className="flex items-center gap-2.5 p-3 border-b border-border/30">
        <div className="size-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
          <span className="text-xs font-bold text-white">{pageName[0]?.toUpperCase()}</span>
        </div>
        <div>
          <p className="text-xs font-bold dark:text-white">{pageName}</p>
          <p className="text-[10px] text-muted-foreground">Mensaje patrocinado</p>
        </div>
      </div>
      {/* Chat bubble */}
      <div className="p-3 space-y-2">
        <div className="bg-[#f0f2f5] dark:bg-[#3a3b3c] rounded-2xl rounded-tl-none p-3 max-w-[85%] space-y-2">
          <ImagePlaceholder src={creative.imageUrl} alt={creative.headline} className="w-full rounded-lg aspect-[1.5/1]" />
          <p className="text-xs font-bold dark:text-white">{creative.headline}</p>
          <p className="text-[10px] dark:text-gray-300 line-clamp-2">{creative.primaryText}</p>
          <button className="text-[10px] font-bold text-blue-500 border border-blue-500 px-3 py-1 rounded-full">
            {creative.cta}
          </button>
        </div>
      </div>
      {/* Reply bar */}
      <div className="border-t border-border/30 px-3 py-2 flex items-center gap-2">
        <div className="flex-1 bg-muted rounded-full px-3 py-1.5">
          <span className="text-[10px] text-muted-foreground">Escribe un mensaje...</span>
        </div>
        <Send className="size-4 text-brand shrink-0" />
      </div>
    </div>
  )
}

export function AdPreview({ creative, pageName = 'Tu Empresa' }: AdPreviewProps) {
  const [format, setFormat] = useState<PreviewFormat>('instagram')

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex rounded-lg border border-border bg-muted/30 p-0.5 gap-0.5">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setFormat(tab.id)}
            className={cn(
              'flex-1 text-[11px] font-medium py-1.5 rounded-md transition-all',
              format === tab.id
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Preview */}
      <div className="flex items-start justify-center py-2">
        {format === 'facebook' && <FacebookPreview creative={creative} pageName={pageName} />}
        {format === 'instagram' && <InstagramPreview creative={creative} pageName={pageName} />}
        {format === 'stories' && <StoriesPreview creative={creative} pageName={pageName} />}
        {format === 'messenger' && <MessengerPreview creative={creative} pageName={pageName} />}
      </div>
    </div>
  )
}
