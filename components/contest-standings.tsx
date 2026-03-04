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
import { Loader2, User as UserIcon, Trophy } from 'lucide-react'
import { calculateRankings, RankingResult, RankingRule } from '@/lib/ranking-engine'

export function ContestStandings({ contest, problems }: { contest: any, problems: any[] }) {
  const [standings, setStandings] = useState<RankingResult[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      // 1. Get Participants
      const { data: participants } = await supabase
        .from('participants')
        .select('user_id')
        .eq('contest_id', contest.id)

      const participantIds = (participants || []).map(p => p.user_id)
      
      // 2. Get Profiles
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, cf_handle')
        .in('id', participantIds)

      // 3. Get Submissions
      const { data: submissions } = await supabase
        .from('submissions')
        .select('*')
        .eq('contest_id', contest.id)
        .order('submitted_at', { ascending: true })

      const results = calculateRankings(
        profiles || [],
        submissions || [],
        problems,
        contest.start_time,
        (contest.ranking_rule as RankingRule) || 'ICPC'
      )

      setStandings(results)
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
  }, [contest.id, problems, contest.ranking_rule, contest.start_time])

  if (isLoading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-primary" /></div>

  const isICPC = contest.ranking_rule === 'ICPC'

  return (
    <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
      <Table>
        <TableHeader className="bg-muted/50">
          <TableRow className="hover:bg-transparent">
            <TableHead className="w-16 text-center font-bold">Rank</TableHead>
            <TableHead>Participant</TableHead>
            <TableHead className="w-20 text-center font-bold">Solved</TableHead>
            <TableHead className="w-24 text-center font-bold">
              {isICPC ? 'Penalty' : 'Score'}
            </TableHead>
            {problems.map((p, i) => (
              <TableHead key={p.id} className="text-center min-w-[80px] font-bold">
                {String.fromCharCode(65 + i)}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {standings.map((s) => (
            <TableRow key={s.userId} className="hover:bg-muted/30 transition-colors">
              <TableCell className="text-center font-mono">
                {s.rank === 1 ? <Trophy className="w-4 h-4 text-amber-500 mx-auto" /> : s.rank}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
                    <UserIcon className="w-4 h-4 text-primary" />
                  </div>
                  <span className="font-semibold">{s.cfHandle}</span>
                </div>
              </TableCell>
              <TableCell className="text-center font-bold text-lg text-primary">{s.solved}</TableCell>
              <TableCell className="text-center font-mono text-sm text-muted-foreground">{s.score}</TableCell>
              {problems.map((p) => {
                const prob = s.problems[p.id]
                return (
                  <TableCell key={p.id} className="text-center p-2">
                    {prob.solved ? (
                      <div className="flex flex-col items-center gap-0.5">
                        <Badge className="bg-verdict-ac hover:bg-verdict-ac border-0 shadow-sm px-2 py-0 h-6">
                          +{prob.attempts > 0 ? prob.attempts : ''}
                        </Badge>
                        <span className="text-[10px] font-mono text-muted-foreground">
                          {isICPC ? prob.penalty : prob.points}
                        </span>
                      </div>
                    ) : prob.attempts > 0 ? (
                      <Badge className="bg-verdict-wa hover:bg-verdict-wa border-0 shadow-sm px-2 py-0 h-6">
                        -{prob.attempts}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground/30">-</span>
                    )}
                  </TableCell>
                )
              })}
            </TableRow>
          ))}
          {standings.length === 0 && (
            <TableRow>
              <TableCell colSpan={4 + problems.length} className="text-center py-16 text-muted-foreground">
                <div className="flex flex-col items-center gap-2">
                  <UserIcon className="w-8 h-8 opacity-20" />
                  <p>Wait for the first submission!</p>
                </div>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}
