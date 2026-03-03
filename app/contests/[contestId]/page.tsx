'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { supabase } from '@/lib/supabase'
import { Loader2, ArrowRight, PlayCircle, Trophy, ListChecks, Users, Clock, MessageSquare } from 'lucide-react'
import { ContestStandings } from '@/components/contest-standings'
import { ContestStatus } from '@/components/contest-status'
import { ContestComments } from '@/components/contest-comments'

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

  if (isLoading) return <div className="flex justify-center p-24"><Loader2 className="animate-spin" /></div>
  if (!contest) return <div className="text-center p-24">Contest not found.</div>

  return (
    <main className="container max-w-6xl py-8 space-y-8 mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b pb-8 border-emerald-100 px-4 md:px-0">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Badge variant="outline" className="text-emerald-600 border-emerald-200">
              {new Date(contest.start_time) > new Date() ? 'Upcoming' : 'Ongoing'}
            </Badge>
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-emerald-900">{contest.title}</h1>
          <p className="text-muted-foreground mt-2">{contest.description || 'Practice Contest'}</p>
        </div>
        
        <div className="flex flex-col items-end gap-3 min-w-[200px]">
          <div className="text-right text-sm">
            <div className="font-semibold text-emerald-600">Duration: {contest.duration_minutes} minutes</div>
            <div className="text-muted-foreground">Starts: {new Date(contest.start_time).toLocaleString()}</div>
          </div>
          
          {!isParticipant ? (
            <Button 
              onClick={joinContest} 
              disabled={isJoining}
              className="w-full bg-emerald-600 hover:bg-emerald-700 h-10 shadow-lg shadow-emerald-200"
            >
              {isJoining ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Users className="w-4 h-4 mr-2" />}
              Join Contest
            </Button>
          ) : (
            <div className="flex items-center gap-2 text-emerald-600 font-medium text-sm bg-emerald-50 px-4 py-2 rounded-full border border-emerald-100">
              <ListChecks className="w-4 h-4" /> Registered
            </div>
          )}
        </div>
      </div>

      <div className="px-4 md:px-0">
        <Tabs defaultValue="problems" className="w-full">
          <TabsList className="grid w-full grid-cols-4 max-w-[600px] mb-8 bg-slate-100/50 p-1">
            <TabsTrigger value="problems" className="flex items-center gap-2">
              <ListChecks className="w-4 h-4" /> Problems
            </TabsTrigger>
            <TabsTrigger value="standings" className="flex items-center gap-2">
              <Trophy className="w-4 h-4" /> Standings
            </TabsTrigger>
            <TabsTrigger value="status" className="flex items-center gap-2">
              <Clock className="w-4 h-4" /> Status
            </TabsTrigger>
            <TabsTrigger value="discussion" className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4" /> Discussion
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="problems">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {problems.map((prob, index) => (
                <Card key={prob.id} className="hover:border-emerald-300 transition-all group hover:shadow-md">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="w-10 h-10 bg-emerald-100 text-emerald-700 flex items-center justify-center rounded-lg font-bold">
                        {String.fromCharCode(65 + index)}
                      </div>
                      <div className="text-xs font-mono bg-slate-100 px-2 py-1 rounded">{prob.oj}</div>
                    </div>
                    <CardTitle className="mt-4 group-hover:text-emerald-600 transition-colors">{prob.title}</CardTitle>
                    <CardDescription>{prob.external_id}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button 
                      onClick={() => router.push(`/contests/${contestId}/problems/${prob.id}`)}
                      className="w-full bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-none shadow-none"
                      disabled={!isParticipant && new Date(contest.start_time) > new Date()}
                    >
                      Solve Problem <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>

            {problems.length === 0 && (
              <div className="text-center py-24 bg-slate-50 rounded-xl border-2 border-dashed">
                <PlayCircle className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-900">No problems added yet</h3>
                <p className="text-slate-500">Edit this contest to add some problems.</p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="standings">
            <ContestStandings contest={contest} problems={problems} />
          </TabsContent>

          <TabsContent value="status">
            <ContestStatus contestId={contestId} problems={problems} />
          </TabsContent>

          <TabsContent value="discussion">
            <ContestComments contestId={contestId} />
          </TabsContent>
        </Tabs>
      </div>
    </main>
  )
}

function Badge({ children, variant, className }: any) {
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
      variant === 'outline' ? 'border' : 'bg-slate-100'
    } ${className}`}>
      {children}
    </span>
  )
}
