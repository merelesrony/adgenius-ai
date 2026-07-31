'use client'

import * as React from 'react'
import Link from 'next/link'
import { Menu, Moon, Sun, Bell, Search, PlusCircle, ChevronDown } from 'lucide-react'
import { useTheme } from 'next-themes'
import { getInitials } from '@/lib/utils'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { Profile, Business } from '@/types'

interface NavbarProps {
  profile: Profile
  business?: Business | null
  onMenuClick: () => void
  title?: string
}

export function Navbar({ profile, business, onMenuClick }: NavbarProps) {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => setMounted(true), [])

  const displayName = business?.name ?? 'Mi negocio'
  const avatarText = getInitials(displayName)
  const roleLabel = profile.role === 'admin' ? 'Admin' : 'Cliente'

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 lg:px-6">
      {/* Mobile menu */}
      <button
        onClick={onMenuClick}
        className="p-2 -ml-1 rounded-xl text-muted-foreground hover:text-foreground hover:bg-accent transition-colors lg:hidden"
        aria-label="Abrir menú"
      >
        <Menu className="size-5" />
      </button>

      {/* Search bar */}
      <div className="hidden sm:flex flex-1 max-w-sm">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar... ⌘K"
            readOnly
            className="w-full h-9 pl-9 pr-4 text-sm bg-muted/60 border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none cursor-default"
          />
        </div>
      </div>

      <div className="flex-1" />

      {/* Actions */}
      <div className="flex items-center gap-1.5">
        {/* Create campaign */}
        <Link
          href="/campaigns/new"
          className={cn(
            buttonVariants({ size: 'sm' }),
            'hidden md:inline-flex gap-2 rounded-xl shadow-sm shadow-brand/20'
          )}
        >
          <PlusCircle className="size-3.5" />
          Nueva campaña
        </Link>

        {/* Theme toggle */}
        {mounted && (
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            aria-label="Cambiar tema"
          >
            {theme === 'dark' ? (
              <Sun className="size-4" />
            ) : (
              <Moon className="size-4" />
            )}
          </button>
        )}

        {/* Notifications */}
        <button className="relative p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
          <Bell className="size-4" />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-brand" />
        </button>

        {/* Divider */}
        <div className="w-px h-6 bg-border mx-1" />

        {/* User */}
        <div className="flex items-center gap-2.5 px-2 py-1.5 rounded-xl hover:bg-accent transition-colors cursor-default">
          <div className="flex items-center justify-center w-7 h-7 rounded-full bg-gradient-to-br from-brand to-purple-600 text-white text-xs font-bold select-none flex-shrink-0">
            {avatarText}
          </div>
          <div className="hidden lg:block">
            <p className="text-xs font-semibold text-foreground leading-tight">{displayName}</p>
            <p className="text-[10px] text-muted-foreground">{roleLabel}</p>
          </div>
          <ChevronDown className="size-3 text-muted-foreground hidden lg:block" />
        </div>
      </div>
    </header>
  )
}
