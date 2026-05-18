'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Database } from '@/types/database'

type StaffProfile = Database['public']['Tables']['staff_profiles']['Row']

let cachedProfile: StaffProfile | null = null
let isFetching = false
let hasFetched = false
const listeners: Array<(profile: StaffProfile | null) => void> = []

function notify(profile: StaffProfile | null) {
  cachedProfile = profile
  hasFetched = true
  listeners.forEach(fn => fn(profile))
}

export function useStaffProfile() {
  const [profile, setProfile] = useState<StaffProfile | null>(cachedProfile)
  const [loading, setLoading] = useState(!hasFetched)
  const supabase = createClient()

  useEffect(() => {
    const handleUpdate = (p: StaffProfile | null) => {
      setProfile(p)
      setLoading(false)
    }
    
    listeners.push(handleUpdate)
    
    if (hasFetched) {
      setLoading(false)
    }

    if (!hasFetched && !isFetching) {
      isFetching = true
      supabase.auth.getUser().then(({ data: { user } }) => {
        if (!user) { 
          isFetching = false
          notify(null)
          return 
        }
        supabase
          .from('staff_profiles')
          .select('*')
          .eq('id', user.id)
          .single()
          .then(({ data, error }) => {
            isFetching = false
            if (error) {
              console.error('Error fetching profile:', error)
              notify(null)
            } else {
              notify(data)
            }
          })
      })
    }

    return () => {
      const i = listeners.indexOf(handleUpdate)
      if (i > -1) listeners.splice(i, 1)
    }
  }, [supabase])

  const clearProfile = () => {
    hasFetched = false
    cachedProfile = null
    notify(null)
  }

  return { profile, loading, clearProfile }
}
