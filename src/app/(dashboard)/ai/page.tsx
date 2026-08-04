import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { Brain, Sparkles } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { AIStrategyModule } from '@/features/ai-strategy/ai-strategy-module'
import type { StrategyHistoryItem } from '@/features/ai-strategy/types'

export const metadata: Metadata = { title: 'IA Generativa — Estratega de Marketing' }

export default async function AIPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Load recent strategies — graceful fallback if table doesn't exist yet
  let initialHistory: StrategyHistoryItem[] = []
  try {
    const { data } = await supabase
      .from('marketing_strategies')
      .select('id, product_name, product_category, product_currency, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(8)
    if (data) initialHistory = data
  } catch {
    // Table doesn't exist yet — user must run migration 005
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Page header */}
      <header className="flex items-start gap-4">
        <div className="flex items-center justify-center w-11 h-11 rounded-2xl bg-gradient-to-br from-brand to-purple-600 shadow-md shrink-0">
          <Brain className="size-6 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-bold text-foreground tracking-tight">IA Generativa</h1>
            <span className="inline-flex items-center gap-1 rounded-full bg-brand/10 text-brand px-2.5 py-0.5 text-[11px] font-semibold">
              <Sparkles className="size-2.5" />
              Estratega de Marketing
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            Analiza tu producto y obtén una estrategia completa de Meta Ads en segundos.
          </p>
        </div>
      </header>

      {/* Main module */}
      <AIStrategyModule initialHistory={initialHistory} />
    </div>
  )
}
