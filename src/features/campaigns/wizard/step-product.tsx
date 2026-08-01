'use client'

import { useState } from 'react'
import { Package, PlusCircle, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Input, Textarea, Select } from '@/components/ui/input'
import { BUSINESS_CATEGORIES, CURRENCIES } from '@/constants/options'
import { stepProductSchema } from '@/lib/validations/campaign'
import { CreativeSelector } from '../components/creative-selector'
import { useWizard } from '../context'
import type { ExistingProduct } from '../types'

interface StepProductProps {
  existingProducts: ExistingProduct[]
  userId: string
}

export function StepProduct({ existingProducts, userId }: StepProductProps) {
  const { data, update, next, back } = useWizard()
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [useExisting, setUseExisting] = useState(!!data.existingProductId)

  function selectExisting(product: ExistingProduct) {
    update({
      existingProductId: product.id,
      productName: product.name,
      productPrice: product.price,
      productCurrency: product.currency ?? 'USD',
      productCategory: product.category ?? '',
      productDescription: product.description ?? '',
      productImages: Array.isArray(product.images) ? (product.images as string[]) : [],
    })
  }

  function handleNext() {
    const result = stepProductSchema.safeParse({
      existingProductId: data.existingProductId,
      productName: data.productName,
      productPrice: data.productPrice,
      productCurrency: data.productCurrency,
      productCategory: data.productCategory,
      productDescription: data.productDescription,
      productImages: data.productImages,
    })

    if (!result.success) {
      const flat = result.error.flatten().fieldErrors
      setErrors(Object.fromEntries(
        Object.entries(flat).map(([k, v]) => [k, v?.[0] ?? ''])
      ))
      return
    }
    setErrors({})
    next()
  }

  return (
    <div className="space-y-6">
      {/* Toggle existing / new */}
      {existingProducts.length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => { setUseExisting(true); update({ existingProductId: null }) }}
            className={cn(
              'flex items-center gap-2 rounded-xl border-2 p-3 text-sm font-medium transition-all',
              useExisting
                ? 'border-brand bg-brand/5 text-brand'
                : 'border-border text-foreground hover:border-brand/40',
            )}
          >
            <Package className="size-4 shrink-0" />
            Producto existente
          </button>
          <button
            type="button"
            onClick={() => {
              setUseExisting(false)
              update({
                existingProductId: null,
                productName: '',
                productPrice: null,
                productCurrency: 'USD',
                productCategory: '',
                productDescription: '',
                productImages: [],
              })
            }}
            className={cn(
              'flex items-center gap-2 rounded-xl border-2 p-3 text-sm font-medium transition-all',
              !useExisting
                ? 'border-brand bg-brand/5 text-brand'
                : 'border-border text-foreground hover:border-brand/40',
            )}
          >
            <PlusCircle className="size-4 shrink-0" />
            Nuevo producto
          </button>
        </div>
      )}

      {/* Existing products list */}
      {useExisting && existingProducts.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-foreground">Selecciona un producto</p>
          <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
            {existingProducts.map((p) => {
              const selected = data.existingProductId === p.id
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => selectExisting(p)}
                  className={cn(
                    'w-full flex items-start gap-3 rounded-xl border-2 p-3 text-left transition-all',
                    selected
                      ? 'border-brand bg-brand/5'
                      : 'border-border hover:border-brand/40',
                  )}
                >
                  <div className={cn(
                    'mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg',
                    selected ? 'bg-brand text-white' : 'bg-muted text-muted-foreground',
                  )}>
                    {selected ? <Check className="size-4" /> : <Package className="size-4" />}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{p.name}</p>
                    {p.price && (
                      <p className="text-xs text-muted-foreground">
                        {p.currency} {p.price}
                      </p>
                    )}
                    {p.description && (
                      <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                        {p.description}
                      </p>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
          {!data.existingProductId && (
            <p className="text-xs text-muted-foreground">
              Selecciona un producto para continuar, o cambia a &quot;Nuevo producto&quot;.
            </p>
          )}
        </div>
      )}

      {/* New product form */}
      {(!useExisting || existingProducts.length === 0) && (
        <div className="space-y-4">
          <Input
            label="Nombre del producto o servicio"
            placeholder="Ej: Curso de Marketing Digital"
            value={data.productName}
            onChange={(e) => update({ productName: e.target.value })}
            error={errors.productName}
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Precio"
              type="number"
              placeholder="99.00"
              value={data.productPrice ?? ''}
              onChange={(e) => update({ productPrice: e.target.value ? Number(e.target.value) : null })}
              error={errors.productPrice}
              hint="Opcional"
            />
            <Select
              label="Moneda"
              value={data.productCurrency}
              onChange={(e) => update({ productCurrency: e.target.value })}
              options={CURRENCIES}
            />
          </div>

          <Select
            label="Categoría"
            value={data.productCategory}
            onChange={(e) => update({ productCategory: e.target.value })}
            options={BUSINESS_CATEGORIES}
            placeholder="Selecciona una categoría"
            error={errors.productCategory}
            required
          />

          <Textarea
            label="Descripción del producto"
            placeholder="Describe tu producto: beneficios, características únicas, propuesta de valor..."
            value={data.productDescription}
            onChange={(e) => update({ productDescription: e.target.value })}
            error={errors.productDescription}
            hint="Cuanto más detallada, mejor será el copy generado por IA."
            rows={4}
            required
          />

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-foreground">
              Imagen del anuncio{' '}
              <span className="text-xs text-muted-foreground font-normal">(opcional)</span>
            </label>
            <CreativeSelector
              images={data.productImages}
              onChange={(imgs) => update({ productImages: imgs })}
              userId={userId}
              productName={data.productName}
              productDescription={data.productDescription}
              objective={data.objective}
              maxImages={5}
            />
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="pt-2 flex items-center justify-between">
        <button
          type="button"
          onClick={back}
          className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted/50 transition-colors"
        >
          ← Anterior
        </button>
        <button
          type="button"
          onClick={handleNext}
          disabled={useExisting && !data.existingProductId}
          className="inline-flex items-center gap-2 rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-brand/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Siguiente paso →
        </button>
      </div>
    </div>
  )
}
