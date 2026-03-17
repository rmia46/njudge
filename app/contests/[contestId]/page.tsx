'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { supabase } from '@/lib/supabase'
import { Loader2, ArrowRight, PlayCircle, Trophy, ListChecks, Users, Clock, MessageSquare, ChevronRight, Lock, Unlock, Edit3, Trash2, Eye, EyeOff } from 'lucide-react'
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { ContestStandings } from '@/components/contest-standings'
import { ContestStatus } from '@/components/contest-status'
import { ContestComments } from '@/components/contest-comments'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

export default function ContestView() {
  const params = useParams()
  const router = useRouter()
  const contestId = params.contestId as string
  
  const [contest, setContest] = useState<any>(null)
  const [problems, setProblems] = useState<any[]>([])
  const [isParticipant, setIsParticipant] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isJoining, setIsJoining] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [accessCode, setAccessCode] = useState('')
  const [adminMode, setAdminMode] = useState(false)

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

    if (contest.is_private && accessCode !== contest.password) {
      toast.error("Incorrect access code")
      return
    }

    setIsJoining(true)
    const { error } = await supabase
      .from('participants')
      .insert({ contest_id: contestId, user_id: user.id })
    
    if (!error) {
      setIsParticipant(true)
      toast.success("Welcome to the contest!")
    } else {
      toast.error(error.message)
    }
    setIsJoining(false)
  }

  const deleteContest = async () => {
    setIsDeleting(true)
    const { error } = await supabase.from('contests').delete().eq('id', contestId)
    if (error) {
      toast.error(error.message)
      setIsDeleting(false)
    } else {
      toast.success("Contest deleted")
      router.push('/contests')
    }
  }

  if (isLoading) return <div className="flex justify-center p-24 text-inara-primary"><Loader2 className="animate-spin" /></div>
  if (!contest) return <div className="text-center p-24">Contest not found.</div>

  const isUpcoming = new Date(contest.start_time) > new Date()
  const isOwner = user?.id === contest.owner_id
  const canViewContent = !contest.is_private || isParticipant || isOwner || contest.is_practice

  return (
    <main className="max-w-7xl mx-auto py-12 px-4 space-y-10 w-full text-inara-logic">
      {/* 1. Contest Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8 pb-10 border-b-4 border-inara-border">
        <div className="space-y-4 flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            {contest.is_practice ? (
              <span className="inara-badge border-2 text-indigo-600 border-indigo-200 bg-indigo-50 flex items-center gap-1.5">
                <Trophy className="w-3 h-3" /> Practice Mode
              </span>
            ) : (
              <span className={cn(
                "inara-badge border-2",
                isUpcoming ? "text-amber-600 border-amber-200 bg-amber-50" : "text-emerald-600 border-emerald-200 bg-emerald-50"
              )}>
                {isUpcoming ? 'Upcoming' : 'Ongoing Contest'}
              </span>
            )}
            
            {contest.is_private ? (
              <span className="inara-badge border-2 text-rose-600 border-rose-200 bg-rose-50 flex items-center gap-1.5">
                <Lock className="w-3 h-3" /> Private
              </span>
            ) : (
              <span className="inara-badge border-2 text-blue-600 border-blue-200 bg-blue-50 flex items-center gap-1.5">
                <Unlock className="w-3 h-3" /> Public
              </span>
            )}

            {isOwner && (
              <div className="flex items-center gap-2">
                <span className="inara-badge border-2 text-inara-primary border-inara-primary/20 bg-inara-primary/5">Owner Mode</span>
                <button 
                  onClick={() => setAdminMode(!adminMode)}
                  className={cn(
                    "px-3 py-1 rounded-full text-[10px] font-black uppercase transition-all border-2 flex items-center gap-1.5",
                    adminMode ? "bg-rose-500 text-white border-rose-600 shadow-[0_0_10px_rgba(244,63,94,0.3)]" : "bg-white text-inara-logic/40 border-inara-border/10 hover:border-inara-primary/30"
                  )}
                >
                  {adminMode ? <><Eye className="w-3 h-3" /> Admin HUD: ON</> : <><EyeOff className="w-3 h-3" /> Admin HUD: OFF</>}
                </button>
              </div>
            )}
          </div>
          <h1 className="text-5xl font-black tracking-tight uppercase leading-none">{contest.title}</h1>
          <p className="text-inara-logic/60 max-w-2xl font-medium leading-relaxed italic">{contest.description || 'Join this competitive programming challenge.'}</p>
        </div>
        
        <div className="flex flex-col items-end gap-4 min-w-[240px]">
          <div className="text-right space-y-1">
            <div className="inara-data text-base font-bold flex items-center gap-2 justify-end">
              <Clock className="w-4 h-4 text-inara-primary" /> 
              {contest.duration_minutes >= 999999 ? 'Infinite Duration' : `${contest.duration_minutes} minutes`}
            </div>
            <div className="text-[10px] font-black uppercase text-inara-logic/40">
              {contest.is_practice ? `Started: ${new Date(contest.start_time).toLocaleDateString()}` : `Starts: ${new Date(contest.start_time).toLocaleString()}`}
            </div>
          </div>
          
          <div className="flex flex-col gap-3 w-full">
            {isOwner ? (
              <div className="flex gap-3 w-full">
                <Button 
                  onClick={() => router.push(`/contests/create?edit=${contestId}`)}
                  variant="outline" 
                  className="inara-btn bg-white border-inara-border h-12 px-6 font-black flex-1"
                >
                  <Edit3 className="w-4 h-4 mr-2" /> EDIT
                </Button>
                
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button 
                      variant="outline" 
                      className="inara-btn bg-white border-rose-200 text-rose-600 hover:bg-rose-50 h-12 px-4 font-black"
                      disabled={isDeleting}
                    >
                      {isDeleting ? <Loader2 className="animate-spin" /> : <Trash2 className="w-4 h-4" />}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="inara-block bg-white p-8 border-4 border-inara-border shadow-2xl">
                    <AlertDialogHeader>
                      <AlertDialogTitle className="text-2xl font-black text-inara-logic uppercase">Delete Contest?</AlertDialogTitle>
                      <AlertDialogDescription className="text-inara-logic/60 font-medium">
                        This will permanently remove the contest, all its problems, and all submissions. This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="mt-8 gap-4">
                      <AlertDialogCancel className="inara-btn bg-white border-inara-border">Cancel</AlertDialogCancel>
                      <AlertDialogAction 
                        onClick={deleteContest}
                        className="inara-btn bg-rose-600 border-rose-700 text-white hover:bg-rose-700"
                      >
                        Delete Permanently
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            ) : !isParticipant && !contest.is_practice && (
              <div className="flex flex-col gap-3 w-full">
                {contest.is_private && (
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-black uppercase text-inara-logic/40 pl-1">Access Code Required</Label>
                    <Input 
                      type="password" 
                      placeholder="Enter code..." 
                      value={accessCode}
                      onChange={(e) => setAccessCode(e.target.value)}
                      className="h-11 border-2 border-inara-border font-mono text-center tracking-widest focus-visible:ring-inara-primary/20"
                    />
                  </div>
                )}
                <Button 
                  onClick={joinContest} 
                  disabled={isJoining || (contest.is_private && !accessCode)}
                  className="inara-btn inara-btn-primary h-12 px-10 font-black w-full"
                >
                  {isJoining ? <Loader2 className="animate-spin" /> : <><Users className="w-4 h-4 mr-2" /> JOIN CONTEST</>}
                </Button>
              </div>
            )}
            
            {(isParticipant || contest.is_practice) && !isOwner && (
              <div className="inara-block bg-inara-primary/5 border-inara-primary/30 px-6 py-3 rounded-xl text-inara-primary font-black text-xs flex items-center justify-center gap-2 w-full">
                <ListChecks className="w-4 h-4" /> {contest.is_practice ? 'PRACTICE ACTIVE' : 'REGISTERED'}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 2. Main Content Tabs */}
      {canViewContent ? (
        <Tabs defaultValue="problems" className="w-full">
          <TabsList className="bg-inara-muted/20 p-1 border-2 border-inara-border rounded-xl mb-8 max-w-2xl">
            <TabsTrigger value="problems" className="gap-2 px-6 font-bold text-sm"><ListChecks className="w-4 h-4" /> Problem Set</TabsTrigger>
            <TabsTrigger value="standings" className="gap-2 px-6 font-bold text-sm"><Trophy className="w-4 h-4" /> Leaderboard</TabsTrigger>
            <TabsTrigger value="status" className="gap-2 px-6 font-bold text-sm"><Clock className="w-4 h-4" /> Submissions</TabsTrigger>
            <TabsTrigger value="discussion" className="gap-2 px-6 font-bold text-sm"><MessageSquare className="w-4 h-4" /> Chat</TabsTrigger>
          </TabsList>
          
          <TabsContent value="problems" className="focus-visible:outline-none">
            <div className="inara-block overflow-hidden bg-white border-2 border-inara-border">
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
                    <tr key={prob.id} className="transition-colors group">
                      <td className="p-4 pl-8">
                        <div className="w-8 h-8 rounded bg-inara-logic/5 border-2 border-inara-border/20 flex items-center justify-center font-mono font-black text-inara-primary text-sm transition-colors">
                          {String.fromCharCode(65 + index)}
                        </div>
                      </td>
                      <td className="p-4">
                        <Link 
                          href={`/contests/${contestId}/problems/${prob.id}${adminMode ? '?admin=true' : ''}`} 
                          className="font-bold hover:text-inara-primary transition-colors text-base"
                        >
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
                          onClick={() => router.push(`/contests/${contestId}/problems/${prob.id}${adminMode ? '?admin=true' : ''}`)}
                          className="h-9 px-4 text-xs font-bold bg-white border-2 border-inara-border hover:bg-inara-muted transition-all"
                          disabled={!isParticipant && isUpcoming && !isOwner && !contest.is_practice}
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
                        <p className="text-inara-logic/40 font-bold italic text-sm">No problems linked to this contest yet.</p>
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
      ) : (
        <div className="inara-block p-20 bg-white text-center border-dashed border-4 border-inara-border/20 rounded-3xl">
          <Lock className="w-16 h-16 text-inara-logic/10 mx-auto mb-6" />
          <h2 className="text-3xl font-black text-inara-logic uppercase">Private Environment</h2>
          <p className="text-inara-logic/40 font-medium max-w-md mx-auto mt-2 italic">
            This contest is locked. Please enter the correct access code above and join to view problems and standings.
          </p>
        </div>
      )}
    </main>
  )
}
