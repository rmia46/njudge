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
import { Loader2, ExternalLink, Clock } from 'lucide-react'

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

  if (isLoading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin" /></div>

  return (
    <div className="rounded-md border bg-white overflow-hidden">
      <Table>
        <TableHeader className="bg-slate-50">
          <TableRow>
            <TableHead className="w-20">ID</TableHead>
            <TableHead>Time</TableHead>
            <TableHead>User</TableHead>
            <TableHead>Problem</TableHead>
            <TableHead>Language</TableHead>
            <TableHead className="text-right">Verdict</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {submissions.map((sub) => (
            <TableRow key={sub.id}>
              <TableCell className="font-mono text-xs text-slate-400">
                {sub.id.slice(0, 8)}
              </TableCell>
              <TableCell className="whitespace-nowrap text-xs">
                <div className="flex items-center gap-1 text-slate-500">
                  <Clock className="w-3 h-3" />
                  {new Date(sub.submitted_at).toLocaleTimeString()}
                </div>
              </TableCell>
              <TableCell className="font-medium">
                {sub.profiles?.cf_handle || 'Anonymous'}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                   <span className="font-bold text-emerald-700">
                     {problemMap[sub.problem_id] ? String.fromCharCode(65 + problems.findIndex(p => p.id === sub.problem_id)) : '?'}
                   </span>
                   <span className="text-sm truncate max-w-[150px]">
                     {problemMap[sub.problem_id]?.title || 'Unknown'}
                   </span>
                </div>
              </TableCell>
              <TableCell className="text-xs text-slate-600">
                {sub.language === '54' || sub.language === '80' || sub.language === '5001' ? 'C++' : 
                 sub.language === '70' || sub.language === '5055' ? 'Python' : 
                 sub.language === '75' || sub.language === '5005' ? 'Java' : sub.language}
              </TableCell>
              <TableCell className="text-right">
                <span className={`px-2 py-1 rounded text-xs font-bold ${
                  sub.verdict === 'OK' || sub.verdict === 'Accepted' ? 'bg-emerald-100 text-emerald-700' : 
                  sub.verdict === 'In Queue' || sub.verdict === 'Judging' ? 'bg-blue-100 text-blue-700 animate-pulse' :
                  'bg-rose-100 text-rose-700'
                }`}>
                  {sub.verdict}
                </span>
              </TableCell>
            </TableRow>
          ))}
          {submissions.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                No submissions yet.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}
