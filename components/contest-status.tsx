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
import { Loader2, ExternalLink, Clock, User as UserIcon, Code, Eye } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

export function ContestStatus({ contestId, problems }: { contestId: string, problems: any[] }) {
  const [submissions, setSubmissions] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const problemMap = problems.reduce((acc, p) => {
    acc[p.id] = p
    return acc
  }, {} as Record<string, any>)

  useEffect(() => {
    const fetchData = async () => {
      const { data } = await supabase
        .from('submissions')
        .select('*, profiles(cf_handle)')
        .eq('contest_id', contestId)
        .order('submitted_at', { ascending: false })
        .limit(50)
      
      setSubmissions(data || [])
      setIsLoading(false)
    }

    fetchData()

    // Real-time updates
    const channel = supabase
      .channel(`contest_status_${contestId}`)
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'submissions', filter: `contest_id=eq.${contestId}` }, 
        () => fetchData()
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [contestId])

  if (isLoading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-primary" /></div>

  const getVerdictStyle = (verdict: string) => {
    if (verdict === 'OK' || verdict === 'Accepted') return 'text-inara-ac border-inara-ac bg-inara-ac/5'
    if (verdict === 'In Queue' || verdict === 'Judging') return 'text-amber-500 border-amber-200 bg-amber-50 animate-pulse'
    if (verdict === 'Wrong Answer') return 'text-inara-wa border-inara-wa bg-inara-wa/5'
    if (verdict === 'Time Limit Exceeded') return 'text-inara-tle border-inara-tle bg-inara-tle/5'
    if (verdict === 'Runtime Error') return 'text-inara-re border-inara-re bg-inara-re/5'
    return 'text-inara-ce border-inara-ce bg-inara-ce/5'
  }

  return (
    <div className="inara-block overflow-hidden bg-white border-2 border-inara-border">
      <Table>
        <TableHeader className="bg-inara-muted/20 border-b-2 border-inara-border">
          <TableRow className="hover:bg-transparent">
            <TableHead className="w-24 text-center text-[10px] font-black uppercase text-inara-logic/40">ID</TableHead>
            <TableHead className="text-[10px] font-black uppercase text-inara-logic/40">Time</TableHead>
            <TableHead className="text-[10px] font-black uppercase text-inara-logic/40">User</TableHead>
            <TableHead className="text-[10px] font-black uppercase text-inara-logic/40">Problem</TableHead>
            <TableHead className="text-[10px] font-black uppercase text-inara-logic/40">Language</TableHead>
            <TableHead className="text-right text-[10px] font-black uppercase text-inara-logic/40">Verdict</TableHead>
            <TableHead className="w-16"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className="divide-y-2 divide-inara-border/5">
          {submissions.map((sub) => (
            <TableRow key={sub.id} className="hover:bg-inara-primary/5 transition-colors group">
              <TableCell className="font-mono text-[10px] font-bold text-inara-logic/40 text-center">
                {sub.id.slice(0, 8).toUpperCase()}
              </TableCell>
              <TableCell className="whitespace-nowrap">
                <div className="flex items-center gap-1.5 text-xs font-bold text-inara-logic/60">
                  <Clock className="w-3 h-3" />
                  {new Date(sub.submitted_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded bg-inara-logic/5 border border-inara-border/20 flex items-center justify-center">
                    <UserIcon className="w-3 h-3 text-inara-logic/40" />
                  </div>
                  <span className="font-bold text-sm text-inara-logic">{sub.profiles?.cf_handle || 'Anonymous'}</span>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                   <div className="w-6 h-6 rounded bg-inara-primary/10 border border-inara-primary/20 flex items-center justify-center text-[10px] font-black text-inara-primary">
                     {problemMap[sub.problem_id] ? String.fromCharCode(65 + problems.findIndex(p => p.id === sub.problem_id)) : '?'}
                   </div>
                   <span className="text-sm font-bold text-inara-logic truncate max-w-[150px]">
                     {problemMap[sub.problem_id]?.title || 'Unknown'}
                   </span>
                </div>
              </TableCell>
              <TableCell>
                <Badge variant="outline" className="text-[10px] font-mono font-bold uppercase border-inara-border/20 px-1.5 h-6">
                  {sub.language}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <span className={cn(
                  "inara-badge border-2 min-w-[100px] text-center",
                  getVerdictStyle(sub.verdict)
                )}>
                  {sub.verdict}
                </span>
              </TableCell>
              <TableCell className="text-center">
                <button className="p-1.5 rounded-lg hover:bg-inara-muted text-inara-logic/20 hover:text-inara-logic transition-all">
                  <Eye className="w-4 h-4" />
                </button>
              </TableCell>
            </TableRow>
          ))}
          {submissions.length === 0 && (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-20">
                <div className="flex flex-col items-center gap-2 opacity-10">
                  <Code className="w-10 h-10" />
                  <p className="font-black italic">Awaiting submissions...</p>
                </div>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}
