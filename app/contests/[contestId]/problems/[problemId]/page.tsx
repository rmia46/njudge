'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { supabase } from '@/lib/supabase'
import { Loader2, ExternalLink, Send, History, FileText, Code2, Upload } from 'lucide-react'
import Editor from '@monaco-editor/react'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { ProblemStatement } from '@/components/problem-statement'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

const EXTENSION_MAP: Record<string, string[]> = {
  'cpp': ['.cpp', '.cc', '.cxx', '.c++'],
  'java': ['.java'],
  'python': ['.py'],
  'go': ['.go']
}

export default function ProblemPage() {
  const params = useParams()
  const contestId = params.contestId as string
  const problemId = params.problemId as string
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [problem, setProblem] = useState<any>(null)
  const [code, setCode] = useState('')
  const [language, setLanguage] = useState('')
  const [languages, setLanguages] = useState<any[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submissions, setSubmissions] = useState<any[]>([])
  const [isSaved, setIsSaved] = useState(true)

  useEffect(() => {
    const savedCode = localStorage.getItem(`njudge_code_${problemId}`)
    if (savedCode) setCode(savedCode)
  }, [problemId])

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.source !== window) return
      
      if (event.data?.type === 'NJUDGE_GET_LANGUAGES_RESPONSE') {
        const { payload } = event.data;
        if (payload.status === 'success') {
          setLanguages(payload.data)
          if (payload.data.length > 0 && !language) {
            // Try to restore previous language for this OJ from localstorage
            const savedLang = localStorage.getItem(`njudge_lang_${problem?.oj || 'default'}`)
            if (savedLang && payload.data.find((l: any) => l.id === savedLang)) {
              setLanguage(savedLang)
            } else {
              setLanguage(payload.data[0].id)
            }
          }
        } else {
          toast.error(`Could not fetch languages: ${payload.message}`)
        }
      }
    }
    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [language, problem?.oj])

  useEffect(() => {
    if (language) {
      localStorage.setItem(`njudge_lang_${problem?.oj || 'default'}`, language)
    }
  }, [language, problem?.oj])

  useEffect(() => {
    if (code) {
      localStorage.setItem(`njudge_code_${problemId}`, code)
      setIsSaved(true)
    }
  }, [code, problemId])

  useEffect(() => {
    async function fetchData() {
      const { data: prob } = await supabase.from('problems').select('*').eq('id', problemId).single()
      setProblem(prob)

      if (prob) {
        window.postMessage({ type: 'NJUDGE_GET_LANGUAGES', payload: { oj: prob.oj } }, '*')
      }

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
          
          if (payload.new && payload.new.verdict !== 'In Queue' && payload.new.verdict !== 'Judging') {
            const isAC = payload.new.verdict === 'OK' || payload.new.verdict === 'Accepted'
            if (isAC) {
              toast.success(`Problem Solved! Verdict: ${payload.new.verdict}`)
            } else {
              toast.error(`Submission Result: ${payload.new.verdict}`)
            }
          }
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [problemId])

  const getEditorLanguage = (langId: string) => {
    const name = languages.find(l => l.id === langId)?.name?.toLowerCase() || ''
    if (name.includes('c++')) return 'cpp'
    if (name.includes('python')) return 'python'
    if (name.includes('java')) return 'java'
    if (name.includes('go')) return 'go'
    if (name.includes('c#')) return 'csharp'
    if (name.includes('rust')) return 'rust'
    return 'cpp'
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 256 * 1024) {
      toast.error("File is too large. Max size is 256KB.")
      return
    }

    const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase()
    const editorLang = getEditorLanguage(language)
    const allowedExtensions = EXTENSION_MAP[editorLang] || []
    
    if (allowedExtensions.length > 0 && !allowedExtensions.includes(ext)) {
      toast.error(`Invalid file extension ${ext}. Expected ${allowedExtensions.join(' or ')} for the selected language.`)
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      const content = event.target?.result as string
      setCode(content)
      setIsSaved(false)
      toast.success(`File ${file.name} uploaded successfully!`)
    }
    reader.onerror = () => {
      toast.error("Failed to read the file.")
    }
    reader.readAsText(file)
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    const submissionToast = toast.loading('Sending submission to judge...')
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Please sign in to submit code.')

      const { data: sub, error: subError } = await supabase
        .from('submissions')
        .insert({ user_id: user.id, contest_id: contestId, problem_id: problemId, code, language, verdict: 'In Queue' })
        .select().single()

      if (subError) throw subError

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
            key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
            accessToken: session?.access_token
          }
        }
      }, '*')
      
      toast.success('Submission received by Bridge', { id: submissionToast })
    } catch (error: any) {
      toast.error(error.message, { id: submissionToast })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!problem) return <div className="flex justify-center p-24 text-inara-primary"><Loader2 className="animate-spin" /></div>

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 space-y-8">
      {/* 1. Static Problem Header */}
      <header className="space-y-4">
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <Badge className="inara-badge border-inara-primary text-inara-primary">{problem.oj}</Badge>
              <span className="font-mono text-inara-logic opacity-40 font-bold tracking-tighter">{problem.external_id}</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight text-inara-logic">{problem.title}</h1>
          </div>
          <Button variant="outline" className="inara-btn bg-white border-inara-border h-10 px-4 text-xs" asChild>
            <a href={problem.problem_url} target="_blank" rel="noopener noreferrer">
              Original <ExternalLink className="w-3.5 h-3.5 ml-2" />
            </a>
          </Button>
        </div>
      </header>

      {/* 2. Main Tabbed Layout */}
      <Tabs defaultValue="statement" className="w-full">
        <TabsList className="bg-inara-muted/20 p-1 border-2 border-inara-border rounded-xl mb-6">
          <TabsTrigger value="statement" className="gap-2 px-6 font-bold text-sm"><FileText className="w-4 h-4" /> Description</TabsTrigger>
          <TabsTrigger value="editor" className="gap-2 px-6 font-bold text-sm"><Code2 className="w-4 h-4" /> Submit Code</TabsTrigger>
          <TabsTrigger value="history" className="gap-2 px-6 font-bold text-sm"><History className="w-4 h-4" /> Submission Log</TabsTrigger>
        </TabsList>

        <TabsContent value="statement" className="focus-visible:outline-none min-h-[400px]">
          {problem.statement_html ? (
            <ProblemStatement 
              html={problem.statement_html} 
              oj={problem.oj} 
              timeLimit={problem.time_limit}
              memoryLimit={problem.memory_limit}
            />
          ) : (
            <div className="inara-block p-20 text-center italic opacity-40">No description available for this problem.</div>
          )}
        </TabsContent>

        <TabsContent value="editor" className="focus-visible:outline-none">
          <Card className="inara-block overflow-hidden border-0 bg-transparent shadow-none">
            <div className="bg-inara-logic text-white p-4 border-b-2 border-inara-border flex justify-between items-center rounded-t-lg">
              <div className="flex gap-4">
                <Select value={language} onValueChange={setLanguage}>
                  <SelectTrigger className="w-[300px] h-9 bg-white/10 border-white/20 text-white font-bold text-xs hover:bg-white/20">
                    <SelectValue placeholder="Select Language" />
                  </SelectTrigger>
                  <SelectContent>
                    {languages.map(lang => (
                      <SelectItem key={lang.id} value={lang.id}>{lang.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-3">
                <span className={cn("text-[10px] font-mono flex items-center gap-1.5", isSaved ? "text-inara-primary" : "text-white/40")}>
                  <div className={cn("w-1.5 h-1.5 rounded-full", isSaved ? "bg-inara-primary shadow-[0_0_8px_oklch(var(--inara-primary))]" : "bg-white/20")} />
                  {isSaved ? 'CODE SAVED' : 'SAVING...'}
                </span>
              </div>
            </div>
            <div className="border-x-[3px] border-inara-border bg-[#1e1e1e]">
              <Editor
                height="600px"
                defaultLanguage="cpp"
                language={getEditorLanguage(language)}
                theme="vs-dark"
                value={code}
                onChange={(val) => {
                  setCode(val || '')
                  setIsSaved(false)
                }}
                options={{
                  minimap: { enabled: false },
                  fontSize: 15,
                  padding: { top: 20, bottom: 20 },
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                  fontFamily: 'JetBrains Mono',
                }}
              />
            </div>
            <CardFooter className="bg-white border-[3px] border-t-0 border-inara-border py-6 flex justify-end gap-4 rounded-b-lg">
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                onChange={handleFileUpload}
                accept={EXTENSION_MAP[getEditorLanguage(language)]?.join(',')}
              />
              <Button 
                variant="outline" 
                className="inara-btn h-12 px-8 font-black text-inara-logic border-inara-border hover:bg-inara-muted" 
                onClick={() => fileInputRef.current?.click()}
                disabled={isSubmitting}
              >
                <Upload className="w-4 h-4 mr-2" /> UPLOAD FILE
              </Button>
              <Button 
                className="inara-btn inara-btn-primary h-12 px-10 font-black" 
                onClick={handleSubmit}
                disabled={isSubmitting || !code}
              >
                {isSubmitting ? <Loader2 className="animate-spin" /> : <><Send className="w-4 h-4 mr-2" /> SUBMIT TO JUDGE</>}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="focus-visible:outline-none">
          <div className="inara-block overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead className="bg-inara-muted/30 border-b-2 border-inara-border">
                <tr>
                  <th className="p-4 text-[10px] font-black uppercase text-inara-logic/40">Timestamp</th>
                  <th className="p-4 text-[10px] font-black uppercase text-inara-logic/40">Language</th>
                  <th className="p-4 text-[10px] font-black uppercase text-inara-logic/40 text-right">Verdict</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-inara-border/10">
                {submissions.map((sub) => (
                  <tr key={sub.id} className="hover:bg-inara-primary/5 transition-colors group">
                    <td className="p-4 font-mono text-xs text-inara-logic/60">{new Date(sub.submitted_at).toLocaleString()}</td>
                    <td className="p-4">
                      <Badge variant="outline" className="border-inara-border/20 text-[10px] font-bold uppercase">{sub.language}</Badge>
                    </td>
                    <td className="p-4 text-right">
                      <span className={cn(
                        "inara-badge border-current",
                        sub.verdict === 'OK' || sub.verdict === 'Accepted' ? 'text-inara-ac' : 
                        sub.verdict === 'In Queue' || sub.verdict === 'Judging' ? 'text-amber-500 animate-pulse' : 'text-inara-wa'
                      )}>
                        {sub.verdict}
                      </span>
                    </td>
                  </tr>
                ))}
                {submissions.length === 0 && (
                  <tr>
                    <td colSpan={3} className="py-20 text-center opacity-30 font-bold italic text-sm">No submissions found for this problem.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
