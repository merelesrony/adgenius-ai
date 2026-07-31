'use client'

import * as React from 'react'
import { Menu, Moon, Sun, Bell } from 'lucide-react'
import { useTheme } from 'next-themes'
import { getInitials } from '@/lib/utils'
import type { Profile, Business } from '@/types'

interface NavbarProps {
  profile: Profile
  business?: Business | null
  onMenuClick: () => void
  title?: string
}

export function Navbar({ profile, business, onMenuClick, title }: NavbarProps) {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => setMounted(true), [])

  const displayName = business?.name ?? profile.id.slice(0, 8)
  const avatarText = getInitials(displayName)

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 lg:px-6">
      {/* Mobile menu button */}
      <button
        onClick={onMenuClick}
        className="p-2 -ml-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent lg:hidden transition-colors"
        aria-label="Abrir menú"
      >
        <Menu className="size-5" />
      </button>

      {/* Page title */}
      {title && (
        <h1 className="text-sm font-semibold text-foreground hidden sm:block">{title}</h1>
      )}

      {/* Spacer */}
      <div className="flex-1" />

      {/* Actions */}
      <div className="flex items-center gap-1">
        {/* Theme toggle */}
        {mounted && (
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            aria-label="Cambiar tema"
          >
            {theme === 'dark' ? <Sun className="size-4" /> : <Moon className="size-4" />}
          </button>
        )}

        {/* Notifications placeholder */}
        <button className="relative p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
          <Bell className="size-4" />
        </button>

        {/* Avatar */}
        <div
          className="flex items-center justify-center w-8 h-8 rounded-full bg-brand text-brand-foreground text-xs font-semibold ml-1 select-none"
          title={displayName}
        >
          {avatarText}
        </div>
      </div>
    </header>
  )
}
