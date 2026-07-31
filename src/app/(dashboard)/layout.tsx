'use client'

import * as React from 'react'
import { redirect } from 'next/navigation'
import { Sidebar } from '@/components/layout/sidebar'
import { Navbar } from '@/components/layout/navbar'
import { useUser } from '@/hooks/use-user'
import { Loading } from '@/components/ui/loading'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = React.useState(false)
  const { user, profile, business, isLoading } = useUser()

  if (isLoading) return <Loading fullPage />
  if (!user || !profile) {
    redirect('/login')
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar
        profile={profile}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main content */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden lg:pl-64">
        <Navbar
          profile={profile}
          business={business}
          onMenuClick={() => setSidebarOpen(true)}
        />
        <main className="flex-1 overflow-y-auto scrollbar-thin">
          <div className="p-4 sm:p-6 animate-fade-in">{children}</div>
        </main>
      </div>
    </div>
  )
}
