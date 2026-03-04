'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { supabase } from '@/lib/supabase'
import { User } from '@supabase/supabase-js'
import { Loader2, CheckCircle2, AlertTriangle, ShieldCheck, User as UserIcon, History, BarChart3, Settings, Trophy, Code } from 'lucide-react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<any>(null)
  const [cfHandle, setCfHandle] = useState('')
  const [acHandle, setAcHandle] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [stats, setStats] = useState({ totalSubmissions: 0, acceptedCount: 0, contestsJoined: 0 })
  const [recentContests, setRecentContests] = useState<any[]>([])

  useEffect(() => {
    async function loadData() {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      
      if (user) {
        // Load Profile
        const { data: prof } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()
        
        if (prof) {
          setProfile(prof)
          setCfHandle(prof.cf_handle || '')
          setAcHandle(prof.ac_handle || '')
        }

        // Load Stats
        const { count: totalSubs } = await supabase
          .from('submissions')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)

        const { count: acSubs } = await supabase
          .from('submissions')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .in('verdict', ['OK', 'Accepted'])

        const { count: contestsJoined } = await supabase
          .from('participants')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)

        setStats({ 
          totalSubmissions: totalSubs || 0, 
          acceptedCount: acSubs || 0, 
          contestsJoined: contestsJoined || 0 
        })

        // Load Recent Contests
        const { data: participations } = await supabase
          .from('participants')
          .select('*, contests(*)')
          .eq('user_id', user.id)
          .order('joined_at', { ascending: false })
          .limit(5)
        
        setRecentContests(participations || [])
      }
      setIsLoading(false)
    }
    loadData()
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

  if (isLoading) return <div className="flex justify-center p-24"><Loader2 className="animate-spin text-primary" /></div>
  if (!user) return <div className="text-center p-24">Please login to view your profile.</div>

  return (
    <main className="container max-w-6xl py-12 px-4">
      <div className="flex flex-col md:flex-row gap-8 items-start">
        {/* Sidebar: Profile Info */}
        <div className="w-full md:w-80 space-y-6">
          <Card className="border-2 overflow-hidden">
            <div className="h-24 bg-primary/10 relative">
               <div className="absolute -bottom-10 left-6">
                 <div className="w-20 h-20 rounded-2xl bg-white border-4 border-white shadow-lg flex items-center justify-center">
                   <UserIcon className="w-10 h-10 text-primary" />
                 </div>
               </div>
            </div>
            <CardHeader className="pt-12 pb-4">
              <CardTitle className="text-xl font-bold">{user.email?.split('@')[0]}</CardTitle>
              <CardDescription>{user.email}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
               <div className="flex flex-col gap-2">
                 <div className="flex justify-between items-center text-sm">
                   <span className="text-muted-foreground flex items-center gap-2"><Trophy className="w-4 h-4" /> CF Handle</span>
                   <span className="font-mono font-bold text-primary">{cfHandle || 'None'}</span>
                 </div>
                 <div className="flex justify-between items-center text-sm">
                   <span className="text-muted-foreground flex items-center gap-2"><Code className="w-4 h-4" /> AC Handle</span>
                   <span className="font-mono font-bold text-primary">{acHandle || 'None'}</span>
                 </div>
               </div>
               <Button variant="outline" size="sm" className="w-full mt-4 h-9 gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" /> Verified Account
               </Button>
            </CardContent>
          </Card>

          <Card className="border-2">
             <CardHeader className="py-4">
               <CardTitle className="text-sm">Summary Statistics</CardTitle>
             </CardHeader>
             <CardContent className="grid grid-cols-2 gap-4 pb-4">
                <div className="space-y-1">
                   <div className="text-2xl font-bold text-primary">{stats.acceptedCount}</div>
                   <div className="text-[10px] uppercase font-bold text-muted-foreground tracking-tighter">Solved Problems</div>
                </div>
                <div className="space-y-1">
                   <div className="text-2xl font-bold text-primary">{stats.contestsJoined}</div>
                   <div className="text-[10px] uppercase font-bold text-muted-foreground tracking-tighter">Contests</div>
                </div>
             </CardContent>
          </Card>
        </div>

        {/* Main Content: Dashboard / Settings */}
        <div className="flex-1 w-full space-y-8">
          <Tabs defaultValue="dashboard" className="w-full">
            <TabsList className="bg-muted/50 p-1 mb-6">
              <TabsTrigger value="dashboard" className="gap-2"><BarChart3 className="w-4 h-4" /> Dashboard</TabsTrigger>
              <TabsTrigger value="history" className="gap-2"><History className="w-4 h-4" /> Contest History</TabsTrigger>
              <TabsTrigger value="settings" className="gap-2"><Settings className="w-4 h-4" /> Settings</TabsTrigger>
            </TabsList>

            <TabsContent value="dashboard" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 <StatCard 
                  title="Accuracy" 
                  value={stats.totalSubmissions > 0 ? `${Math.round((stats.acceptedCount / stats.totalSubmissions) * 100)}%` : '0%'} 
                  subtitle={`${stats.acceptedCount} / ${stats.totalSubmissions} submissions`}
                />
                 <StatCard 
                  title="Recent Activity" 
                  value={stats.totalSubmissions.toString()} 
                  subtitle="Total life-time attempts"
                />
                 <StatCard 
                  title="Contest Rank" 
                  value="-" 
                  subtitle="Average placement"
                />
              </div>

              <Card className="border-2">
                <CardHeader>
                  <CardTitle>Recent Participation</CardTitle>
                  <CardDescription>Your latest contest appearances.</CardDescription>
                </CardHeader>
                <CardContent className="px-0">
                  <div className="divide-y">
                    {recentContests.map((p) => (
                      <Link 
                        key={p.id} 
                        href={`/contests/${p.contests.id}`}
                        className="flex justify-between items-center p-4 hover:bg-muted/30 transition-colors group"
                      >
                        <div>
                          <div className="font-bold group-hover:text-primary transition-colors">{p.contests.title}</div>
                          <div className="text-xs text-muted-foreground flex items-center gap-2 mt-1">
                             <History className="w-3 h-3" />
                             Joined on {new Date(p.joined_at).toLocaleDateString()}
                          </div>
                        </div>
                        <Badge variant="outline" className="gap-1 border-primary/20 text-primary">
                           View Result
                        </Badge>
                      </Link>
                    ))}
                    {recentContests.length === 0 && (
                      <div className="py-12 text-center text-muted-foreground">
                        No contests joined yet. 
                        <Link href="/contests" className="text-primary hover:underline ml-1">Browse contests</Link>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="history" className="space-y-6">
               <Card className="border-2">
                  <CardHeader>
                    <CardTitle>Full Contest History</CardTitle>
                    <CardDescription>Track your progress across all past competitions.</CardDescription>
                  </CardHeader>
                  <CardContent className="py-20 text-center text-muted-foreground">
                     Detailed history and performance analytics coming soon.
                  </CardContent>
               </Card>
            </TabsContent>

            <TabsContent value="settings" className="space-y-6">
              <Card className="border-2">
                <CardHeader>
                  <CardTitle>Competitive Profile</CardTitle>
                  <CardDescription>Link your Online Judge accounts for ranking verification.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="cf-handle">Codeforces Handle</Label>
                      <Input 
                        id="cf-handle" 
                        value={cfHandle} 
                        onChange={(e) => setCfHandle(e.target.value)} 
                        placeholder="e.g. tourist"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="ac-handle">AtCoder Handle</Label>
                      <Input 
                        id="ac-handle" 
                        value={acHandle} 
                        onChange={(e) => setAcHandle(e.target.value)} 
                        placeholder="e.g. rng_58"
                      />
                    </div>
                  </div>
                  
                  <Alert variant="default" className="bg-amber-50 border-amber-200">
                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                    <AlertTitle className="text-amber-800 font-bold">Verification Note</AlertTitle>
                    <AlertDescription className="text-amber-700 text-xs">
                      nJudge pings these OJs via your browser bridge to verify your participation. 
                      Ensure your handle exactly matches the OJ profile.
                    </AlertDescription>
                  </Alert>
                </CardContent>
                <CardFooter className="bg-muted/20 border-t py-4">
                  <Button 
                    className="ml-auto bg-primary hover:bg-primary/90" 
                    onClick={handleSave}
                    disabled={isSaving}
                  >
                    {isSaving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</> : 'Save Settings'}
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </main>
  )
}

function StatCard({ title, value, subtitle }: { title: string, value: string, subtitle: string }) {
  return (
    <Card className="border-2">
      <CardHeader className="py-3 px-4">
        <CardDescription className="text-[10px] uppercase font-extrabold tracking-widest text-primary/70">{title}</CardDescription>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        <div className="text-3xl font-extrabold mb-1 tracking-tight">{value}</div>
        <p className="text-[10px] text-muted-foreground font-medium">{subtitle}</p>
      </CardContent>
    </Card>
  )
}
