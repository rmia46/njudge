'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { supabase } from '@/lib/supabase'
import { Loader2, ExternalLink, Save } from 'lucide-react'
import Editor from '@monaco-editor/react'

const LANGUAGE_MAP: Record<string, string> = {
  '54': 'cpp',
  '80': 'cpp',
  '5001': 'cpp',
  '75': 'java',
  '5005': 'java',
  '70': 'python',
  '5055': 'python',
  '81': 'go',
  '5013': 'go'
}

export default function ProblemPage() {
  const params = useParams()
  const contestId = params.contestId as string
  const problemId = params.problemId as string

  const [problem, setProblem] = useState<any>(null)
  const [code, setCode] = useState('')
  const [language, setLanguage] = useState('54') // C++20 by default for CF
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submissions, setSubmissions] = useState<any[]>([])
  const [isSaved, setIsSaved] = useState(true)

  // Load saved code from local storage
  useEffect(() => {
    const savedCode = localStorage.getItem(`njudge_code_${problemId}`)
    if (savedCode) setCode(savedCode)
  }, [problemId])

  // Save code to local storage
  useEffect(() => {
    if (code) {
      localStorage.setItem(`njudge_code_${problemId}`, code)
      setIsSaved(true)
    }
  }, [code, problemId])

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
      .channel(`submissions_changes_${problemId}`)
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'submissions', filter: `problem_id=eq.${problemId}` }, 
        (payload: any) => {
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
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('You must be logged in to submit.')

      // 1. Create submission in Supabase
      const { data: sub, error: subError } = await supabase
        .from('submissions')
        .insert({
          user_id: user.id,
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
    <div className="container py-8 grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-7xl mx-auto">
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
            <div className="flex gap-4 text-sm mb-4">
              <div className="bg-slate-100 px-3 py-1 rounded-full font-medium">Time Limit: 1.0s</div>
              <div className="bg-slate-100 px-3 py-1 rounded-full font-medium">Memory: 256MB</div>
            </div>
            <p className="text-muted-foreground text-sm">
              Use the editor on the right to write and submit your solution. 
              Your code is automatically saved locally.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>My Submissions</CardTitle>
          </CardHeader>
          <CardContent className="px-0">
            <div className="divide-y">
              {submissions.map((sub) => (
                <div key={sub.id} className="flex justify-between items-center p-4 hover:bg-slate-50 transition-colors">
                  <div>
                    <div className="font-mono text-xs text-muted-foreground">{new Date(sub.submitted_at).toLocaleString()}</div>
                    <div className="text-sm font-semibold mt-1">
                      {sub.language === '54' || sub.language === '80' ? 'C++' : 
                       sub.language === '70' ? 'Python' : 
                       sub.language === '75' ? 'Java' : sub.language}
                    </div>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-xs font-bold ${
                    sub.verdict === 'OK' || sub.verdict === 'Accepted' ? 'bg-emerald-100 text-emerald-700' : 
                    sub.verdict === 'In Queue' || sub.verdict === 'Judging' ? 'bg-blue-100 text-blue-700 animate-pulse' :
                    'bg-rose-100 text-rose-700'
                  }`}>
                    {sub.verdict}
                  </div>
                </div>
              ))}
              {submissions.length === 0 && <div className="text-center text-muted-foreground py-12">No submissions yet</div>}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Right: Code Editor */}
      <Card className="h-fit overflow-hidden border-2">
        <CardHeader className="bg-slate-50 border-b py-3">
          <div className="flex justify-between items-center">
            <div className="flex gap-4">
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger className="w-[180px] h-9">
                  <SelectValue placeholder="Language" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="54">C++20 (GCC 11-64) - CF</SelectItem>
                  <SelectItem value="80">C++23 (GCC 13-64) - CF</SelectItem>
                  <SelectItem value="5001">C++23 (GCC 12.2) - AC</SelectItem>
                  <SelectItem value="75">Java 21 - CF</SelectItem>
                  <SelectItem value="5005">Java 21 (OpenJDK) - AC</SelectItem>
                  <SelectItem value="70">Python 3.11 - CF</SelectItem>
                  <SelectItem value="5055">Python 3.11.4 - AC</SelectItem>
                  <SelectItem value="81">Go 1.22 - CF</SelectItem>
                  <SelectItem value="5013">Go 1.20.6 - AC</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              {isSaved ? <span className="flex items-center gap-1"><Save className="w-3 h-3" /> Saved</span> : 'Saving...'}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Editor
            height="600px"
            defaultLanguage="cpp"
            language={LANGUAGE_MAP[language]}
            theme="vs-dark"
            value={code}
            onChange={(val) => {
              setCode(val || '')
              setIsSaved(false)
            }}
            options={{
              minimap: { enabled: false },
              fontSize: 14,
              padding: { top: 16, bottom: 16 },
              scrollBeyondLastLine: false,
              automaticLayout: true,
            }}
          />
        </CardContent>
        <CardFooter className="bg-slate-50 border-t py-3">
          <Button 
            className="w-full bg-emerald-600 hover:bg-emerald-700 h-11" 
            onClick={handleSubmit}
            disabled={isSubmitting || !code}
          >
            {isSubmitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Submitting to {problem.oj}...</> : 'Submit Solution'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
