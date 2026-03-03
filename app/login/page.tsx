'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { supabase } from '@/lib/supabase'
import { Github, Mail, Loader2, Trophy } from 'lucide-react'

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState<string | null>(null)

  const handleOAuthLogin = async (provider: 'github' | 'google') => {
    setIsLoading(provider)
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    
    if (error) {
      alert(error.message)
      setIsLoading(null)
    }
  }

  return (
    <main className="flex min-h-[calc(100vh-64px)] items-center justify-center p-4 bg-slate-50/30">
      <Card className="w-full max-w-md shadow-xl border-t-4 border-t-emerald-600">
        <CardHeader className="text-center space-y-4 pb-8">
          <div className="mx-auto w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
            <Trophy className="w-6 h-6 text-emerald-600" />
          </div>
          <div className="space-y-1">
            <CardTitle className="text-2xl font-bold tracking-tight">Welcome to nJudge</CardTitle>
            <CardDescription className="text-balance">
              Sign in with your social account to join contests and start practicing.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            variant="outline" 
            className="w-full h-12 text-base font-medium transition-all hover:bg-slate-50 hover:border-slate-300"
            onClick={() => handleOAuthLogin('github')}
            disabled={!!isLoading}
          >
            {isLoading === 'github' ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Github className="w-5 h-5 mr-3" />
            )}
            Continue with GitHub
          </Button>
          
          <Button 
            variant="outline" 
            className="w-full h-12 text-base font-medium transition-all hover:bg-slate-50 hover:border-slate-300"
            onClick={() => handleOAuthLogin('google')}
            disabled={!!isLoading}
          >
            {isLoading === 'google' ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Mail className="w-5 h-5 mr-3 text-red-500" />
            )}
            Continue with Google
          </Button>
        </CardContent>
        <CardFooter className="flex flex-col gap-4 text-center pb-8 pt-4">
          <p className="text-xs text-muted-foreground px-6">
            By signing in, you agree to our Terms of Service and Privacy Policy.
          </p>
        </CardFooter>
      </Card>
    </main>
  )
}
