'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { supabase } from '@/lib/supabase'
import { Loader2, ArrowRight, PlayCircle, Trophy, ListChecks, Users, Clock, MessageSquare, ChevronRight, Lock, Unlock } from 'lucide-react'
import { ContestStandings } from '@/components/contest-standings'
import { ContestStatus } from '@/components/contest-status'
import { ContestComments } from '@/components/contest-comments'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

export default function ContestView() {
  const params = useParams()
  const router = useRouter()
  const contestId = params.contestId as string
  
  const [contest, setContest] = useState<any>(null)
  const [problems, setProblems] = useState<any[]>([])
  const [isParticipant, setIsParticipant] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isJoining, setIsJoining] = useState(false)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    async function fetchData() {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)

      const { data: contestData } = await supabase
        .from('contests')
        .select('*')
        .eq('id', contestId)
        .single()
      
      const { data: problemsData } = await supabase
        .from('problems')
        .select('*')
        .eq('contest_id', contestId)
        .order('created_at', { ascending: true })

      if (user) {
        const { data: participant } = await supabase
          .from('participants')
          .select('*')
          .eq('contest_id', contestId)
          .eq('user_id', user.id)
          .single()
        setIsParticipant(!!participant)
      }

      setContest(contestData)
      setProblems(problemsData || [])
      setIsLoading(false)
    }
    fetchData()
  }, [contestId])

  const joinContest = async () => {
    if (!user) {
      router.push('/login')
      return
    }
    setIsJoining(true)
    const { error } = await supabase
      .from('participants')
      .insert({ contest_id: contestId, user_id: user.id })
    
    if (!error) setIsParticipant(true)
    setIsJoining(false)
  }

  if (isLoading) return <div className="flex justify-center p-24 text-inara-primary"><Loader2 className="animate-spin" /></div>
  if (!contest) return <div className="text-center p-24">Contest not found.</div>

  const isUpcoming = new Date(contest.start_time) > new Date()

  return (
    <main className="max-w-7xl mx-auto py-12 px-4 space-y-10 w-full">
      {/* 1. Contest Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8 pb-10 border-b-4 border-inara-border">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <span className={cn(
              "inara-badge border-2",
              isUpcoming ? "text-amber-600 border-amber-200 bg-amber-50" : "text-emerald-600 border-emerald-200 bg-emerald-50"
            )}>
              {isUpcoming ? 'Upcoming' : 'Ongoing Arena'}
            </span>
            {contest.is_private ? (
              <span className="inara-badge border-2 text-rose-600 border-rose-200 bg-rose-50 flex items-center gap-1.5">
                <Lock className="w-3 h-3" /> Private
              </span>
            ) : (
              <span className="inara-badge border-2 text-blue-600 border-blue-200 bg-blue-50 flex items-center gap-1.5">
                <Unlock className="w-3 h-3" /> Public
              </span>
            )}
          </div>
          <h1 className="text-5xl font-black tracking-tight text-inara-logic uppercase leading-none">{contest.title}</h1>
          <p className="text-inara-logic/60 max-w-2xl font-medium leading-relaxed italic">{contest.description || 'Join this competitive programming challenge.'}</p>
        </div>
        
        <div className="flex flex-col items-end gap-4 min-w-[240px]">
          <div className="text-right space-y-1">
            <div className="inara-data text-base font-bold flex items-center gap-2 justify-end">
              <Clock className="w-4 h-4" /> {contest.duration_minutes} minutes
            </div>
            <div className="text-[10px] font-black uppercase text-inara-logic/40">Starts: {new Date(contest.start_time).toLocaleString()}</div>
          </div>
          
          {!isParticipant ? (
            <Button 
              onClick={joinContest} 
              disabled={isJoining}
              className="inara-btn inara-btn-primary h-12 px-10 font-black w-full"
            >
              {isJoining ? <Loader2 className="animate-spin" /> : <><Users className="w-4 h-4 mr-2" /> JOIN CONTEST</>}
            </Button>
          ) : (
            <div className="inara-block bg-inara-primary/5 border-inara-primary/30 px-6 py-2 rounded-xl text-inara-primary font-black text-xs flex items-center gap-2">
              <ListChecks className="w-4 h-4" /> REGISTERED
            </div>
          )}
        </div>
      </div>

      {/* 2. Main Content Tabs */}
      <Tabs defaultValue="problems" className="w-full">
        <TabsList className="bg-inara-muted/20 p-1 border-2 border-inara-border rounded-xl mb-8 max-w-2xl">
          <TabsTrigger value="problems" className="gap-2 px-6 font-bold text-sm"><ListChecks className="w-4 h-4" /> Problem Set</TabsTrigger>
          <TabsTrigger value="standings" className="gap-2 px-6 font-bold text-sm"><Trophy className="w-4 h-4" /> Leaderboard</TabsTrigger>
          <TabsTrigger value="status" className="gap-2 px-6 font-bold text-sm"><Clock className="w-4 h-4" /> Submissions</TabsTrigger>
          <TabsTrigger value="discussion" className="gap-2 px-6 font-bold text-sm"><MessageSquare className="w-4 h-4" /> Chat</TabsTrigger>
        </TabsList>
        
        <TabsContent value="problems" className="focus-visible:outline-none">
          <div className="inara-block overflow-hidden bg-white">
            <table className="w-full text-left border-collapse">
              <thead className="bg-inara-muted/20 border-b-2 border-inara-border">
                <tr>
                  <th className="p-4 text-[10px] font-black uppercase text-inara-logic/40 pl-8">ID</th>
                  <th className="p-4 text-[10px] font-black uppercase text-inara-logic/40">Title</th>
                  <th className="p-4 text-[10px] font-black uppercase text-inara-logic/40 text-center">OJ</th>
                  <th className="p-4 text-[10px] font-black uppercase text-inara-logic/40 text-center">Score</th>
                  <th className="p-4 text-[10px] font-black uppercase text-inara-logic/40 text-right pr-8">Solve</th>
                </tr>
              </thead>
              <tbody className="divide-y-2 divide-inara-border/5">
                {problems.map((prob, index) => (
                  <tr key={prob.id} className="hover:bg-inara-primary/5 transition-colors group">
                    <td className="p-4 pl-8">
                      <div className="w-8 h-8 rounded bg-inara-logic/5 border-2 border-inara-border/20 flex items-center justify-center font-mono font-black text-inara-primary text-sm group-hover:bg-inara-primary group-hover:text-white transition-colors">
                        {String.fromCharCode(65 + index)}
                      </div>
                    </td>
                    <td className="p-4">
                      <Link href={`/contests/${contestId}/problems/${prob.id}`} className="font-bold text-inara-logic hover:text-inara-primary transition-colors text-base">
                        {prob.title}
                      </Link>
                      <div className="text-[10px] font-mono font-bold text-inara-logic/30 uppercase tracking-tighter mt-0.5">{prob.external_id}</div>
                    </td>
                    <td className="p-4 text-center">
                      <Badge variant="outline" className="font-mono border-inara-border/20 text-[10px] font-bold">{prob.oj}</Badge>
                    </td>
                    <td className="p-4 text-center">
                      <span className="inara-data font-black text-sm">{prob.point_value || 100}</span>
                    </td>
                    <td className="p-4 text-right pr-8">
                      <Button 
                        onClick={() => router.push(`/contests/${contestId}/problems/${prob.id}`)}
                        className="h-9 px-4 text-xs font-bold bg-white border-2 border-inara-border hover:bg-inara-primary hover:text-white hover:border-inara-primary-dark transition-all"
                        disabled={!isParticipant && isUpcoming}
                      >
                        Enter <ArrowRight className="w-3 h-3 ml-2" />
                      </Button>
                    </td>
                  </tr>
                ))}
                {problems.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-24 text-center">
                      <PlayCircle className="w-12 h-12 text-inara-logic/10 mx-auto mb-4" />
                      <p className="text-inara-logic/40 font-bold italic text-sm">No problems linked to this arena yet.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </TabsContent>
        
        <TabsContent value="standings" className="focus-visible:outline-none">
          <ContestStandings contest={contest} problems={problems} />
        </TabsContent>

        <TabsContent value="status" className="focus-visible:outline-none">
          <ContestStatus contestId={contestId} problems={problems} />
        </TabsContent>

        <TabsContent value="discussion" className="focus-visible:outline-none">
          <ContestComments contestId={contestId} />
        </TabsContent>
      </Tabs>
    </main>
  )
}
