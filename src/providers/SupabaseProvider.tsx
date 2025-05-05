'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { Session, User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

type SupabaseContextType = {
  user: User | null
  session: Session | null
  isLoading: boolean
  signOut: () => Promise<void>
}

const SupabaseContext = createContext<SupabaseContextType>({
  user: null,
  session: null,
  isLoading: true,
  signOut: async () => {},
})

export const useSupabase = () => useContext(SupabaseContext)

export default function SupabaseProvider({ 
  children,
  initialSession,
}: { 
  children: React.ReactNode
  initialSession: Session | null
}) {
  const supabaseClient = createClient()
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(initialSession)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const verifyInitialUser = async () => {
      const { data, error } = await supabaseClient.auth.getUser()
      if (!error && data) {
        setUser(data.user)
      }
      setIsLoading(false)
    }
    
    verifyInitialUser()
  }, [initialSession, supabaseClient.auth])

  useEffect(() => {
    const { data: { subscription } } = supabaseClient.auth.onAuthStateChange(async (_event: string, session: Session | null) => {
      const { data: userData, error } = await supabaseClient.auth.getUser()
      if (!error && userData) {
        setUser(userData.user)
        setSession(session)
      } else {
        setUser(null)
        setSession(null)
      }
      
      router.refresh()
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [supabaseClient.auth, router])

  const signOut = async () => {
    setIsLoading(true)
    try {
      await supabaseClient.auth.signOut()
      router.push('/')
    } finally {
      setIsLoading(false)
    }
  }

  const value = {
    user,
    session,
    isLoading,
    signOut,
  }

  return (
    <SupabaseContext.Provider value={value}>
      {children}
    </SupabaseContext.Provider>
  )
} 