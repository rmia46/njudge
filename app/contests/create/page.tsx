'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Trash2, Plus, Loader2, Search, Settings, Lock, Unlock, Trophy } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface ProblemInput {
  oj: 'CF' | 'AC'
  external_id: string
  title: string
  url: string
}

export default function CreateContest() {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [startTime, setStartTime] = useState('')
  const [duration, setDuration] = useState('120')
  const [isPrivate, setIsPrivate] = useState(false)
  const [password, setPassword] = useState('')
  const [rankingRule, setRankingRule] = useState<'ICPC' | 'AtCoder' | 'IOI'>('ICPC')
  const [problems, setProblems] = useState<ProblemInput[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [scrapingIndex, setScrapingIndex] = useState<number | null>(null)

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.source !== window) return
      if (event.data && event.data.type === 'NJUDGE_SCRAPE_PROBLEM_RESPONSE') {
        const { status, data, requestId } = event.data.payload
        const index = parseInt(requestId)
        
        if (status === 'success' && !isNaN(index)) {
          setProblems(prev => {
            const next = [...prev]
            next[index] = { 
              ...next[index], 
              title: data.title,
              url: data.url
            }
            return next
          })
        }
        setScrapingIndex(null)
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
  }

  const scrapeProblem = (index: number) => {
    const problem = problems[index]
    if (!problem.external_id) return

    setScrapingIndex(index)
    window.postMessage({
      type: 'NJUDGE_SCRAPE_PROBLEM',
      payload: { oj: problem.oj, id: problem.external_id },
      requestId: index.toString()
    }, '*')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('You must be logged in to create a contest.')

      // 1. Create Contest
      const { data: contest, error: contestError } = await supabase
        .from('contests')
        .insert({
          title,
          description,
          start_time: new Date(startTime).toISOString(),
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
        title: p.title || `Problem ${p.external_id}`,
        problem_url: p.url || (p.oj === 'CF' ? `https://codeforces.com/contest/${p.external_id.match(/\d+/)?.[0]}/problem/${p.external_id.match(/[A-Z]\d*/)?.[0]}` : '')
      }))

      const { error: problemsError } = await supabase
        .from('problems')
        .insert(problemsToInsert)

      if (problemsError) throw problemsError

      router.push(`/contests/${contest.id}`)
    } catch (error: any) {
      alert(error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="container max-w-5xl py-12 px-4">
      <div className="mb-8 space-y-2">
        <h1 className="text-4xl font-extrabold tracking-tight">Create Contest</h1>
        <p className="text-muted-foreground text-lg">Organize a new competition or practice session with custom problems.</p>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Basic Info */}
        <div className="lg:col-span-2 space-y-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-primary" /> General Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">Contest Title</Label>
                <Input 
                  id="title" 
                  value={title} 
                  onChange={e => setTitle(e.target.value)} 
                  required 
                  placeholder="e.g., Weekly Algorithm Challenge #42" 
                  className="text-lg h-12"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Input 
                  id="description" 
                  value={description} 
                  onChange={e => setDescription(e.target.value)} 
                  placeholder="Add details about rules, prizes, or topics." 
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="start_time">Start Time</Label>
                  <Input 
                    id="start_time" 
                    type="datetime-local" 
                    value={startTime} 
                    onChange={e => setStartTime(e.target.value)} 
                    required 
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="duration">Duration (minutes)</Label>
                  <Input 
                    id="duration" 
                    type="number" 
                    value={duration} 
                    onChange={e => setDuration(e.target.value)} 
                    required 
                    className="h-11"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-primary" /> Problem Set
              </CardTitle>
              <Button type="button" variant="outline" size="sm" onClick={addProblem} className="h-9">
                <Plus className="w-4 h-4 mr-2" /> Add Problem
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {problems.length === 0 && (
                <div className="text-center py-12 border-2 border-dashed rounded-xl bg-slate-50/50">
                  <Search className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <p className="text-muted-foreground">No problems added yet. Use the button above to add some.</p>
                </div>
              )}
              
              {problems.map((prob, index) => (
                <div key={index} className="flex flex-col md:flex-row gap-3 items-end p-5 border rounded-xl bg-card shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                  <div className="absolute top-0 left-0 w-1 h-full bg-primary opacity-50" />
                  
                  <div className="w-full md:w-32 space-y-2">
                    <Label className="text-xs uppercase tracking-wider font-bold opacity-50">OJ</Label>
                    <Select 
                      value={prob.oj} 
                      onValueChange={v => {
                        const newProbs = [...problems]
                        newProbs[index].oj = v as 'CF' | 'AC'
                        setProblems(newProbs)
                      }}
                    >
                      <SelectTrigger className="h-10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="CF">Codeforces</SelectItem>
                        <SelectItem value="AC">AtCoder</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="w-full md:w-48 space-y-2">
                    <Label className="text-xs uppercase tracking-wider font-bold opacity-50">Problem ID</Label>
                    <div className="relative group/input">
                      <Input 
                        value={prob.external_id} 
                        onChange={e => {
                          const newProbs = [...problems]
                          newProbs[index].external_id = e.target.value
                          setProblems(newProbs)
                        }} 
                        placeholder="e.g. 123A"
                        className="h-10 pr-10"
                      />
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="icon" 
                        className="absolute right-1 top-1 h-8 w-8 hover:bg-primary/10 hover:text-primary"
                        onClick={() => scrapeProblem(index)}
                        disabled={scrapingIndex === index || !prob.external_id}
                      >
                        {scrapingIndex === index ? <Loader2 className="w-4 h-4 animate-spin text-primary" /> : <Search className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>

                  <div className="flex-1 space-y-2 w-full">
                    <Label className="text-xs uppercase tracking-wider font-bold opacity-50">Title</Label>
                    <Input 
                      value={prob.title} 
                      onChange={e => {
                        const newProbs = [...problems]
                        newProbs[index].title = e.target.value
                        setProblems(newProbs)
                      }} 
                      placeholder="Scrape with search icon..."
                      className="h-10"
                    />
                  </div>

                  <Button type="button" variant="ghost" className="text-destructive h-10 w-10 p-0" onClick={() => removeProblem(index)}>
                    <Trash2 className="w-5 h-5" />
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Settings */}
        <div className="space-y-6">
          <Card className="sticky top-24">
            <CardHeader>
              <CardTitle>Contest Settings</CardTitle>
              <CardDescription>Configure how the contest behaves.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <Label className="text-sm font-bold flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-primary" /> Ranking Rule
                </Label>
                <div className="grid grid-cols-1 gap-2">
                  {['ICPC', 'AtCoder', 'IOI'].map((rule) => (
                    <div 
                      key={rule}
                      onClick={() => setRankingRule(rule as any)}
                      className={`cursor-pointer border p-3 rounded-lg flex justify-between items-center transition-all ${
                        rankingRule === rule ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'hover:bg-slate-50'
                      }`}
                    >
                      <div className="text-sm font-medium">{rule}</div>
                      <div className="text-[10px] bg-slate-100 px-2 py-0.5 rounded text-muted-foreground">
                        {rule === 'ICPC' ? 'Penalty Based' : rule === 'AtCoder' ? 'Score Based' : 'Subtasks'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t">
                <div className="flex items-center justify-between">
                  <Label htmlFor="is-private" className="flex items-center gap-2 cursor-pointer">
                    {isPrivate ? <Lock className="w-4 h-4 text-amber-500" /> : <Unlock className="w-4 h-4 text-emerald-500" />}
                    Private Contest
                  </Label>
                  <input 
                    id="is-private" 
                    type="checkbox" 
                    checked={isPrivate} 
                    onChange={e => setIsPrivate(e.target.checked)} 
                    className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary"
                  />
                </div>
                
                {isPrivate && (
                  <div className="space-y-2 animate-in slide-in-from-top-2 duration-300">
                    <Label htmlFor="password">Entry Password</Label>
                    <Input 
                      id="password" 
                      type="password" 
                      value={password} 
                      onChange={e => setPassword(e.target.value)} 
                      placeholder="Set access code" 
                      required={isPrivate}
                    />
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter className="flex-col gap-3 pt-6 border-t">
              <Button 
                type="submit" 
                className="w-full h-12 bg-primary hover:bg-primary/90 text-lg font-bold shadow-lg"
                disabled={isSubmitting || problems.length === 0}
                onClick={handleSubmit}
              >
                {isSubmitting ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Creating...</> : 'Launch Contest'}
              </Button>
              <p className="text-[11px] text-center text-muted-foreground px-4">
                By launching, you agree that this contest will be visible to users based on your privacy settings.
              </p>
            </CardFooter>
          </Card>
        </div>
      </form>
    </main>
  )
}
