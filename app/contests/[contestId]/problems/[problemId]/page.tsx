'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { supabase } from '@/lib/supabase'
import { Loader2, ExternalLink } from 'lucide-react'

export default function ProblemPage() {
  const params = useParams()
  const contestId = params.contestId as string
  const problemId = params.problemId as string

  const [problem, setProblem] = useState<any>(null)
  const [code, setCode] = useState('')
  const [language, setLanguage] = useState('54') // C++20 by default for CF
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submissions, setSubmissions] = useState<any[]>([])

  useEffect(() => {
    async function fetchData() {
      // Get Problem details
      const { data: prob } = await supabase
        .from('problems')
        .select('*')
        .eq('id', problemId)
        .single()
      setProblem(prob)

      // Get Submissions
      const { data: subs } = await supabase
        .from('submissions')
        .select('*')
        .eq('problem_id', problemId)
        .order('submitted_at', { ascending: false })
      setSubmissions(subs || [])
    }
    fetchData()

    // Real-time updates for submissions
    const channel = supabase
      .channel('submissions_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'submissions', filter: `problem_id=eq.${problemId}` }, 
        (payload) => {
          setSubmissions(current => {
            const index = current.findIndex(s => s.id === payload.new.id)
            if (index !== -1) {
              const updated = [...current]
              updated[index] = payload.new
              return updated
            }
            return [payload.new, ...current]
          })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [problemId])

  const handleSubmit = async () => {
    setIsSubmitting(true)
    try {
      // 1. Create submission in Supabase
      const { data: sub, error: subError } = await supabase
        .from('submissions')
        .insert({
          contest_id: contestId,
          problem_id: problemId,
          code,
          language,
          verdict: 'In Queue'
        })
        .select()
        .single()

      if (subError) throw subError

      // 2. Send to Extension
      window.postMessage({
        type: 'NJUDGE_SUBMIT',
        payload: {
          oj: problem.oj,
          problemId: problem.external_id,
          code,
          languageId: language,
          submissionId: sub.id,
          supabaseConfig: {
            url: process.env.NEXT_PUBLIC_SUPABASE_URL,
            key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
          }
        }
      }, '*')

    } catch (error: any) {
      alert(error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!problem) return <div className="flex justify-center p-24"><Loader2 className="animate-spin" /></div>

  return (
    <div className="container py-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Left: Problem Details & Submissions */}
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-3xl font-bold">{problem.title}</CardTitle>
                <CardDescription>{problem.oj} - {problem.external_id}</CardDescription>
              </div>
              <Button variant="outline" size="sm" asChild>
                <a href={problem.problem_url} target="_blank" rel="noopener noreferrer">
                  Original <ExternalLink className="w-4 h-4 ml-2" />
                </a>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground italic text-sm">
              Write your code on the right and submit. The nJudge extension will bridge your submission to {problem.oj}.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Submissions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {submissions.map((sub) => (
                <div key={sub.id} className="flex justify-between items-center p-3 border rounded-md">
                  <div>
                    <div className="font-mono text-xs text-muted-foreground">{new Date(sub.submitted_at).toLocaleString()}</div>
                    <div className="text-sm font-semibold">{sub.language === '54' ? 'C++20' : sub.language}</div>
                  </div>
                  <div className={`px-2 py-1 rounded text-xs font-bold ${
                    sub.verdict === 'OK' || sub.verdict === 'Accepted' ? 'bg-emerald-100 text-emerald-700' : 
                    sub.verdict === 'In Queue' || sub.verdict === 'Judging' ? 'bg-blue-100 text-blue-700 animate-pulse' :
                    'bg-rose-100 text-rose-700'
                  }`}>
                    {sub.verdict}
                  </div>
                </div>
              ))}
              {submissions.length === 0 && <div className="text-center text-muted-foreground py-8">No submissions yet</div>}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Right: Code Editor */}
      <Card className="h-fit">
        <CardHeader>
          <CardTitle>Submit Solution</CardTitle>
          <div className="flex gap-4 mt-2">
            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Language" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="54">C++20 (GCC 11-64)</SelectItem>
                <SelectItem value="80">C++23 (GCC 13-64)</SelectItem>
                <SelectItem value="75">Java 21</SelectItem>
                <SelectItem value="70">Python 3.11</SelectItem>
                <SelectItem value="81">Go 1.22</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <Textarea 
            className="font-mono min-h-[500px] bg-slate-900 text-slate-50 p-4"
            placeholder="// Paste your code here..."
            value={code}
            onChange={(e) => setCode(e.target.value)}
          />
        </CardContent>
        <CardFooter>
          <Button 
            className="w-full bg-emerald-600 hover:bg-emerald-700" 
            size="lg"
            onClick={handleSubmit}
            disabled={isSubmitting || !code}
          >
            {isSubmitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Submitting...</> : 'Submit Code'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
