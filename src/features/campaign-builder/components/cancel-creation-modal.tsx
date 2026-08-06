'use client'

import { LogOut, RotateCcw, Trash2, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'

interface OptionCardProps {
  iconBg: string
  icon: React.ReactNode
  title: string
  description: string
  buttonLabel: string
  buttonClass?: string
  onClick: () => void
  disabled?: boolean
  loading?: boolean
}

function OptionCard({ iconBg, icon, title, description, buttonLabel, buttonClass, onClick, disabled, loading }: OptionCardProps) {
  return (
    <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-3">
      <div className="flex items-start gap-3">
        <div className={cn('size-9 rounded-lg flex items-center justify-center shrink-0', iconBg)}>
          {icon}
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground leading-tight">{title}</p>
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{description}</p>
        </div>
      </div>
      <Button
        size="sm"
        variant="outline"
        className={cn('w-full h-8 text-xs', buttonClass)}
        onClick={onClick}
        disabled={disabled}
      >
        {loading && <Loader2 className="size-3 animate-spin mr-1.5" />}
        {buttonLabel}
      </Button>
    </div>
  )
}

interface CancelCreationModalProps {
  open: boolean
  onClose: () => void
  onSaveAndExit: () => void
  onReset: () => void
  onDelete: () => Promise<void>
  isLoading?: boolean
}

export function CancelCreationModal({
  open, onClose, onSaveAndExit, onReset, onDelete, isLoading,
}: CancelCreationModalProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="¿Qué deseas hacer?"
      description="Tu progreso se guarda automáticamente. Elige cómo quieres continuar."
      size="md"
    >
      <div className="space-y-2.5">
        <OptionCard
          iconBg="bg-green-500/10"
          icon={<LogOut className="size-4 text-green-600 dark:text-green-400" />}
          title="Guardar y continuar después"
          description="Tu sesión ya está guardada. Puedes volver cuando quieras y retomar exactamente donde lo dejaste."
          buttonLabel="Salir y guardar"
          buttonClass="border-green-500/30 text-green-700 dark:text-green-400 hover:bg-green-500/10"
          onClick={onSaveAndExit}
          disabled={isLoading}
        />

        <OptionCard
          iconBg="bg-amber-500/10"
          icon={<RotateCcw className="size-4 text-amber-600 dark:text-amber-400" />}
          title="Reiniciar campaña"
          description="Empieza una nueva campaña desde el paso 1. Tus productos existentes se conservan."
          buttonLabel="Reiniciar desde cero"
          buttonClass="border-amber-500/30 text-amber-700 dark:text-amber-400 hover:bg-amber-500/10"
          onClick={onReset}
          disabled={isLoading}
        />

        <OptionCard
          iconBg="bg-red-500/10"
          icon={<Trash2 className="size-4 text-red-600 dark:text-red-400" />}
          title="Eliminar borrador"
          description="Elimina esta sesión de campaña. Esta acción no se puede deshacer."
          buttonLabel="Eliminar borrador"
          buttonClass="border-red-500/30 text-red-600 dark:text-red-400 hover:bg-red-500/10"
          onClick={() => { void onDelete() }}
          disabled={isLoading}
          loading={isLoading}
        />
      </div>

      <button
        type="button"
        onClick={onClose}
        className="mt-5 w-full text-xs text-muted-foreground hover:text-foreground transition-colors py-1 text-center"
      >
        Continuar creando campaña
      </button>
    </Modal>
  )
}
