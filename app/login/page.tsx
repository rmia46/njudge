'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { supabase } from '@/lib/supabase'
import { Github, Mail, Loader2, Trophy, ArrowRight, KeyRound } from 'lucide-react'
import Link from 'next/link'

type AuthMode = 'login' | 'signup' | 'forgot-password'

export default function LoginPage() {
  const router = useRouter()
  const [mode, setMode] = useState<AuthMode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState<string | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  const handleOAuthLogin = async (provider: 'github' | 'google') => {
    setIsLoading(provider)
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    
    if (error) {
      setMessage({ type: 'error', text: error.message })
      setIsLoading(null)
    }
  }

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading('email')
    setMessage(null)

    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        router.push('/')
        router.refresh()
      } else if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({ 
          email, 
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          }
        })
        if (error) throw error
        setMessage({ type: 'success', text: 'Check your email for the confirmation link!' })
      } else if (mode === 'forgot-password') {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth/reset-password`,
        })
        if (error) throw error
        setMessage({ type: 'success', text: 'Password reset link sent to your email!' })
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message })
    } finally {
      setIsLoading(null)
    }
  }

  return (
    <main className="flex min-h-[calc(100vh-64px)] items-center justify-center p-4 bg-slate-50/30">
      <Card className="w-full max-w-md shadow-2xl border-t-4 border-t-primary overflow-hidden">
        <CardHeader className="text-center space-y-4 pb-6 bg-muted/20">
          <div className="mx-auto w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center rotate-3 hover:rotate-0 transition-transform duration-300 shadow-inner">
            <Trophy className="w-7 h-7 text-primary" />
          </div>
          <div className="space-y-1">
            <CardTitle className="text-2xl font-bold tracking-tight">
              {mode === 'login' ? 'Welcome Back' : mode === 'signup' ? 'Create Account' : 'Reset Password'}
            </CardTitle>
            <CardDescription className="text-balance text-sm font-medium">
              {mode === 'login' ? 'Sign in to nJudge to continue your journey.' : 
               mode === 'signup' ? 'Join the nJudge community and start competing.' : 
               'Enter your email to receive a reset link.'}
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-6 pt-6">
          {message && (
            <div className={`p-3 rounded-lg text-xs font-bold animate-in fade-in slide-in-from-top-2 ${
              message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-rose-50 text-rose-700 border border-rose-100'
            }`}>
              {message.text}
            </div>
          )}

          <form onSubmit={handleEmailAuth} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-xs font-bold uppercase tracking-wider opacity-60">Email Address</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="name@example.com" 
                required 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-11 focus-visible:ring-primary/30"
              />
            </div>

            {mode !== 'forgot-password' && (
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="password" className="text-xs font-bold uppercase tracking-wider opacity-60">Password</Label>
                  {mode === 'login' && (
                    <button 
                      type="button" 
                      onClick={() => setMode('forgot-password')}
                      className="text-[10px] font-bold text-primary hover:underline uppercase tracking-tighter"
                    >
                      Forgot?
                    </button>
                  )}
                </div>
                <Input 
                  id="password" 
                  type="password" 
                  placeholder="••••••••" 
                  required 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-11 focus-visible:ring-primary/30"
                />
              </div>
            )}

            <Button 
              type="submit" 
              className="w-full h-11 bg-primary hover:bg-primary/90 font-bold shadow-lg shadow-primary/20 transition-all active:scale-[0.98]"
              disabled={!!isLoading}
            >
              {isLoading === 'email' ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>{mode === 'login' ? 'Sign In' : mode === 'signup' ? 'Sign Up' : 'Send Reset Link'} <ArrowRight className="w-4 h-4 ml-2" /></>
              )}
            </Button>
          </form>

          {mode !== 'forgot-password' && (
            <>
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-muted-foreground/20" />
                </div>
                <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-widest">
                  <span className="bg-card px-3 text-muted-foreground/50">Or continue with</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Button 
                  variant="outline" 
                  className="h-11 font-bold border-2 hover:bg-slate-50 transition-colors"
                  onClick={() => handleOAuthLogin('github')}
                  disabled={!!isLoading}
                >
                  {isLoading === 'github' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Github className="w-4 h-4 mr-2" />}
                  GitHub
                </Button>
                <Button 
                  variant="outline" 
                  className="h-11 font-bold border-2 hover:bg-slate-50 transition-colors"
                  onClick={() => handleOAuthLogin('google')}
                  disabled={!!isLoading}
                >
                  {isLoading === 'google' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4 mr-2 text-rose-500" />}
                  Google
                </Button>
              </div>
            </>
          )}
        </CardContent>

        <CardFooter className="flex flex-col gap-4 text-center pb-8 pt-2 bg-muted/10 border-t">
          <p className="text-xs font-medium text-muted-foreground">
            {mode === 'login' ? "Don't have an account?" : mode === 'signup' ? "Already have an account?" : "Remembered your password?"}
            <button 
              onClick={() => {
                setMode(mode === 'signup' ? 'login' : mode === 'forgot-password' ? 'login' : 'signup')
                setMessage(null)
              }}
              className="ml-1.5 text-primary font-bold hover:underline"
            >
              {mode === 'signup' ? 'Sign In' : mode === 'forgot-password' ? 'Back to Login' : 'Sign Up Free'}
            </button>
          </p>
        </CardFooter>
      </Card>
    </main>
  )
}
