'use client'

import * as React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Megaphone,
  Box,
  CreditCard,
  Settings,
  User,
  LogOut,
  X,
  Sparkles,
  Users,
  BarChart3,
  Shield,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Profile } from '@/types'
import { logoutAction } from '@/features/auth/actions'

interface SidebarProps {
  profile: Profile
  open?: boolean
  onClose?: () => void
}

const clientNav = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/campaigns', label: 'Campañas', icon: Megaphone },
  { href: '/products', label: 'Productos', icon: Box },
  { href: '/subscription', label: 'Suscripción', icon: CreditCard },
]

const adminNav = [
  { href: '/admin/users', label: 'Clientes', icon: Users },
  { href: '/admin/metrics', label: 'Métricas', icon: BarChart3 },
]

const bottomNav = [
  { href: '/profile', label: 'Perfil', icon: User },
  { href: '/settings', label: 'Configuración', icon: Settings },
]

export function Sidebar({ profile, open, onClose }: SidebarProps) {
  const pathname = usePathname()
  const isAdmin = profile.role === 'admin'

  const isActive = (href: string) =>
    href === '/dashboard' ? pathname === href : pathname.startsWith(href)

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar panel */}
      <aside
        className={cn(
          'fixed top-0 left-0 z-50 h-full w-64 flex flex-col bg-sidebar border-r border-sidebar-border transition-transform duration-200 ease-out',
          'lg:translate-x-0 lg:static lg:z-auto',
          open ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Logo */}
        <div className="flex items-center justify-between h-14 px-4 border-b border-sidebar-border flex-shrink-0">
          <Link href="/dashboard" className="flex items-center gap-2.5 group">
            <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-brand">
              <Sparkles className="size-4 text-white" />
            </div>
            <span className="text-sm font-semibold text-sidebar-foreground">AdGenius AI</span>
          </Link>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent lg:hidden"
              aria-label="Cerrar menú"
            >
              <X className="size-4" />
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 scrollbar-thin">
          {/* Admin section */}
          {isAdmin && (
            <div className="mb-4">
              <div className="flex items-center gap-1.5 px-2 mb-1">
                <Shield className="size-3 text-muted-foreground" />
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Admin
                </span>
              </div>
              {adminNav.map((item) => (
                <NavItem key={item.href} {...item} active={isActive(item.href)} onClick={onClose} />
              ))}
              <div className="my-3 border-t border-sidebar-border" />
            </div>
          )}

          {/* Main nav */}
          <div className="space-y-0.5">
            {clientNav.map((item) => (
              <NavItem key={item.href} {...item} active={isActive(item.href)} onClick={onClose} />
            ))}
          </div>
        </nav>

        {/* Bottom nav */}
        <div className="border-t border-sidebar-border p-3 space-y-0.5">
          {bottomNav.map((item) => (
            <NavItem key={item.href} {...item} active={isActive(item.href)} onClick={onClose} />
          ))}
          <form action={logoutAction}>
            <button
              type="submit"
              className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
            >
              <LogOut className="size-4 flex-shrink-0" />
              Cerrar sesión
            </button>
          </form>
        </div>
      </aside>
    </>
  )
}

interface NavItemProps {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  active?: boolean
  badge?: string | number
  onClick?: () => void
}

function NavItem({ href, label, icon: Icon, active, badge, onClick }: NavItemProps) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
        active
          ? 'bg-sidebar-accent text-sidebar-accent-foreground'
          : 'text-muted-foreground hover:text-sidebar-foreground hover:bg-accent'
      )}
    >
      <Icon className="size-4 flex-shrink-0" />
      <span className="flex-1 truncate">{label}</span>
      {badge !== undefined && (
        <span className="ml-auto text-xs bg-brand/10 text-brand px-1.5 py-0.5 rounded-full font-semibold">
          {badge}
        </span>
      )}
    </Link>
  )
}
