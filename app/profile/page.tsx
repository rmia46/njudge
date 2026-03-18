'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { supabase } from '@/lib/supabase'
import { User } from '@supabase/supabase-js'
import { Loader2, CheckCircle2, AlertTriangle, ShieldCheck, User as UserIcon, History, BarChart3, Settings, Trophy, Code, Users, Clock, Lock } from 'lucide-react'
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
  const [arrangedContests, setArrangedContests] = useState<any[]>([])
  
  const [cfData, setCfData] = useState<{ rating?: number, rank?: string, avatar?: string } | null>(null)
  const [acData, setAcData] = useState<{ rating?: number, rank?: string, level?: string } | null>(null)

  useEffect(() => {
    if (cfHandle && cfHandle.trim()) {
      fetch(`https://codeforces.com/api/user.info?handles=${cfHandle}`)
        .then(res => res.json())
        .then(data => {
          if (data.status === 'OK') {
            const user = data.result[0]
            setCfData({ rating: user.rating, rank: user.rank, avatar: user.avatar })
          }
        })
        .catch(err => console.error('CF Fetch error:', err))
    } else if (cfData !== null) {
      setCfData(null)
    }
  }, [cfHandle, cfData])

  useEffect(() => {
    if (acHandle && acHandle.trim()) {
      fetch(`https://us-central1-atcoderusersapi.cloudfunctions.net/api/info/username/${acHandle}`)
        .then(res => res.json())
        .then(data => {
          if (data && !data.error) {
            setAcData({ rating: data.rating, rank: data.rank, level: data.level })
          }
        })
        .catch(err => console.error('AC Fetch error:', err))
    } else if (acData !== null) {
      setAcData(null)
    }
  }, [acHandle, acData])

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

        // Load Arranged Contests
        const { data: arranged } = await supabase
          .from('contests')
          .select('*, participants(count)')
          .eq('owner_id', user.id)
          .order('created_at', { ascending: false })
        
        setArrangedContests(arranged || [])

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
    else setIsSaving(false)
  }

  if (isLoading) return <div className="flex justify-center p-24 text-inara-primary"><Loader2 className="animate-spin" /></div>
  if (!user) return <div className="text-center p-24">Please sign in to view your profile.</div>

  return (
    <main className="max-w-7xl mx-auto py-12 px-4 w-full">
      <div className="flex flex-col md:flex-row gap-8 items-start">
        {/* Sidebar: Profile Info */}
        <div className="w-full md:w-80 space-y-6 text-inara-logic">
          <Card className="border-2 rounded-xl overflow-hidden shadow-sm">
            <div className="h-24 bg-inara-primary/10 relative border-b-2 border-inara-border/10">
               <div className="absolute -bottom-10 left-6">
                 <div className="w-20 h-20 rounded-2xl bg-white border-4 border-white shadow-lg flex items-center justify-center">
                   <UserIcon className="w-10 h-10 text-inara-primary" />
                 </div>
               </div>
            </div>
            <CardHeader className="pt-12 pb-4">
              <CardTitle className="text-xl font-black">{user.email?.split('@')[0]}</CardTitle>
              <CardDescription className="text-inara-logic/40 font-medium">{user.email}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
               <div className="flex flex-col gap-4">
                  <AccountCard 
                    type="CF" 
                    handle={cfHandle} 
                    rating={cfData?.rating} 
                    rank={cfData?.rank} 
                    url={`https://codeforces.com/profile/${cfHandle}`}
                  />
                  <AccountCard 
                    type="AC" 
                    handle={acHandle} 
                    rating={acData?.rating} 
                    rank={acData?.rank || acData?.level} 
                    url={`https://atcoder.jp/users/${acHandle}`}
                  />
               </div>
               <Button variant="outline" size="sm" className="inara-btn bg-white w-full mt-4 h-9 gap-2 text-[10px]">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" /> VERIFIED ACCOUNT
               </Button>
            </CardContent>
          </Card>

          <Card className="border-2 rounded-xl">
             <CardHeader className="py-4 border-b-2 border-inara-border/5">
               <CardTitle className="text-xs font-black uppercase tracking-widest opacity-40">Life-time stats</CardTitle>
             </CardHeader>
             <CardContent className="grid grid-cols-2 gap-4 py-6">
                <div className="space-y-1">
                   <div className="text-3xl font-black text-inara-primary">{stats.acceptedCount}</div>
                   <div className="text-[10px] uppercase font-bold text-inara-logic/40 tracking-tight leading-none">Solved</div>
                </div>
                <div className="space-y-1">
                   <div className="text-3xl font-black text-inara-primary">{stats.contestsJoined}</div>
                   <div className="text-[10px] uppercase font-bold text-inara-logic/40 tracking-tight leading-none">Contests</div>
                </div>
             </CardContent>
          </Card>
        </div>

        {/* Main Content: Dashboard / Settings */}
        <div className="flex-1 w-full space-y-8">
          <Tabs defaultValue="dashboard" className="w-full">
            <TabsList className="bg-inara-muted/30 p-1 border-2 border-inara-border rounded-xl mb-8">
              <TabsTrigger value="dashboard" className="gap-2 px-6 font-bold text-sm"><BarChart3 className="w-4 h-4" /> Dashboard</TabsTrigger>
              <TabsTrigger value="arranged" className="gap-2 px-6 font-bold text-sm"><Settings className="w-4 h-4" /> My Contests</TabsTrigger>
              <TabsTrigger value="history" className="gap-2 px-6 font-bold text-sm"><History className="w-4 h-4" /> Participation</TabsTrigger>
              <TabsTrigger value="settings" className="gap-2 px-6 font-bold text-sm"><UserIcon className="w-4 h-4" /> Settings</TabsTrigger>
            </TabsList>

            <TabsContent value="arranged" className="space-y-6 focus-visible:outline-none">
              <Card className="inara-block border-0 bg-transparent shadow-none">
                <CardHeader className="bg-inara-muted/20 border-2 border-inara-border rounded-t-xl py-4">
                  <CardTitle className="text-xl font-black text-inara-logic uppercase tracking-tight">Hosted Challenges</CardTitle>
                  <CardDescription className="text-inara-logic/40 font-medium">Contests you have organized and manage.</CardDescription>
                </CardHeader>
                <CardContent className="bg-white border-2 border-t-0 border-inara-border rounded-b-xl p-0">
                  <div className="divide-y-2 divide-inara-border/5">
                    {arrangedContests.map((c) => (
                      <div key={c.id} className="flex justify-between items-center p-6 hover:bg-inara-muted/5 transition-colors">
                        <div>
                          <Link href={`/contests/${c.id}`} className="font-black text-xl text-inara-logic hover:text-inara-primary transition-colors italic">
                            {c.title}
                          </Link>
                          <div className="flex gap-6 mt-1 text-[10px] font-bold text-inara-logic/40 uppercase">
                            <span className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5" /> {c.participants?.[0]?.count || 0} joined</span>
                            <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> {c.duration_minutes}m</span>
                            {c.is_private && <span className="text-rose-500 flex items-center gap-1.5 font-black"><Lock className="w-3.5 h-3.5" /> Private</span>}
                          </div>
                        </div>
                        <Button asChild variant="outline" className="inara-btn bg-white h-10 px-6 font-black text-xs">
                          <Link href={`/contests/create?edit=${c.id}`}>MANAGE</Link>
                        </Button>
                      </div>
                    ))}
                    {arrangedContests.length === 0 && (
                      <div className="py-24 text-center text-inara-logic/20 italic font-black text-lg">
                        You haven&apos;t organized any contests yet.
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="dashboard" className="space-y-8 focus-visible:outline-none">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                 <StatCard 
                  title="Accuracy" 
                  value={stats.totalSubmissions > 0 ? `${Math.round((stats.acceptedCount / stats.totalSubmissions) * 100)}%` : '0%'} 
                  subtitle={`${stats.acceptedCount} / ${stats.totalSubmissions} submissions`}
                />
                 <StatCard 
                  title="Activity" 
                  value={stats.totalSubmissions.toString()} 
                  subtitle="Total life-time attempts"
                />
                 <StatCard 
                  title="Rank" 
                  value="-" 
                  subtitle="Average placement"
                />
              </div>

              <Card className="inara-block border-0 bg-transparent shadow-none">
                <CardHeader className="bg-inara-muted/20 border-2 border-inara-border rounded-t-xl py-4">
                  <CardTitle className="text-xl font-black text-inara-logic uppercase tracking-tight">Recent Activity</CardTitle>
                  <CardDescription className="text-inara-logic/40 font-medium">Your latest contest appearances.</CardDescription>
                </CardHeader>
                <CardContent className="bg-white border-2 border-t-0 border-inara-border rounded-b-xl p-0">
                  <div className="divide-y-2 divide-inara-border/5">
                    {recentContests.map((p) => (
                      <Link 
                        key={p.id} 
                        href={`/contests/${p.contests.id}`}
                        className="flex justify-between items-center p-6 hover:bg-inara-muted/5 transition-colors group"
                      >
                        <div>
                          <div className="font-black text-xl group-hover:text-inara-primary transition-colors text-inara-logic italic">{p.contests.title}</div>
                          <div className="text-[10px] text-inara-logic/40 flex items-center gap-2 mt-1 font-bold uppercase">
                             <History className="w-3.5 h-3.5" />
                             Joined on {new Date(p.joined_at).toLocaleDateString()}
                          </div>
                        </div>
                        <Badge variant="outline" className="h-8 px-4 border-inara-primary/20 text-inara-primary font-black uppercase text-[10px]">
                           View Result
                        </Badge>
                      </Link>
                    ))}
                    {recentContests.length === 0 && (
                      <div className="py-20 text-center text-inara-logic/20 font-black italic">
                        No contests joined yet. 
                        <Link href="/contests" className="text-inara-primary hover:underline ml-1">Browse contests</Link>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="history" className="space-y-6 focus-visible:outline-none">
               <Card className="inara-block border-0 bg-transparent shadow-none">
                  <CardHeader className="bg-inara-muted/20 border-2 border-inara-border rounded-t-xl py-4">
                    <CardTitle className="text-xl font-black text-inara-logic uppercase">Participation log</CardTitle>
                  </CardHeader>
                  <CardContent className="bg-white border-2 border-t-0 border-inara-border rounded-b-xl py-24 text-center text-inara-logic/20 font-black italic">
                     Full history and performance data arriving soon.
                  </CardContent>
               </Card>
            </TabsContent>

            <TabsContent value="settings" className="space-y-6 focus-visible:outline-none">
              <Card className="inara-block border-0 bg-transparent shadow-none">
                <CardHeader className="bg-inara-muted/20 border-2 border-inara-border rounded-t-xl py-4">
                  <CardTitle className="text-xl font-black text-inara-logic uppercase">Identity Matrix</CardTitle>
                  <CardDescription className="text-inara-logic/40 font-medium">Link your Online Judge accounts for ranking verification.</CardDescription>
                </CardHeader>
                <CardContent className="bg-white border-2 border-t-0 border-inara-border rounded-b-xl space-y-8 p-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-2">
                      <Label htmlFor="cf-handle" className="text-[10px] font-black uppercase opacity-40">Codeforces ID</Label>
                      <Input 
                        id="cf-handle" value={cfHandle} onChange={(e) => setCfHandle(e.target.value)} 
                        placeholder="e.g. tourist" className="h-12 border-2 font-bold focus-visible:ring-inara-primary/20"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="ac-handle" className="text-[10px] font-black uppercase opacity-40">AtCoder ID</Label>
                      <Input 
                        id="ac-handle" value={acHandle} onChange={(e) => setAcHandle(e.target.value)} 
                        placeholder="e.g. rng_58" className="h-12 border-2 font-bold focus-visible:ring-inara-primary/20"
                      />
                    </div>
                  </div>
                  
                  <Alert variant="default" className="bg-amber-50 border-amber-200 rounded-xl border-2">
                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                    <AlertTitle className="text-amber-800 font-black text-xs uppercase">Verification Note</AlertTitle>
                    <AlertDescription className="text-amber-700 text-xs font-medium">
                      nJudge pings these OJs via your browser bridge to verify your participation. 
                      Ensure your handle exactly matches the OJ profile.
                    </AlertDescription>
                  </Alert>
                </CardContent>
                <CardFooter className="bg-white border-2 border-t-0 border-inara-border rounded-b-xl py-6 px-8">
                  <Button 
                    className="ml-auto inara-btn inara-btn-primary h-11 px-8 font-black text-xs shadow-none" 
                    onClick={handleSave}
                    disabled={isSaving}
                  >
                    {isSaving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> SAVING...</> : 'SAVE SETTINGS'}
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
    <Card className="inara-block bg-white p-6 space-y-2">
      <CardHeader className="p-0 space-y-1">
        <CardDescription className="text-[10px] font-black uppercase text-inara-primary tracking-widest">{title}</CardDescription>
        <div className="text-4xl font-black text-inara-logic tracking-tighter leading-none">{value}</div>
      </CardHeader>
      <CardContent className="p-0">
        <p className="text-[10px] text-inara-logic/40 font-bold uppercase">{subtitle}</p>
      </CardContent>
    </Card>
  )
}

function AccountCard({ type, handle, rating, rank, url }: { type: 'CF' | 'AC', handle: string, rating?: number, rank?: string, url: string }) {
  if (!handle) return (
    <div className="flex items-center justify-between p-3 rounded-xl border-2 border-dashed border-inara-border/10 opacity-40">
       <span className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
         {type === 'CF' ? <Trophy className="w-3 h-3" /> : <Code className="w-3 h-3" />}
         {type === 'CF' ? 'Codeforces' : 'AtCoder'}
       </span>
       <span className="text-[10px] font-bold italic">Not linked</span>
    </div>
  )

  return (
    <Link href={url} target="_blank" className="block group">
      <div className="flex items-center justify-between p-3 rounded-xl border-2 border-inara-border/10 hover:border-inara-primary/30 transition-all hover:bg-inara-muted/5">
         <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-inara-logic text-white flex items-center justify-center font-black text-xs">
               {type === 'CF' ? <Trophy className="w-4 h-4" /> : <Code className="w-4 h-4" />}
            </div>
            <div className="flex flex-col">
               <span className="text-[10px] font-black uppercase text-inara-logic group-hover:text-inara-primary transition-colors">{handle}</span>
               {rank && <span className="text-[9px] font-bold text-inara-logic/40 capitalize leading-none">{rank.replace(/_/g, ' ')}</span>}
            </div>
         </div>
         {rating !== undefined && (
           <div className="text-right">
              <div className="text-sm font-black text-inara-primary leading-none">{rating}</div>
              <div className="text-[8px] font-black text-inara-logic/20 uppercase tracking-tighter">Rating</div>
           </div>
         )}
      </div>
    </Link>
  )
}
