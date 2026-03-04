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
    if (verdict === 'OK' || verdict === 'Accepted') return 'bg-verdict-ac text-verdict-ac-foreground shadow-sm shadow-emerald-500/20'
    if (verdict === 'In Queue' || verdict === 'Judging') return 'bg-verdict-judging text-verdict-judging-foreground animate-pulse'
    if (verdict === 'Wrong Answer') return 'bg-verdict-wa text-verdict-wa-foreground'
    if (verdict === 'Time Limit Exceeded') return 'bg-verdict-tle text-verdict-tle-foreground'
    if (verdict === 'Runtime Error') return 'bg-verdict-re text-verdict-re-foreground'
    return 'bg-verdict-ce text-verdict-ce-foreground'
  }

  return (
    <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
      <Table>
        <TableHeader className="bg-muted/50">
          <TableRow className="hover:bg-transparent">
            <TableHead className="w-24 text-center font-bold">ID</TableHead>
            <TableHead className="font-bold">Time</TableHead>
            <TableHead className="font-bold">User</TableHead>
            <TableHead className="font-bold">Problem</TableHead>
            <TableHead className="font-bold">Language</TableHead>
            <TableHead className="text-right font-bold">Verdict</TableHead>
            <TableHead className="w-16"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {submissions.map((sub) => (
            <TableRow key={sub.id} className="hover:bg-muted/30 transition-colors group">
              <TableCell className="font-mono text-[11px] text-muted-foreground text-center">
                #{sub.id.slice(0, 8)}
              </TableCell>
              <TableCell className="whitespace-nowrap">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Clock className="w-3 h-3" />
                  {new Date(sub.submitted_at).toLocaleTimeString()}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center">
                    <UserIcon className="w-3 h-3 text-slate-500" />
                  </div>
                  <span className="font-medium text-sm">{sub.profiles?.cf_handle || 'Anonymous'}</span>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                   <Badge variant="outline" className="font-bold border-emerald-200 text-emerald-700 bg-emerald-50 px-1.5 h-6">
                     {problemMap[sub.problem_id] ? String.fromCharCode(65 + problems.findIndex(p => p.id === sub.problem_id)) : '?'}
                   </Badge>
                   <span className="text-sm truncate max-w-[150px] group-hover:underline cursor-pointer">
                     {problemMap[sub.problem_id]?.title || 'Unknown'}
                   </span>
                </div>
              </TableCell>
              <TableCell>
                <Badge variant="secondary" className="text-[10px] font-mono font-normal tracking-tight px-1.5 h-6">
                  {sub.language === '54' || sub.language === '80' || sub.language === '5001' ? 'C++20' : 
                   sub.language === '70' || sub.language === '5055' ? 'Python 3' : 
                   sub.language === '75' || sub.language === '5005' ? 'Java 21' : sub.language}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <span className={`px-3 py-1 rounded-full text-[11px] font-bold inline-block min-w-[100px] text-center ${getVerdictStyle(sub.verdict)}`}>
                  {sub.verdict}
                </span>
              </TableCell>
              <TableCell className="text-center opacity-0 group-hover:opacity-100 transition-opacity">
                <button className="p-1.5 rounded-full hover:bg-muted text-muted-foreground hover:text-primary transition-colors">
                  <Eye className="w-4 h-4" />
                </button>
              </TableCell>
            </TableRow>
          ))}
          {submissions.length === 0 && (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-20 text-muted-foreground">
                <div className="flex flex-col items-center gap-2 opacity-30">
                  <Code className="w-10 h-10" />
                  <p>Wait for participants to code!</p>
                </div>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}
