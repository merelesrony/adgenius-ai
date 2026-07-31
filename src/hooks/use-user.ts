'use client'

import * as React from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Profile, Business, Subscription, Plan } from '@/types'
import type { User } from '@supabase/supabase-js'

interface UserData {
  user: User | null
  profile: Profile | null
  business: Business | null
  subscription: (Subscription & { plan: Plan }) | null
  isLoading: boolean
}

export function useUser(): UserData {
  const [data, setData] = React.useState<UserData>({
    user: null,
    profile: null,
    business: null,
    subscription: null,
    isLoading: true,
  })

  React.useEffect(() => {
    const supabase = createClient()

    async function loadUser() {
      try {
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
          setData({ user: null, profile: null, business: null, subscription: null, isLoading: false })
          return
        }

        const [profileResult, businessResult, subscriptionResult] = await Promise.all([
          supabase.from('profiles').select('*').eq('id', user.id).single(),
          supabase.from('businesses').select('*').eq('user_id', user.id).maybeSingle(),
          supabase
            .from('subscriptions')
            .select('*, plan:plans(*)')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle(),
        ])

        setData({
          user,
          profile: profileResult.data,
          business: businessResult.data,
          subscription: subscriptionResult.data as (Subscription & { plan: Plan }) | null,
          isLoading: false,
        })
      } catch {
        setData({ user: null, profile: null, business: null, subscription: null, isLoading: false })
      }
    }

    loadUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        setData({ user: null, profile: null, business: null, subscription: null, isLoading: false })
      } else if (event === 'SIGNED_IN') {
        loadUser()
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  return data
}
