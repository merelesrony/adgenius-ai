'use client'

import * as React from 'react'
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'

interface ImageUploadProps {
  images: string[]
  onChange: (urls: string[]) => void
  userId: string
  maxImages?: number
  className?: string
}

export function ImageUpload({
  images,
  onChange,
  userId,
  maxImages = 5,
  className,
}: ImageUploadProps) {
  const [uploading, setUploading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const inputRef = React.useRef<HTMLInputElement>(null)
  const supabase = createClient()

  async function handleFiles(files: FileList) {
    setError(null)
    const remaining = maxImages - images.length
    if (remaining <= 0) {
      setError(`Máximo ${maxImages} imágenes`)
      return
    }

    const toUpload = Array.from(files).slice(0, remaining)
    setUploading(true)

    const uploaded: string[] = []

    for (const file of toUpload) {
      if (file.size > 5 * 1024 * 1024) {
        setError(`"${file.name}" supera el límite de 5 MB`)
        continue
      }
      const ext = file.name.split('.').pop()
      const path = `${userId}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`

      const { data, error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(path, file, { upsert: false })

      if (uploadError) {
        setError(`Error subiendo ${file.name}: ${uploadError.message}`)
        continue
      }

      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(data.path)

      uploaded.push(publicUrl)
    }

    onChange([...images, ...uploaded])
    setUploading(false)
  }

  async function removeImage(url: string) {
    // Extract path from URL for deletion
    const urlObj = new URL(url)
    const path = urlObj.pathname.split('/product-images/')[1]
    if (path) {
      await supabase.storage.from('product-images').remove([path])
    }
    onChange(images.filter((u) => u !== url))
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    if (e.dataTransfer.files.length) {
      handleFiles(e.dataTransfer.files)
    }
  }

  return (
    <div className={cn('space-y-3', className)}>
      {/* Thumbnails */}
      {images.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {images.map((url, i) => (
            <div
              key={url}
              className="relative size-20 rounded-lg overflow-hidden border border-border group"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt={`Imagen ${i + 1}`} className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => removeImage(url)}
                className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label="Eliminar imagen"
              >
                <X className="size-4 text-white" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Drop zone */}
      {images.length < maxImages && (
        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => inputRef.current?.click()}
          className={cn(
            'flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-6 cursor-pointer transition-colors',
            'border-border hover:border-brand/50 hover:bg-brand/5',
            uploading && 'pointer-events-none opacity-70',
          )}
        >
          {uploading ? (
            <>
              <Loader2 className="size-6 text-brand animate-spin" />
              <p className="text-sm text-muted-foreground">Subiendo imágenes...</p>
            </>
          ) : (
            <>
              {images.length === 0 ? (
                <ImageIcon className="size-8 text-muted-foreground" />
              ) : (
                <Upload className="size-6 text-muted-foreground" />
              )}
              <div className="text-center">
                <p className="text-sm font-medium text-foreground">
                  {images.length === 0 ? 'Subir imágenes del producto' : 'Agregar más imágenes'}
                </p>
                <p className="text-xs text-muted-foreground">
                  Arrastra o haz clic · JPG, PNG, WebP · máx 5 MB · {images.length}/{maxImages}
                </p>
              </div>
            </>
          )}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        multiple
        className="hidden"
        onChange={(e) => { if (e.target.files) handleFiles(e.target.files) }}
      />

      {error && (
        <p className="text-xs text-destructive">{error}</p>
      )}
    </div>
  )
}
