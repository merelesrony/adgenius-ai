'use client'

import { useState, useEffect, useRef } from 'react'
import { Modal } from '@/components/ui/modal'
import { Input, Textarea, Select } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { ImageUpload } from '@/features/campaigns/components/image-upload'
import { BUSINESS_CATEGORIES, CURRENCIES } from '@/constants/options'
import type { Database } from '@/types/database'

type ProductRow = Database['public']['Tables']['products']['Row']

export interface ProductFormData {
  name: string
  description: string | null
  category: string | null
  price: number | null
  currency: string
  is_active: boolean
  images: string[]
}

interface ProductFormModalProps {
  open: boolean
  onClose: () => void
  onSave: (data: ProductFormData) => void
  product?: ProductRow | null
  userId: string
  isLoading?: boolean
}

const CATEGORY_OPTIONS = [
  { value: '', label: 'Sin categoría' },
  ...BUSINESS_CATEGORIES,
]

export function ProductFormModal({
  open,
  onClose,
  onSave,
  product,
  userId,
  isLoading,
}: ProductFormModalProps) {
  const formRef = useRef<HTMLFormElement>(null)

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('')
  const [price, setPrice] = useState('')
  const [currency, setCurrency] = useState('USD')
  const [isActive, setIsActive] = useState(true)
  const [images, setImages] = useState<string[]>([])

  useEffect(() => {
    if (open) {
      setName(product?.name ?? '')
      setDescription(product?.description ?? '')
      setCategory(product?.category ?? '')
      setPrice(product?.price != null ? String(product.price) : '')
      setCurrency(product?.currency ?? 'USD')
      setIsActive(product?.is_active ?? true)
      setImages((product?.images as string[] | null) ?? [])
    }
  }, [open, product])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    onSave({
      name: name.trim(),
      description: description.trim() || null,
      category: category || null,
      price: price ? Number(price) : null,
      currency,
      is_active: isActive,
      images,
    })
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={product ? 'Editar producto' : 'Nuevo producto'}
      description={
        product
          ? 'Modifica los datos del producto.'
          : 'Agrega un nuevo producto o servicio a tu biblioteca.'
      }
      size="xl"
      footer={
        <>
          <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={() => formRef.current?.requestSubmit()}
            loading={isLoading}
            disabled={isLoading || !name.trim()}
          >
            {product ? 'Guardar cambios' : 'Crear producto'}
          </Button>
        </>
      }
    >
      <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Nombre del producto o servicio"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          maxLength={150}
          placeholder="Ej: Perfume Dior Sauvage 100ml"
        />

        <Textarea
          label="Descripción"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          placeholder="Describe el producto: características, propuesta de valor, a quién va dirigido..."
          hint="Una buena descripción mejora la calidad de los creativos IA."
        />

        <Select
          label="Categoría"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          options={CATEGORY_OPTIONS}
        />

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Precio"
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="0.00"
            min={0}
            hint="Opcional"
          />
          <Select
            label="Moneda"
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            options={CURRENCIES}
          />
        </div>

        <div className="flex items-center gap-2.5 rounded-lg border border-border bg-muted/30 px-3 py-2.5">
          <input
            type="checkbox"
            id="product_is_active"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            className="size-4 rounded accent-brand"
          />
          <label htmlFor="product_is_active" className="text-sm text-foreground cursor-pointer select-none">
            Producto activo
          </label>
          <span className="text-xs text-muted-foreground ml-1 hidden sm:inline">
            — Los productos inactivos no aparecen en el selector de campañas
          </span>
        </div>

        <div>
          <p className="text-xs font-medium text-foreground mb-2">
            Imágenes del producto
            <span className="text-muted-foreground font-normal ml-1">(máx. 5)</span>
          </p>
          <ImageUpload images={images} onChange={setImages} userId={userId} maxImages={5} />
        </div>
      </form>
    </Modal>
  )
}
