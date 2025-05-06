import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import AuthForm from '@/components/auth/AuthForm'

export default async function AuthPage() {
  const supabase = await createClient()
  
  const { data: userData, error: userError } = await supabase.auth.getUser()
  const isAuthenticated = !userError && userData?.user !== null
  
  if (isAuthenticated) {
    redirect('/')
  }
  
  return (
    <div className="flex min-h-screen flex-col items-center justify-center py-2">
      <main className="flex w-full flex-1 flex-col items-center justify-center px-4 sm:px-20">
        <h1 className="text-3xl font-bold mb-8">Calculator App</h1>
        <div className="w-full max-w-md">
          <AuthForm />
        </div>
      </main>
    </div>
  )
} 