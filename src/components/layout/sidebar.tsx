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
  Zap,
  PieChart,
  HelpCircle,
  Facebook,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Profile } from '@/types'
import { logoutAction } from '@/features/auth/actions'

interface SidebarProps {
  profile: Profile
  open?: boolean
  onClose?: () => void
}

const mainNav = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/campaigns', label: 'Campañas', icon: Megaphone },
  { href: '/products', label: 'Productos', icon: Box },
]

const toolsNav = [
  { href: '/ai', label: 'IA Generativa', icon: Zap },
  { href: '/facebook-ads', label: 'Facebook Ads', icon: Facebook },
  { href: '/analytics', label: 'Analíticas', icon: PieChart },
]

const adminNav = [
  { href: '/admin/users', label: 'Clientes', icon: Users },
  { href: '/admin/metrics', label: 'Métricas', icon: BarChart3 },
]

const bottomNav = [
  { href: '/subscription', label: 'Suscripción', icon: CreditCard },
  { href: '/profile', label: 'Perfil', icon: User },
  { href: '/settings', label: 'Configuración', icon: Settings },
  { href: '/help', label: 'Ayuda', icon: HelpCircle },
]

export function Sidebar({ profile, open, onClose }: SidebarProps) {
  const pathname = usePathname()
  const isAdmin = profile.role === 'admin'

  const isActive = (href: string) =>
    href === '/dashboard' ? pathname === href : pathname.startsWith(href)

  const roleLabel = profile.role === 'admin' ? 'Administrador' : 'Cliente'
  const avatarLetter = profile.role === 'admin' ? 'A' : 'C'

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar panel */}
      <aside
        className={cn(
          'fixed top-0 left-0 z-50 h-full w-64 flex flex-col bg-sidebar border-r border-sidebar-border',
          'transition-transform duration-300 ease-out',
          'lg:translate-x-0 lg:static lg:z-auto',
          open ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Logo */}
        <div className="flex items-center justify-between h-16 px-5 border-b border-sidebar-border flex-shrink-0">
          <Link
            href="/dashboard"
            onClick={onClose}
            className="flex items-center gap-3 group"
          >
            <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-gradient-to-br from-brand to-purple-600 shadow-sm group-hover:shadow-md transition-shadow">
              <Sparkles className="size-4 text-white" />
            </div>
            <div>
              <span className="text-sm font-bold text-sidebar-foreground tracking-tight">
                AdGenius AI
              </span>
              <div className="flex items-center gap-1 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-success inline-block" />
                <span className="text-[10px] text-muted-foreground leading-none">Online</span>
              </div>
            </div>
          </Link>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors lg:hidden"
              aria-label="Cerrar menú"
            >
              <X className="size-4" />
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-5 scrollbar-thin">
          {/* Principal */}
          <div>
            <p className="px-3 mb-1.5 text-[10px] font-semibold tracking-widest uppercase text-muted-foreground">
              Principal
            </p>
            <div className="space-y-0.5">
              {mainNav.map((item) => (
                <NavItem
                  key={item.href}
                  {...item}
                  active={isActive(item.href)}
                  onClick={onClose}
                />
              ))}
            </div>
          </div>

          {/* Herramientas */}
          <div>
            <p className="px-3 mb-1.5 text-[10px] font-semibold tracking-widest uppercase text-muted-foreground">
              Herramientas
            </p>
            <div className="space-y-0.5">
              {toolsNav.map((item) => (
                <NavItem
                  key={item.href}
                  {...item}
                  active={isActive(item.href)}
                  onClick={onClose}
                />
              ))}
            </div>
          </div>

          {/* Admin */}
          {isAdmin && (
            <div>
              <p className="px-3 mb-1.5 text-[10px] font-semibold tracking-widest uppercase text-muted-foreground flex items-center gap-1.5">
                <Shield className="size-3" />
                Admin
              </p>
              <div className="space-y-0.5">
                {adminNav.map((item) => (
                  <NavItem
                    key={item.href}
                    {...item}
                    active={isActive(item.href)}
                    onClick={onClose}
                  />
                ))}
              </div>
            </div>
          )}
        </nav>

        {/* Bottom section */}
        <div className="flex-shrink-0 border-t border-sidebar-border px-3 pt-3 pb-2 space-y-0.5">
          {bottomNav.map((item) => (
            <NavItem
              key={item.href}
              {...item}
              active={isActive(item.href)}
              onClick={onClose}
            />
          ))}
          <form action={logoutAction}>
            <button
              type="submit"
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
            >
              <LogOut className="size-4 flex-shrink-0" />
              <span>Cerrar sesión</span>
            </button>
          </form>
        </div>

        {/* Profile card */}
        <div className="flex-shrink-0 border-t border-sidebar-border p-3">
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-muted/60">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-brand to-purple-600 text-white text-xs font-bold flex-shrink-0 select-none">
              {avatarLetter}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-sidebar-foreground truncate">
                {profile.id.slice(0, 8)}…
              </p>
              <p className="text-[10px] text-muted-foreground">{roleLabel}</p>
            </div>
          </div>
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
        'flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-all duration-150',
        active
          ? 'bg-gradient-to-r from-brand to-purple-600 text-white shadow-sm'
          : 'text-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent/60'
      )}
    >
      <Icon
        className={cn(
          'size-4 flex-shrink-0',
          active ? 'text-white' : ''
        )}
      />
      <span className="flex-1 truncate">{label}</span>
      {badge !== undefined && (
        <span
          className={cn(
            'text-xs px-1.5 py-0.5 rounded-full font-semibold',
            active
              ? 'bg-white/20 text-white'
              : 'bg-brand/10 text-brand'
          )}
        >
          {badge}
        </span>
      )}
    </Link>
  )
}
