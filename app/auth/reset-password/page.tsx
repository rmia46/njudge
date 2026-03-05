'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { supabase } from '@/lib/supabase'
import { Loader2, KeyRound, CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match.' })
      return
    }

    setIsLoading(true)
    setMessage(null)

    try {
      const { error } = await supabase.auth.updateUser({ password })
      if (error) throw error
      
      setMessage({ type: 'success', text: 'Password successfully reset! Redirecting to login...' })
      setTimeout(() => router.push('/login'), 3000)
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="flex min-h-[calc(100vh-64px)] items-center justify-center p-4 bg-slate-50/30">
      <Card className="w-full max-w-md shadow-2xl border-t-4 border-t-primary overflow-hidden">
        <CardHeader className="text-center space-y-4 pb-6 bg-muted/20">
          <div className="mx-auto w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center rotate-3 shadow-inner">
            <KeyRound className="w-7 h-7 text-primary" />
          </div>
          <div className="space-y-1">
            <CardTitle className="text-2xl font-bold tracking-tight">Create New Password</CardTitle>
            <CardDescription className="text-balance text-sm font-medium">
              Choose a strong password to secure your nJudge account.
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-6 pt-6">
          {message && (
            <div className={`p-4 rounded-xl flex items-start gap-3 text-sm font-bold animate-in fade-in slide-in-from-top-2 ${
              message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-rose-50 text-rose-700 border border-rose-100'
            }`}>
              {message.type === 'success' ? <CheckCircle2 className="w-5 h-5 flex-shrink-0" /> : <AlertTriangle className="w-5 h-5 flex-shrink-0" />}
              {message.text}
            </div>
          )}

          <form onSubmit={handleReset} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="pass" className="text-xs font-bold uppercase tracking-wider opacity-60">New Password</Label>
              <Input 
                id="pass" 
                type="password" 
                placeholder="••••••••" 
                required 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-11 focus-visible:ring-primary/30"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="confirm" className="text-xs font-bold uppercase tracking-wider opacity-60">Confirm New Password</Label>
              <Input 
                id="confirm" 
                type="password" 
                placeholder="••••••••" 
                required 
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="h-11 focus-visible:ring-primary/30"
              />
            </div>

            <Button 
              type="submit" 
              className="w-full h-11 bg-primary hover:bg-primary/90 font-bold shadow-lg shadow-primary/20 transition-all active:scale-[0.98]"
              disabled={isLoading || (message?.type === 'success')}
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>Update Password <ArrowRight className="w-4 h-4 ml-2" /></>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  )
}
