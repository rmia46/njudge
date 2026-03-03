'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { supabase } from '@/lib/supabase'
import { User } from '@supabase/supabase-js'
import { Loader2, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react'

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null)
  const [cfHandle, setCfHandle] = useState('')
  const [acHandle, setAcHandle] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadProfile() {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()
        
        if (profile) {
          setCfHandle(profile.cf_handle || '')
          setAcHandle(profile.ac_handle || '')
        }
      }
      setIsLoading(false)
    }
    loadProfile()
  }, [])

  const handleSave = async () => {
    if (!user) return
    setIsSaving(true)
    
    const { error } = await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        cf_handle: cfHandle,
        ac_handle: acHandle,
        updated_at: new Date().toISOString()
      })

    if (error) alert(error.message)
    setIsSaving(false)
  }

  if (isLoading) return <div className="flex justify-center p-24"><Loader2 className="animate-spin" /></div>
  if (!user) return <div className="text-center p-24">Please login to view your profile.</div>

  return (
    <main className="container max-w-2xl py-12 space-y-6">
      <h1 className="text-3xl font-bold">Account Settings</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>User Profile</CardTitle>
          <CardDescription>Manage your competitive programming handles.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label>Email Address</Label>
            <Input value={user.email} disabled className="bg-slate-50" />
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" /> Verified via {user.app_metadata.provider || 'email'}
            </p>
          </div>

          <div className="space-y-4 pt-4 border-t">
            <div className="space-y-2">
              <Label htmlFor="cf-handle">Codeforces Handle</Label>
              <div className="flex gap-2">
                <Input 
                  id="cf-handle" 
                  value={cfHandle} 
                  onChange={(e) => setCfHandle(e.target.value)} 
                  placeholder="e.g. tourist"
                />
                <Button variant="outline" size="sm" onClick={() => window.open(`https://codeforces.com/profile/${cfHandle}`, '_blank')}>
                  Check
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="ac-handle">AtCoder Handle</Label>
              <div className="flex gap-2">
                <Input 
                  id="ac-handle" 
                  value={acHandle} 
                  onChange={(e) => setAcHandle(e.target.value)} 
                  placeholder="e.g. rng_58"
                />
                <Button variant="outline" size="sm" onClick={() => window.open(`https://atcoder.jp/users/${acHandle}`, '_blank')}>
                  Check
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <Button 
            className="w-full bg-emerald-600 hover:bg-emerald-700" 
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : 'Save Changes'}
          </Button>
          
          <div className="bg-amber-50 border border-amber-100 p-4 rounded-lg flex gap-3 text-sm text-amber-800">
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            <p>
              Ensure your handles are correct. nJudge uses these to track your submissions 
              and calculate your rank in contests.
            </p>
          </div>
        </CardFooter>
      </Card>
    </main>
  )
}
