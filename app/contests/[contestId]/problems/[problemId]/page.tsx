'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { supabase } from '@/lib/supabase'
import { Loader2, ExternalLink, Save, Play, Send, History, FileText, ChevronRight } from 'lucide-react'
import Editor from '@monaco-editor/react'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'

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
  
  // Custom Test state
  const [customInput, setCustomInput] = useState('')
  const [customResult, setCustomResult] = useState<{output: string, time: string, memory: string} | null>(null)
  const [isTesting, setIsTesting] = useState(false)

  // Load saved code from local storage
  useEffect(() => {
    const savedCode = localStorage.getItem(`njudge_code_${problemId}`)
    if (savedCode) setCode(savedCode)
  }, [problemId])

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.source !== window) return
      if (event.data && event.data.type === 'NJUDGE_CUSTOM_TEST_RESPONSE') {
        const { status, data, message } = event.data.payload
        if (status === 'success') {
          setCustomResult(data)
        } else {
          alert(`Test failed: ${message}`)
        }
        setIsTesting(false)
      }
    }
    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [])

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
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: subs } = await supabase
          .from('submissions')
          .select('*')
          .eq('problem_id', problemId)
          .eq('user_id', user.id)
          .order('submitted_at', { ascending: false })
        setSubmissions(subs || [])
      }
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

  const handleCustomTest = async () => {
    setIsTesting(true)
    setCustomResult(null)
    window.postMessage({
      type: 'NJUDGE_CUSTOM_TEST',
      payload: {
        oj: problem.oj,
        code,
        languageId: language,
        input: customInput
      }
    }, '*')
  }

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

  if (!problem) return <div className="flex justify-center p-24"><Loader2 className="animate-spin text-primary" /></div>

  return (
    <div className="container py-8 grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-7xl mx-auto px-4">
      {/* Left: Problem Details & Custom Test */}
      <div className="space-y-6 overflow-hidden">
        <Tabs defaultValue="statement" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="statement" className="gap-2"><FileText className="w-4 h-4" /> Problem</TabsTrigger>
            <TabsTrigger value="custom" className="gap-2"><Play className="w-4 h-4" /> Custom Test</TabsTrigger>
            <TabsTrigger value="submissions" className="gap-2"><History className="w-4 h-4" /> History</TabsTrigger>
          </TabsList>
          
          <TabsContent value="statement" className="space-y-4">
            <Card className="border-2">
              <CardHeader className="pb-4">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-3xl font-bold text-primary">{problem.title}</CardTitle>
                    <CardDescription className="flex items-center gap-2 mt-1">
                      <Badge variant="secondary" className="font-mono">{problem.oj}</Badge>
                      <span className="font-medium text-muted-foreground">{problem.external_id}</span>
                    </CardDescription>
                  </div>
                  <Button variant="outline" size="sm" asChild className="h-8">
                    <a href={problem.problem_url} target="_blank" rel="noopener noreferrer">
                      Original <ExternalLink className="w-3 h-3 ml-2" />
                    </a>
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex gap-4">
                  <div className="bg-muted px-3 py-1.5 rounded-lg text-xs font-bold border">TIME: 1.0s</div>
                  <div className="bg-muted px-3 py-1.5 rounded-lg text-xs font-bold border">MEM: 256MB</div>
                </div>
                <div className="prose prose-slate dark:prose-invert max-w-none">
                  <p className="text-muted-foreground leading-relaxed italic">
                    Problem statement is available on the original platform. Click the "Original" button to read the full description, examples, and constraints.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="custom" className="space-y-4">
            <Card className="border-2">
              <CardHeader>
                <CardTitle className="text-xl">Custom Test</CardTitle>
                <CardDescription>Run your code against custom input on the judge's server.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Input</Label>
                  <Textarea 
                    placeholder="Enter your test input here..." 
                    className="font-mono text-sm min-h-[120px]"
                    value={customInput}
                    onChange={(e) => setCustomInput(e.target.value)}
                  />
                </div>
                
                {customResult && (
                  <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="flex justify-between items-end">
                      <Label className="text-primary font-bold">Output</Label>
                      <div className="flex gap-3 text-[10px] font-mono text-muted-foreground">
                        <span>Time: {customResult.time} ms</span>
                        <span>Memory: {customResult.memory} KB</span>
                      </div>
                    </div>
                    <div className="bg-slate-950 text-slate-100 p-4 rounded-lg font-mono text-sm whitespace-pre-wrap border border-slate-800">
                      {customResult.output}
                    </div>
                  </div>
                )}
                
                {!customResult && !isTesting && (
                  <div className="py-12 text-center border-2 border-dashed rounded-xl bg-slate-50/50">
                    <Play className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">Results will appear here after running.</p>
                  </div>
                )}

                {isTesting && (
                  <div className="py-12 text-center border-2 border-dashed rounded-xl bg-slate-50/50">
                    <Loader2 className="w-8 h-8 text-primary mx-auto mb-2 animate-spin" />
                    <p className="text-sm text-primary font-medium">Executing on {problem.oj} servers...</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="submissions" className="space-y-4">
            <Card className="border-2">
              <CardHeader>
                <CardTitle>My Submissions</CardTitle>
              </CardHeader>
              <CardContent className="px-0">
                <div className="divide-y">
                  {submissions.map((sub) => (
                    <div key={sub.id} className="flex justify-between items-center p-4 hover:bg-muted/50 transition-colors group">
                      <div>
                        <div className="font-mono text-[10px] text-muted-foreground flex items-center gap-2">
                          <History className="w-3 h-3" />
                          {new Date(sub.submitted_at).toLocaleString()}
                        </div>
                        <div className="text-sm font-semibold mt-1">
                          {sub.language === '54' || sub.language === '80' ? 'C++' : 
                           sub.language === '70' ? 'Python' : 
                           sub.language === '75' ? 'Java' : sub.language}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          sub.verdict === 'OK' || sub.verdict === 'Accepted' ? 'bg-verdict-ac' : 
                          sub.verdict === 'In Queue' || sub.verdict === 'Judging' ? 'bg-verdict-judging animate-pulse' :
                          'bg-verdict-wa'
                        }`}>
                          {sub.verdict}
                        </Badge>
                        <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </div>
                  ))}
                  {submissions.length === 0 && <div className="text-center text-muted-foreground py-16">No submissions yet</div>}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Right: Code Editor */}
      <Card className="h-fit overflow-hidden border-2 flex flex-col">
        <CardHeader className="bg-muted/30 border-b py-3">
          <div className="flex justify-between items-center">
            <div className="flex gap-4">
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger className="w-[180px] h-9 text-xs">
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
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                {isSaved ? <Save className="w-3 h-3 text-emerald-500" /> : <Loader2 className="w-3 h-3 animate-spin" />}
                {isSaved ? 'Saved' : 'Saving...'}
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0 bg-[#1e1e1e]">
          <Editor
            height="550px"
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
              fontFamily: 'JetBrains Mono, Menlo, Monaco, Courier New, monospace',
            }}
          />
        </CardContent>
        <CardFooter className="bg-muted/30 border-t py-4 grid grid-cols-2 gap-4">
          <Button 
            variant="outline" 
            className="h-11 font-bold" 
            onClick={handleCustomTest}
            disabled={isTesting || !code}
          >
            {isTesting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Running...</> : <><Play className="w-4 h-4 mr-2" /> Run Test</>}
          </Button>
          <Button 
            className="bg-primary hover:bg-primary/90 h-11 font-bold shadow-lg" 
            onClick={handleSubmit}
            disabled={isSubmitting || !code}
          >
            {isSubmitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Submitting...</> : <><Send className="w-4 h-4 mr-2" /> Submit Code</>}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
