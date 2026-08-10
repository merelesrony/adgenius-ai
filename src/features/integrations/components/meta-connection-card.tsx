'use client'

import { useState } from 'react'
import {
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  XCircle,
  Loader2,
  Link2Off,
  ExternalLink,
  ChevronDown,
  RefreshCw,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { getMetaTokenStatus } from '@/lib/meta/meta-publisher-utils'
import { updateMetaSelectionAction } from '../actions'
import type { MetaConnectionRow } from '../types'
import type { MetaAdAccount, MetaPage, MetaInstagramAccount } from '@/lib/meta/meta-types'

interface MetaConnectionCardProps {
  connection: MetaConnectionRow | null
  userCurrency?: string
}

export function MetaConnectionCard({ connection, userCurrency }: MetaConnectionCardProps) {
  const isConnected = !!connection

  const [isDisconnecting, setIsDisconnecting] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [isSavingSelection, setIsSavingSelection] = useState(false)

  const [selectedAdAccountId, setSelectedAdAccountId] = useState(
    connection?.selected_ad_account_id ?? '',
  )
  const [selectedPageId, setSelectedPageId] = useState(
    connection?.selected_page_id ?? '',
  )
  const [selectedInstagramId, setSelectedInstagramId] = useState(
    connection?.selected_instagram_id ?? '',
  )

  const adAccounts: MetaAdAccount[] = connection?.ad_accounts ?? []
  const pages: MetaPage[] = connection?.pages ?? []
  const instagramAccounts: MetaInstagramAccount[] = connection?.instagram_accounts ?? []

  const selectedAdAccount = adAccounts.find(a => a.id === selectedAdAccountId)
  const currencyMismatch =
    userCurrency &&
    selectedAdAccount?.currency &&
    selectedAdAccount.currency !== userCurrency

  const tokenStatus = isConnected ? getMetaTokenStatus(connection.expires_at) : null

  // Days remaining until expiry (only meaningful when expiring_soon)
  const daysUntilExpiry = isConnected && connection.expires_at
    ? Math.ceil((new Date(connection.expires_at).getTime() - Date.now()) / 86_400_000)
    : null

  async function handleDisconnect() {
    setIsDisconnecting(true)
    try {
      const res = await fetch('/api/meta/disconnect', { method: 'POST' })
      if (!res.ok) throw new Error('Error desconectando')
      toast.success('Cuenta de Meta desconectada')
      window.location.reload()
    } catch {
      toast.error('No se pudo desconectar la cuenta')
      setIsDisconnecting(false)
    }
    setShowConfirm(false)
  }

  async function handleSaveSelection() {
    if (!selectedAdAccountId) {
      toast.error('Selecciona una cuenta publicitaria')
      return
    }
    const adAccount = adAccounts.find(a => a.id === selectedAdAccountId)
    if (!adAccount) return

    const page = pages.find(p => p.id === selectedPageId)

    setIsSavingSelection(true)
    const result = await updateMetaSelectionAction({
      adAccountId: adAccount.id,
      adAccountName: adAccount.name,
      pageId: selectedPageId || null,
      pageName: page?.name ?? null,
      instagramId: selectedInstagramId || null,
    })
    setIsSavingSelection(false)

    if (result.success) {
      toast.success('Selección guardada')
    } else {
      toast.error(result.error ?? 'Error guardando selección')
    }
  }

  if (!isConnected) {
    return (
      <div className="flex items-center justify-between py-3">
        <div className="flex items-center gap-3">
          <MetaIcon />
          <div>
            <p className="text-sm font-medium text-foreground">Meta Ads</p>
            <p className="text-xs text-muted-foreground">Facebook & Instagram Ads</p>
          </div>
        </div>
        <a href="/api/meta/connect">
          <Button variant="outline" size="sm">
            Conectar
          </Button>
        </a>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Connected header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <MetaIcon />
          <div>
            <div className="flex items-center gap-1.5">
              <p className="text-sm font-medium text-foreground">Meta Ads</p>
              <TokenStatusIcon status={tokenStatus} />
            </div>
            <p className="text-xs text-muted-foreground">
              Conectado como <span className="font-medium text-foreground">{connection.meta_user_name}</span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <a
            href="https://www.facebook.com/adsmanager"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
          >
            Ads Manager <ExternalLink className="size-3" />
          </a>
          {!showConfirm ? (
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-destructive gap-1.5"
              onClick={() => setShowConfirm(true)}
            >
              <Link2Off className="size-3.5" />
              Desconectar
            </Button>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">¿Confirmar?</span>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDisconnect}
                disabled={isDisconnecting}
              >
                {isDisconnecting ? <Loader2 className="size-3.5 animate-spin" /> : 'Sí, desconectar'}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setShowConfirm(false)}>
                Cancelar
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Token status banners */}
      {tokenStatus === 'expired' && (
        <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-3 flex items-start justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <XCircle className="size-4 text-destructive shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-destructive">Token expirado</p>
              <p className="text-xs text-destructive/80 mt-0.5">
                Tu conexión con Meta expiró. Reconecta tu cuenta para continuar publicando.
              </p>
            </div>
          </div>
          <a href="/api/meta/connect">
            <Button variant="destructive" size="sm" className="gap-1.5 shrink-0">
              <RefreshCw className="size-3.5" />
              Reconectar Meta
            </Button>
          </a>
        </div>
      )}

      {tokenStatus === 'expiring_soon' && daysUntilExpiry !== null && daysUntilExpiry > 0 && (
        <div className="rounded-lg border border-amber-300/50 bg-amber-50/60 dark:bg-amber-900/10 p-3 flex items-start justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="size-4 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-700 dark:text-amber-400">
                Conexión próxima a expirar
              </p>
              <p className="text-xs text-amber-600 dark:text-amber-500 mt-0.5">
                Tu token expira en {daysUntilExpiry} día{daysUntilExpiry !== 1 ? 's' : ''}.
                Renueva antes de que expire para no interrumpir la publicación.
                Los tokens de Meta duran aproximadamente 60 días.
              </p>
            </div>
          </div>
          <a href="/api/meta/connect">
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 shrink-0 border-amber-300 text-amber-700 hover:bg-amber-50 dark:border-amber-600 dark:text-amber-400"
            >
              <RefreshCw className="size-3.5" />
              Renovar conexión
            </Button>
          </a>
        </div>
      )}

      {/* Account selection */}
      {adAccounts.length > 0 && (
        <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Configuración de cuenta
          </p>

          {/* Ad Account */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">Cuenta publicitaria *</label>
            <div className="relative">
              <select
                value={selectedAdAccountId}
                onChange={e => setSelectedAdAccountId(e.target.value)}
                className={cn(
                  'w-full rounded-lg border border-border bg-background px-3 py-2 text-sm appearance-none pr-8',
                  'focus:outline-none focus:ring-2 focus:ring-brand/30',
                )}
              >
                <option value="">Seleccionar cuenta...</option>
                {adAccounts.map(a => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({a.currency})
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
            </div>
            {currencyMismatch && (
              <div className="flex items-start gap-1.5 text-xs text-amber-600 dark:text-amber-400">
                <AlertCircle className="size-3.5 shrink-0 mt-0.5" />
                <span>
                  La moneda de esta cuenta ({selectedAdAccount?.currency}) difiere de tu moneda
                  preferida ({userCurrency}). Los presupuestos se mostrarán en {selectedAdAccount?.currency}.
                </span>
              </div>
            )}
          </div>

          {/* Page */}
          {pages.length > 0 && (
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">Página de Facebook</label>
              <div className="relative">
                <select
                  value={selectedPageId}
                  onChange={e => {
                    setSelectedPageId(e.target.value)
                    setSelectedInstagramId('')
                  }}
                  className={cn(
                    'w-full rounded-lg border border-border bg-background px-3 py-2 text-sm appearance-none pr-8',
                    'focus:outline-none focus:ring-2 focus:ring-brand/30',
                  )}
                >
                  <option value="">Ninguna</option>
                  {pages.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
              </div>
            </div>
          )}

          {/* Instagram */}
          {instagramAccounts.length > 0 && (
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">Cuenta de Instagram</label>
              <div className="relative">
                <select
                  value={selectedInstagramId}
                  onChange={e => setSelectedInstagramId(e.target.value)}
                  className={cn(
                    'w-full rounded-lg border border-border bg-background px-3 py-2 text-sm appearance-none pr-8',
                    'focus:outline-none focus:ring-2 focus:ring-brand/30',
                  )}
                >
                  <option value="">Ninguna</option>
                  {instagramAccounts.map(ig => (
                    <option key={ig.id} value={ig.id}>@{ig.username}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
              </div>
            </div>
          )}

          <Button
            size="sm"
            onClick={handleSaveSelection}
            disabled={isSavingSelection || !selectedAdAccountId}
            className="gap-1.5"
          >
            {isSavingSelection ? (
              <><Loader2 className="size-3.5 animate-spin" /> Guardando...</>
            ) : (
              'Guardar selección'
            )}
          </Button>
        </div>
      )}

      {adAccounts.length === 0 && (
        <div className="rounded-xl border border-amber-300/40 bg-amber-50/50 dark:bg-amber-900/10 p-3 flex items-start gap-2.5">
          <AlertCircle className="size-4 text-amber-500 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-700 dark:text-amber-400">
            No se encontraron cuentas publicitarias en tu cuenta de Meta.
            Asegúrate de tener acceso a al menos una cuenta en Meta Business.
          </p>
        </div>
      )}
    </div>
  )
}

function TokenStatusIcon({ status }: { status: ReturnType<typeof getMetaTokenStatus> | null }) {
  if (!status || status === 'valid' || status === 'unknown') {
    return <CheckCircle className="size-3.5 text-green-500" />
  }
  if (status === 'expiring_soon') {
    return <AlertTriangle className="size-3.5 text-amber-500" />
  }
  return <XCircle className="size-3.5 text-destructive" />
}

function MetaIcon() {
  return (
    <div className="size-8 rounded bg-[#1877F2] flex items-center justify-center shrink-0">
      <span className="text-white text-sm font-bold leading-none">f</span>
    </div>
  )
}
