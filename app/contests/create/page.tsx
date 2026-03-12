'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { Trash2, Plus, Loader2, Search, Settings, Lock, Unlock, Trophy, CalendarIcon, Clock } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface ProblemInput {
  oj: 'CF' | 'AC'
  external_id: string
  title: string
  url: string
  statementHtml?: string
  timeLimit?: string
  memoryLimit?: string
}

export default function CreateContest() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [isAuthLoading, setIsAuthLoading] = useState(true)

  // Auth Check & Protection
  useEffect(() => {
    async function checkUser() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast.error("Sign in to organize a contest")
        router.push('/login')
      } else {
        setUser(user)
      }
      setIsAuthLoading(false)
    }
    checkUser()
  }, [router])

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [startDate, setStartDate] = useState<Date | undefined>(new Date())
  const [startTimeStr, setStartTimeStr] = useState('12:00')
  const [duration, setDuration] = useState('120')
  const [isPrivate, setIsPrivate] = useState(false)
  const [password, setPassword] = useState('')
  const [rankingRule, setRankingRule] = useState<'ICPC' | 'AtCoder' | 'IOI'>('ICPC')
  const [problems, setProblems] = useState<ProblemInput[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [scrapingIndex, setScrapingIndex] = useState<number | null>(null)
  const [scrapedIds, setScrapedIds] = useState<Record<number, string>>({})

  // Auto-scrape logic
  useEffect(() => {
    if (scrapingIndex !== null) return;
    const targetIndex = problems.findIndex((prob, index) => {
      if (!prob.external_id || prob.title || scrapedIds[index] === prob.external_id) return false;
      const isCF = prob.oj === 'CF' && /^\d+[A-Z]\d*$/.test(prob.external_id);
      const isAC = prob.oj === 'AC' && /^[a-z0-9]+_[a-z0-9]+$/.test(prob.external_id);
      return isCF || isAC;
    });

    if (targetIndex !== -1) {
      setScrapedIds(prev => ({ ...prev, [targetIndex]: problems[targetIndex].external_id }));
      setScrapingIndex(targetIndex)
      window.postMessage({
        type: 'NJUDGE_SCRAPE_PROBLEM',
        payload: { oj: problems[targetIndex].oj, id: problems[targetIndex].external_id },
        requestId: targetIndex.toString()
      }, '*')
    }
  }, [problems, scrapingIndex, scrapedIds])

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.source !== window || event.data?.type !== 'NJUDGE_SCRAPE_PROBLEM_RESPONSE') return
      const { payload, requestId } = event.data;
      if (!payload) return;
      const { status, data, message } = payload;
      const index = parseInt(requestId)
      
      if (status === 'success' && !isNaN(index)) {
        setProblems(prev => {
          const next = [...prev];
          if (next[index]) {
            next[index] = { ...next[index], title: data.title, url: data.url, statementHtml: data.statementHtml, timeLimit: data.timeLimit, memoryLimit: data.memoryLimit };
          }
          return next;
        });
        toast.success(`Fetched: ${data.title}`);
      } else if (status === 'error' && !isNaN(index)) {
        setProblems(prev => {
          const next = [...prev];
          if (next[index]) next[index] = { ...next[index], title: 'Problem Not Found', url: '' };
          return next;
        });
        toast.error(`Problem not found on ${problems[index]?.oj}`);
      }
      setScrapingIndex(null);
    }
    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [problems])

  const addProblem = () => {
    setProblems([...problems, { oj: 'CF', external_id: '', title: '', url: '' }])
  }

  const removeProblem = (index: number) => {
    setProblems(problems.filter((_, i) => i !== index))
    const newScraped = { ...scrapedIds }; delete newScraped[index]; setScrapedIds(newScraped);
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) { toast.error("User session lost. Please login."); return; }

    // 1. Title validation
    if (!title.trim()) { toast.error("Contest title is required"); return; }

    // 2. Date validation (Sync with system time)
    if (!startDate) { toast.error("Please select a start date"); return; }
    const combinedDateTime = new Date(startDate)
    const [hours, minutes] = startTimeStr.split(':').map(Number)
    combinedDateTime.setHours(hours, minutes, 0, 0)

    if (combinedDateTime <= new Date()) {
      toast.error("Start time must be in the future. Check your system clock.");
      return;
    }

    // 3. Problem count validation
    if (problems.length === 0) {
      toast.error("Add at least one problem to host a contest.");
      return;
    }

    // 4. Problem validity validation
    const hasInvalid = problems.some(p => !p.title || p.title === 'Problem Not Found' || !p.external_id);
    if (hasInvalid) {
      toast.error("One or more problems are invalid. Check IDs.");
      return;
    }

    setIsSubmitting(true)
    try {
      const { data: contest, error: contestError } = await supabase
        .from('contests')
        .insert({
          title, description, start_time: combinedDateTime.toISOString(),
          duration_minutes: parseInt(duration), owner_id: user.id,
          is_private: isPrivate, password: isPrivate ? password : null, ranking_rule: rankingRule
        })
        .select().single()

      if (contestError) throw contestError

      const problemsToInsert = problems.map(p => ({
        contest_id: contest.id, oj: p.oj, external_id: p.external_id, title: p.title,
        problem_url: p.url, statement_html: p.statementHtml, time_limit: p.timeLimit, memory_limit: p.memoryLimit
      }))

      const { error: problemsError } = await supabase.from('problems').insert(problemsToInsert)
      if (problemsError) throw problemsError

      toast.success("Contest launched successfully!")
      router.push(`/contests/${contest.id}`)
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isAuthLoading) return <div className="flex justify-center p-24 text-inara-primary"><Loader2 className="animate-spin" /></div>

  return (
    <main className="max-w-7xl mx-auto py-12 px-4 w-full">
      <div className="mb-10 space-y-2 border-b-4 border-inara-border pb-8">
        <h1 className="text-5xl font-black tracking-tight text-inara-logic uppercase leading-none">New Challenge</h1>
        <p className="text-inara-logic/60 font-medium italic">Configure your arena rules and problem set.</p>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-10">
          <Card className="inara-block border-0 bg-transparent shadow-none">
            <CardHeader className="bg-inara-muted/30 border-2 border-inara-border rounded-t-xl py-4">
              <CardTitle className="flex items-center gap-2 text-xl font-black text-inara-logic uppercase">
                <Settings className="w-5 h-5 text-inara-primary" /> Core Information
              </CardTitle>
            </CardHeader>
            <CardContent className="bg-white border-2 border-t-0 border-inara-border rounded-b-xl space-y-8 p-8">
              <div className="space-y-2">
                <Label htmlFor="title" className="text-[10px] font-black uppercase tracking-widest opacity-40">Contest Title</Label>
                <Input 
                  id="title" value={title} onChange={e => setTitle(e.target.value)} required 
                  placeholder="e.g., Weekly Roundup #42" 
                  className="text-xl h-14 border-2 font-bold focus-visible:ring-inara-primary/20"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description" className="text-[10px] font-black uppercase tracking-widest opacity-40">Description</Label>
                <Input 
                  id="description" value={description} onChange={e => setDescription(e.target.value)} 
                  placeholder="Add context or rules for participants..." 
                  className="border-2 font-medium h-12"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2 text-inara-logic">
                  <Label className="text-[10px] font-black uppercase tracking-widest opacity-40">Start Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full h-12 justify-start text-left font-bold border-2 border-inara-border",
                          !startDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4 text-inara-primary" />
                        {startDate ? format(startDate, "PPP") : <span>Select Date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar mode="single" selected={startDate} onSelect={setStartDate} initialFocus />
                    </PopoverContent>
                  </Popover>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest opacity-40">Start Time</Label>
                  <div className="relative">
                    <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-inara-primary" />
                    <Input 
                      type="time" value={startTimeStr} onChange={e => setStartTimeStr(e.target.value)} 
                      required className="h-12 pl-12 border-2 border-inara-border font-bold text-inara-logic"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-3xl font-black text-inara-logic uppercase">Problem Set</h2>
              <Button type="button" variant="outline" size="sm" onClick={addProblem} className="inara-btn bg-white border-inara-border h-10 px-6 font-black">
                <Plus className="w-4 h-4 mr-2 text-inara-primary" /> ADD PROBLEM
              </Button>
            </div>

            {problems.length === 0 && (
              <div className="py-20 text-center border-4 border-dashed border-inara-border/20 rounded-3xl bg-inara-muted/5 flex flex-col items-center gap-4">
                <Trophy className="w-16 h-16 text-inara-logic/10" />
                <p className="text-inara-logic/40 font-bold italic">Your contest is empty. Use the button above to begin.</p>
              </div>
            )}
            
            <div className="space-y-4">
              {problems.map((prob, index) => (
                <div key={index} className="inara-block bg-white p-6 flex flex-col md:flex-row gap-4 items-end relative group">
                  <div className="absolute top-0 left-0 w-2 h-full bg-inara-primary/30 group-hover:bg-inara-primary transition-colors" />
                  
                  <div className="w-full md:w-40 space-y-2">
                    <Label className="text-[10px] font-black uppercase opacity-40">Judge Node</Label>
                    <Select value={prob.oj} onValueChange={v => {
                      const newProbs = [...problems]; newProbs[index].oj = v as 'CF' | 'AC'; newProbs[index].title = ''; setProblems(newProbs);
                    }}>
                      <SelectTrigger className="h-11 border-2 border-inara-border font-black text-inara-primary">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="CF">Codeforces</SelectItem>
                        <SelectItem value="AC">AtCoder</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="w-full md:w-56 space-y-2">
                    <Label className="text-[10px] font-black uppercase opacity-40">Problem ID</Label>
                    <div className="relative">
                      <Input 
                        value={prob.external_id} onChange={e => {
                          const newProbs = [...problems]; newProbs[index].external_id = e.target.value; newProbs[index].title = ''; setProblems(newProbs);
                        }} 
                        placeholder={prob.oj === 'CF' ? "e.g. 123A" : "e.g. abc344_a"}
                        className="h-11 pr-10 border-2 border-inara-border font-mono font-bold"
                      />
                      {scrapingIndex === index && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          <Loader2 className="w-4 h-4 animate-spin text-inara-primary" />
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex-1 space-y-2 w-full">
                    <Label className="text-[10px] font-black uppercase opacity-40">Resolved Title</Label>
                    <Input 
                      value={prob.title} readOnly placeholder="Auto-fetching from OJ..."
                      className={cn(
                        "h-11 font-bold border-2 border-dashed border-inara-border/30 bg-inara-muted/10",
                        prob.title === 'Problem Not Found' && "text-rose-600 border-rose-200 bg-rose-50"
                      )}
                    />
                  </div>

                  <Button type="button" variant="ghost" className="text-inara-logic/30 hover:text-rose-600 h-11 w-11 p-0 transition-colors" onClick={() => removeProblem(index)}>
                    <Trash2 className="w-5 h-5" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <Card className="inara-block border-0 bg-transparent shadow-none sticky top-24">
            <CardHeader className="bg-inara-primary text-white border-2 border-inara-primary-dark rounded-t-xl py-4">
              <CardTitle className="text-lg font-black uppercase tracking-tight italic">Contest Config</CardTitle>
            </CardHeader>
            <CardContent className="bg-white border-2 border-t-0 border-inara-border rounded-b-xl space-y-8 p-8">
              <div className="space-y-4">
                <Label className="text-[10px] font-black uppercase tracking-widest opacity-40">Ranking Strategy</Label>
                <div className="grid grid-cols-1 gap-2">
                  {(['ICPC', 'AtCoder', 'IOI'] as const).map((rule) => (
                    <div 
                      key={rule} onClick={() => setRankingRule(rule)}
                      className={cn(
                        "cursor-pointer border-2 p-4 rounded-xl flex justify-between items-center transition-all",
                        rankingRule === rule ? "border-inara-primary bg-inara-primary/5 ring-4 ring-inara-primary/5 shadow-sm" : "border-inara-border/10 hover:border-inara-primary/30"
                      )}
                    >
                      <div className="font-black text-sm text-inara-logic">{rule}</div>
                      <div className="text-[10px] font-bold text-inara-logic opacity-40">
                        {rule === 'ICPC' ? 'Penalties' : rule === 'AtCoder' ? 'Score' : 'Subtasks'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-6 pt-6 border-t-2 border-inara-border/10">
                <div className="flex items-center justify-between">
                  <Label htmlFor="is-private" className="flex items-center gap-2 cursor-pointer font-bold text-inara-logic">
                    {isPrivate ? <Lock className="w-4 h-4 text-rose-500" /> : <Unlock className="w-4 h-4 text-emerald-500" />}
                    Private Mode
                  </Label>
                  <input 
                    id="is-private" type="checkbox" checked={isPrivate} onChange={e => setIsPrivate(e.target.checked)} 
                    className="w-6 h-6 rounded-lg border-3 border-inara-border text-inara-primary focus:ring-inara-primary/30 cursor-pointer"
                  />
                </div>
                
                {isPrivate && (
                  <div className="space-y-2 animate-in slide-in-from-top-2">
                    <Label htmlFor="password" className="text-[10px] font-black uppercase opacity-40">Access Code</Label>
                    <Input 
                      id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} 
                      placeholder="e.g. INARA_PASS" required={isPrivate} className="h-12 border-2 font-mono font-bold"
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="duration" className="text-[10px] font-black uppercase opacity-40">Duration (Minutes)</Label>
                  <Input 
                    id="duration" type="number" value={duration} onChange={e => setDuration(e.target.value)} 
                    required className="h-12 border-2 font-black text-lg text-inara-logic"
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter className="pt-8 flex flex-col gap-4">
              <Button 
                type="submit" 
                className="w-full h-16 inara-btn inara-btn-primary text-xl font-black shadow-2xl"
                disabled={isSubmitting}
                onClick={handleSubmit}
              >
                {isSubmitting ? <><Loader2 className="animate-spin mr-2" /> Launching...</> : 'LAUNCH CONTEST'}
              </Button>
              <p className="text-[10px] text-center text-inara-logic/40 font-bold italic px-4">
                Verify all problems are "Resolved" before launching your contest.
              </p>
            </CardFooter>
          </Card>
        </div>
      </form>
    </main>
  )
}
