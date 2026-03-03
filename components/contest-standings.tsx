'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Loader2, User as UserIcon } from 'lucide-react'

interface Standing {
  userId: string
  email: string
  cfHandle?: string
  solved: number
  penalty: number
  problems: Record<string, { solved: boolean, attempts: number, penalty: number }>
}

export function ContestStandings({ contest, problems }: { contest: any, problems: any[] }) {
  const [standings, setStandings] = useState<Standing[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      // 1. Get Participants
      const { data: participants } = await supabase
        .from('participants')
        .select('user_id, profiles(id, cf_handle), auth:user_id(email)') // Note: Auth access might need a different join or separate call depending on Supabase setup
      
      // Since we can't join auth directly easily without specialized setup, let's just get profiles
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, cf_handle')

      const { data: allSubmissions } = await supabase
        .from('submissions')
        .select('*')
        .eq('contest_id', contest.id)
        .order('submitted_at', { ascending: true })

      calculateStandings(profiles || [], allSubmissions || [])
      setIsLoading(false)
    }

    fetchData()

    // Real-time updates for submissions
    const channel = supabase
      .channel(`contest_standings_${contest.id}`)
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'submissions', filter: `contest_id=eq.${contest.id}` }, 
        () => fetchData()
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [contest.id, problems])

  const calculateStandings = (profiles: any[], submissions: any[]) => {
    const userMap: Record<string, Standing> = {}
    
    // Initialize map with profiles
    profiles.forEach(p => {
      userMap[p.id] = {
        userId: p.id,
        email: 'User', // Placeholder
        cfHandle: p.cf_handle,
        solved: 0,
        penalty: 0,
        problems: {}
      }
      problems.forEach(prob => {
        userMap[p.id].problems[prob.id] = { solved: false, attempts: 0, penalty: 0 }
      })
    })

    const contestStart = new Date(contest.start_time).getTime()

    submissions.forEach(sub => {
      if (!userMap[sub.user_id]) return // Should not happen if profile exists
      
      const probData = userMap[sub.user_id].problems[sub.problem_id]
      if (probData.solved) return // Already solved

      if (sub.verdict === 'OK' || sub.verdict === 'Accepted') {
        probData.solved = true
        const minutesSinceStart = Math.floor((new Date(sub.submitted_at).getTime() - contestStart) / 60000)
        probData.penalty = minutesSinceStart + (probData.attempts * 20)
        
        userMap[sub.user_id].solved += 1
        userMap[sub.user_id].penalty += probData.penalty
      } else if (sub.verdict !== 'Judging' && sub.verdict !== 'In Queue' && sub.verdict !== 'Compilation Error') {
        probData.attempts += 1
      }
    })

    const sorted = Object.values(userMap).sort((a, b) => {
      if (a.solved !== b.solved) return b.solved - a.solved
      return a.penalty - b.penalty
    })

    setStandings(sorted)
  }

  if (isLoading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin" /></div>

  return (
    <div className="rounded-md border bg-white overflow-hidden">
      <Table>
        <TableHeader className="bg-slate-50">
          <TableRow>
            <TableHead className="w-16 text-center">Rank</TableHead>
            <TableHead>Participant</TableHead>
            <TableHead className="w-20 text-center">Solved</TableHead>
            <TableHead className="w-24 text-center">Penalty</TableHead>
            {problems.map((p, i) => (
              <TableHead key={p.id} className="text-center min-w-[80px]">
                {String.fromCharCode(65 + i)}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {standings.map((s, idx) => (
            <TableRow key={s.userId}>
              <TableCell className="text-center font-bold">{idx + 1}</TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <UserIcon className="w-4 h-4 text-slate-400" />
                  <div>
                    <div className="font-medium">{s.cfHandle || 'Anonymous'}</div>
                  </div>
                </div>
              </TableCell>
              <TableCell className="text-center font-bold text-lg text-emerald-600">{s.solved}</TableCell>
              <TableCell className="text-center text-slate-500">{s.penalty}</TableCell>
              {problems.map((p) => {
                const prob = s.problems[p.id]
                return (
                  <TableCell key={p.id} className="text-center">
                    {prob.solved ? (
                      <div className="flex flex-col items-center">
                        <Badge className="bg-emerald-500 hover:bg-emerald-600">+{prob.attempts > 0 ? prob.attempts : ''}</Badge>
                        <span className="text-[10px] text-slate-500 mt-1">{prob.penalty}</span>
                      </div>
                    ) : prob.attempts > 0 ? (
                      <Badge variant="destructive" className="bg-rose-500">-{prob.attempts}</Badge>
                    ) : '-'}
                  </TableCell>
                )
              })}
            </TableRow>
          ))}
          {standings.length === 0 && (
            <TableRow>
              <TableCell colSpan={4 + problems.length} className="text-center py-12 text-muted-foreground">
                No participants yet.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}
