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
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  
  // Date and Time split
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

  // Auto-scrape when external_id changes
  useEffect(() => {
    if (scrapingIndex !== null) return;

    const targetIndex = problems.findIndex((prob, index) => {
      if (!prob.external_id) return false;
      if (prob.title) return false; 
      if (scrapedIds[index] === prob.external_id) return false;

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
      if (event.source !== window) return
      if (event.data && event.data.type === 'NJUDGE_SCRAPE_PROBLEM_RESPONSE') {
        const { payload, requestId } = event.data;
        if (!payload) return;

        const { status, data, message } = payload;
        const index = parseInt(requestId)
        
        if (status === 'success' && !isNaN(index)) {
          setProblems(prev => {
            const next = [...prev]
            if (next[index]) {
              next[index] = { 
                ...next[index], 
                title: data.title, 
                url: data.url,
                statementHtml: data.statementHtml,
                timeLimit: data.timeLimit,
                memoryLimit: data.memoryLimit
              };
            }
            return next;
          })
          toast.success(`Fetched: ${data.title}`)
        } else if (status === 'error') {
          if (!isNaN(index)) {
            setProblems(prev => {
              const next = [...prev]
              if (next[index]) {
                next[index] = { ...next[index], title: 'Problem Not Found', url: '' };
              }
              return next;
            })
          }
          toast.error(`Failed to fetch problem at index ${index + 1}`)
        }
        setScrapingIndex(null);
      }
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [])

  const addProblem = () => {
    setProblems([...problems, { oj: 'CF', external_id: '', title: '', url: '' }])
  }

  const removeProblem = (index: number) => {
    setProblems(problems.filter((_, i) => i !== index))
    // Also clean up scrapedIds tracking
    const newScraped = { ...scrapedIds }
    delete newScraped[index]
    setScrapedIds(newScraped)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // VALIDATIONS
    if (!title.trim()) {
      toast.error("Contest title is required")
      return
    }

    if (!startDate) {
      toast.error("Please select a start date")
      return
    }

    if (problems.length === 0) {
      toast.error("Add at least one problem to the contest")
      return
    }

    const hasInvalidProblems = problems.some(p => !p.title || p.title === 'Problem Not Found')
    if (hasInvalidProblems) {
      toast.error("One or more problems are invalid or could not be found")
      return
    }

    setIsSubmitting(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('You must be logged in to create a contest.')

      // Combine Date and Time
      const combinedDateTime = new Date(startDate)
      const [hours, minutes] = startTimeStr.split(':').map(Number)
      combinedDateTime.setHours(hours, minutes, 0, 0)

      // 1. Create Contest
      const { data: contest, error: contestError } = await supabase
        .from('contests')
        .insert({
          title,
          description,
          start_time: combinedDateTime.toISOString(),
          duration_minutes: parseInt(duration),
          owner_id: user.id,
          is_private: isPrivate,
          password: isPrivate ? password : null,
          ranking_rule: rankingRule
        })
        .select()
        .single()

      if (contestError) throw contestError

      // 2. Create Problems
      const problemsToInsert = problems.map(p => ({
        contest_id: contest.id,
        oj: p.oj,
        external_id: p.external_id,
        title: p.title,
        problem_url: p.url,
        statement_html: p.statementHtml,
        time_limit: p.timeLimit,
        memory_limit: p.memoryLimit
      }))

      const { error: problemsError } = await supabase
        .from('problems')
        .insert(problemsToInsert)

      if (problemsError) throw problemsError

      toast.success("Contest launched successfully!")
      router.push(`/contests/${contest.id}`)
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="max-w-5xl mx-auto py-12 px-4 w-full">
      <div className="mb-8 space-y-2">
        <h1 className="text-4xl font-extrabold tracking-tight">Organize Contest</h1>
        <p className="text-muted-foreground text-lg italic">Build your challenge, invite participants, and watch the leaderboard.</p>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Basic Info */}
        <div className="lg:col-span-2 space-y-8">
          <Card className="border-2 shadow-sm">
            <CardHeader className="bg-muted/10 border-b">
              <CardTitle className="flex items-center gap-2 text-xl">
                <Settings className="w-5 h-5 text-primary" /> Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <div className="space-y-2">
                <Label htmlFor="title" className="text-xs font-bold uppercase tracking-widest opacity-70">Contest Title</Label>
                <Input 
                  id="title" 
                  value={title} 
                  onChange={e => setTitle(e.target.value)} 
                  required 
                  placeholder="e.g., Codeforces Div. 2 Mirror" 
                  className="text-lg h-12 border-2 focus-visible:ring-primary/20"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description" className="text-xs font-bold uppercase tracking-widest opacity-70">Description (Optional)</Label>
                <Input 
                  id="description" 
                  value={description} 
                  onChange={e => setDescription(e.target.value)} 
                  placeholder="Write a brief description or rules..." 
                  className="border-2"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-widest opacity-70">Start Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full h-11 justify-start text-left font-normal border-2",
                          !startDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {startDate ? format(startDate, "PPP") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={startDate}
                        onSelect={setStartDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-widest opacity-70">Start Time</Label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input 
                      type="time" 
                      value={startTimeStr} 
                      onChange={e => setStartTimeStr(e.target.value)} 
                      required 
                      className="h-11 pl-10 border-2"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 bg-muted/10 border-b py-4">
              <CardTitle className="flex items-center gap-2 text-xl">
                <Trophy className="w-5 h-5 text-primary" /> Problem Set
              </CardTitle>
              <Button type="button" variant="outline" size="sm" onClick={addProblem} className="h-9 font-bold bg-background">
                <Plus className="w-4 h-4 mr-2" /> Add Problem
              </Button>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              {problems.length === 0 && (
                <div className="text-center py-12 border-2 border-dashed rounded-2xl bg-muted/5">
                  <Search className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <p className="text-muted-foreground font-medium">Your contest is empty. Add some problems!</p>
                </div>
              )}
              
              {problems.map((prob, index) => (
                <div key={index} className="flex flex-col md:flex-row gap-3 items-end p-5 border-2 rounded-2xl bg-card shadow-sm hover:shadow-md transition-all relative overflow-hidden group">
                  <div className="absolute top-0 left-0 w-1.5 h-full bg-primary/20 group-hover:bg-primary transition-colors" />
                  
                  <div className="w-full md:w-36 space-y-2">
                    <Label className="text-[10px] uppercase tracking-widest font-black opacity-40">Judge</Label>
                    <Select 
                      value={prob.oj} 
                      onValueChange={v => {
                        const newProbs = [...problems]
                        newProbs[index].oj = v as 'CF' | 'AC'
                        newProbs[index].title = '' // Reset title on OJ change
                        setProblems(newProbs)
                      }}
                    >
                      <SelectTrigger className="h-10 border-2 font-bold">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="CF">Codeforces</SelectItem>
                        <SelectItem value="AC">AtCoder</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="w-full md:w-48 space-y-2">
                    <Label className="text-[10px] uppercase tracking-widest font-black opacity-40">Problem ID</Label>
                    <div className="relative">
                      <Input 
                        value={prob.external_id} 
                        onChange={e => {
                          const newProbs = [...problems]
                          newProbs[index].external_id = e.target.value
                          newProbs[index].title = ''
                          setProblems(newProbs)
                        }} 
                        placeholder={prob.oj === 'CF' ? "e.g. 123A" : "e.g. abc123_a"}
                        className="h-10 pr-10 border-2 font-mono"
                      />
                      {scrapingIndex === index && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          <Loader2 className="w-4 h-4 animate-spin text-primary" />
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex-1 space-y-2 w-full">
                    <Label className="text-[10px] uppercase tracking-widest font-black opacity-40">Fetched Title</Label>
                    <Input 
                      value={prob.title} 
                      readOnly
                      placeholder={scrapingIndex === index ? "Fetching from OJ..." : "Awaiting valid ID..."}
                      className={cn(
                        "h-10 transition-all font-semibold",
                        prob.title === 'Problem Not Found' ? 'border-rose-200 bg-rose-50 text-rose-600' : 'bg-muted/30 border-dashed'
                      )}
                    />
                  </div>

                  <Button type="button" variant="ghost" className="text-muted-foreground hover:text-destructive h-10 w-10 p-0 transition-colors" onClick={() => removeProblem(index)}>
                    <Trash2 className="w-5 h-5" />
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Settings */}
        <div className="space-y-6">
          <Card className="sticky top-24 border-2 shadow-lg">
            <CardHeader className="bg-primary/5 border-b">
              <CardTitle className="text-lg">Rules & Privacy</CardTitle>
              <CardDescription>Finalize your contest configuration.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <div className="space-y-4">
                <Label className="text-[10px] uppercase tracking-widest font-black opacity-40">Ranking Rule</Label>
                <div className="grid grid-cols-1 gap-2">
                  {(['ICPC', 'AtCoder', 'IOI'] as const).map((rule) => (
                    <div 
                      key={rule}
                      onClick={() => setRankingRule(rule)}
                      className={`cursor-pointer border-2 p-3 rounded-xl flex justify-between items-center transition-all ${
                        rankingRule === rule ? 'border-primary bg-primary/5 ring-4 ring-primary/5' : 'hover:border-primary/20 hover:bg-slate-50 border-transparent'
                      }`}
                    >
                      <div className="font-bold text-sm">{rule}</div>
                      <div className="text-[10px] font-bold text-muted-foreground opacity-60">
                        {rule === 'ICPC' ? 'Penalties' : rule === 'AtCoder' ? 'Score' : 'Subtasks'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-4 pt-6 border-t">
                <div className="flex items-center justify-between">
                  <Label htmlFor="is-private" className="flex items-center gap-2 cursor-pointer font-bold">
                    {isPrivate ? <Lock className="w-4 h-4 text-amber-500" /> : <Unlock className="w-4 h-4 text-emerald-500" />}
                    Private Mode
                  </Label>
                  <input 
                    id="is-private" 
                    type="checkbox" 
                    checked={isPrivate} 
                    onChange={e => setIsPrivate(e.target.checked)} 
                    className="w-5 h-5 rounded-lg border-2 border-slate-300 text-primary focus:ring-primary transition-all"
                  />
                </div>
                
                {isPrivate && (
                  <div className="space-y-2 animate-in slide-in-from-top-2 duration-300">
                    <Label htmlFor="password" className="text-[10px] uppercase tracking-widest font-black opacity-40">Entry Password</Label>
                    <Input 
                      id="password" 
                      type="password" 
                      value={password} 
                      onChange={e => setPassword(e.target.value)} 
                      placeholder="e.g. NJUDGE2024" 
                      required={isPrivate}
                      className="border-2 font-mono"
                    />
                  </div>
                )}

                <div className="space-y-2 pt-2">
                  <Label htmlFor="duration" className="text-[10px] uppercase tracking-widest font-black opacity-40">Duration (Minutes)</Label>
                  <Input 
                    id="duration" 
                    type="number" 
                    value={duration} 
                    onChange={e => setDuration(e.target.value)} 
                    required 
                    className="h-11 border-2 font-bold"
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex-col gap-3 pt-6 border-t bg-muted/5">
              <Button 
                type="submit" 
                className="w-full h-14 bg-primary hover:bg-primary/90 text-lg font-black shadow-xl shadow-primary/20 transition-all active:scale-[0.98]"
                disabled={isSubmitting}
                onClick={handleSubmit}
              >
                {isSubmitting ? <><Loader2 className="w-6 h-6 mr-2 animate-spin" /> Launching...</> : 'Launch Contest'}
              </Button>
              <p className="text-[10px] text-center text-muted-foreground px-4 font-medium italic">
                By clicking launch, your contest will be visible to others based on privacy settings.
              </p>
            </CardFooter>
          </Card>
        </div>
      </form>
    </main>
  )
}
