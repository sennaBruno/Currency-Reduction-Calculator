'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { AuthError } from '@supabase/supabase-js'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import * as z from 'zod'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

const TEST_EMAIL = process.env.NODE_ENV === 'development' ? "test.user@gmail.com" : ""
const TEST_PASSWORD = process.env.NODE_ENV === 'development' ? "test123456" : ""
const IS_DEV = process.env.NODE_ENV === 'development'

const loginSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
})

const registerSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  email: z.string().email({ message: "Invalid email address" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
})

type LoginFormValues = z.infer<typeof loginSchema>
type RegisterFormValues = z.infer<typeof registerSchema>

function useAuth() {
  const router = useRouter()
  const supabase = createClient()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleAuthError = (error: unknown) => {
    if (error instanceof AuthError) {
      return error.message
    } else if (error instanceof Error) {
      return error.message
    }
    return 'An unexpected error occurred'
  }

  const verifyUserAuthentication = async () => {
    const { data: userData, error: userError } = await supabase.auth.getUser()
    if (userError) throw userError
    if (!userData.user) throw new Error('Authentication failed')
    
    router.refresh()
    router.push('/')
  }

  const login = async (data: LoginFormValues) => {
    setIsLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      })

      if (error && 
          data.email === TEST_EMAIL && 
          (error.message.includes("not confirmed") || 
           error.message.includes("invalid"))) {
        
        await createTestAccount()
      } else if (error) {
        throw error
      }
      
      await verifyUserAuthentication()
    } catch (error) {
      setError(handleAuthError(error))
    } finally {
      setIsLoading(false)
    }
  }

  const register = async (data: RegisterFormValues) => {
    setIsLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            name: data.name,
          }
        }
      })
      
      if (error) throw error
      await verifyUserAuthentication()
    } catch (error) {
      setError(handleAuthError(error))
    } finally {
      setIsLoading(false)
    }
  }

  const createTestAccount = async () => {
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
      })

      if (!signInError) {
        await verifyUserAuthentication()
        return
      }

      const { error: signUpError } = await supabase.auth.signUp({
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
        options: {
          data: {
            name: "Test User",
          }
        }
      })
      
      if (signUpError) throw signUpError
      
      const { error: finalSignInError } = await supabase.auth.signInWithPassword({
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
      })
      
      if (finalSignInError) throw finalSignInError
      await verifyUserAuthentication()
    } catch (error) {
      throw error
    }
  }

  const testLogin = async () => {
    setIsLoading(true)
    setError(null)

    try {
      await createTestAccount()
    } catch (error) {
      setError(handleAuthError(error))
    } finally {
      setIsLoading(false)
    }
  }

  return {
    login,
    register,
    testLogin,
    isLoading,
    error,
    setError,
  }
}

export default function AuthForm() {
  const [activeTab, setActiveTab] = useState<string>("login")
  const { login, register, testLogin, isLoading, error, setError } = useAuth()
  
  const handleTabChange = (value: string) => {
    setError(null)
    setActiveTab(value)
  }

  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
    },
  })

  const handleLogin = async (data: LoginFormValues) => {
    await login(data)
  }

  const handleRegister = async (data: RegisterFormValues) => {
    await register(data)
  }

  const handleTestLogin = async () => {
    loginForm.setValue("email", TEST_EMAIL)
    loginForm.setValue("password", TEST_PASSWORD)
    await testLogin()
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Account Access</CardTitle>
        <CardDescription>Sign in to your account or create a new one.</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Login</TabsTrigger>
            <TabsTrigger value="register">Register</TabsTrigger>
          </TabsList>
          
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mt-4">
              {error}
            </div>
          )}

          <TabsContent value="login" className="mt-4 space-y-4">
            <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email" 
                  placeholder="name@example.com"
                  disabled={isLoading}
                  {...loginForm.register("email")}
                />
                {loginForm.formState.errors.email && (
                  <p className="text-sm text-red-500">{loginForm.formState.errors.email.message}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  disabled={isLoading}
                  {...loginForm.register("password")}
                />
                {loginForm.formState.errors.password && (
                  <p className="text-sm text-red-500">{loginForm.formState.errors.password.message}</p>
                )}
              </div>
              
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Please wait..." : "Sign In"}
              </Button>
            </form>
            
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Or continue with
                </span>
              </div>
            </div>
            
            {IS_DEV && (
              <Button 
                type="button" 
                variant="outline" 
                className="w-full" 
                onClick={handleTestLogin}
                disabled={isLoading}
              >
                Demo Login (test.user@gmail.com)
              </Button>
            )}
          </TabsContent>
          
          <TabsContent value="register" className="mt-4 space-y-4">
            <form onSubmit={registerForm.handleSubmit(handleRegister)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  placeholder="John Doe"
                  disabled={isLoading}
                  {...registerForm.register("name")}
                />
                {registerForm.formState.errors.name && (
                  <p className="text-sm text-red-500">{registerForm.formState.errors.name.message}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  disabled={isLoading}
                  {...registerForm.register("email")}
                />
                {registerForm.formState.errors.email && (
                  <p className="text-sm text-red-500">{registerForm.formState.errors.email.message}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  disabled={isLoading}
                  {...registerForm.register("password")}
                />
                {registerForm.formState.errors.password && (
                  <p className="text-sm text-red-500">{registerForm.formState.errors.password.message}</p>
                )}
              </div>
              
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Creating account..." : "Create Account"}
              </Button>
            </form>
            
            {IS_DEV && (
              <>
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">
                      Or create test account
                    </span>
                  </div>
                </div>
                
                <Button 
                  type="button" 
                  variant="outline" 
                  className="w-full" 
                  onClick={handleTestLogin}
                  disabled={isLoading}
                >
                  Create & Login as Test User
                </Button>
              </>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
} 