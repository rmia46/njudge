'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'
import { Loader2, ArrowRight, PlayCircle } from 'lucide-react'

export default function ContestView() {
  const params = useParams()
  const router = useRouter()
  const contestId = params.contestId as string
  
  const [contest, setContest] = useState<any>(null)
  const [problems, setProblems] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
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

      setContest(contestData)
      setProblems(problemsData || [])
      setIsLoading(false)
    }
    fetchData()
  }, [contestId])

  if (isLoading) return <div className="flex justify-center p-24"><Loader2 className="animate-spin" /></div>
  if (!contest) return <div className="text-center p-24">Contest not found.</div>

  return (
    <main className="container max-w-5xl py-12 space-y-8">
      <div className="flex justify-between items-end border-b pb-8 border-emerald-100">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-emerald-900">{contest.title}</h1>
          <p className="text-muted-foreground mt-2">{contest.description || 'Practice Contest'}</p>
        </div>
        <div className="text-right text-sm">
          <div className="font-semibold text-emerald-600">Duration: {contest.duration_minutes} minutes</div>
          <div className="text-muted-foreground">Starts: {new Date(contest.start_time).toLocaleString()}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {problems.map((prob, index) => (
          <Card key={prob.id} className="hover:border-emerald-300 transition-colors group">
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
    </main>
  )
}
