'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Trash2, Plus, Loader2, Info } from 'lucide-react'
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
          const newProblems = [...problems]
          newProblems[index].title = data.title
          setProblems(newProblems)
        }
        setScrapingIndex(null)
      }
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [problems])

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
      // 1. Create Contest
      const { data: contest, error: contestError } = await supabase
        .from('contests')
        .insert({
          title,
          description,
          start_time: new Date(startTime).toISOString(),
          duration_minutes: parseInt(duration),
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
        problem_url: p.url || (p.oj === 'CF' ? `https://codeforces.com/problemset/problem/${p.external_id}` : '')
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
    <main className="container max-w-4xl py-12">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-emerald-600">Create New Contest</CardTitle>
          <CardDescription>Set up your practice session or a timed contest.</CardDescription>
        </CardHeader>
        <CardContent>
          <form id="contest-form" onSubmit={handleSubmit} className="space-y-8">
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Contest Title</Label>
                  <Input id="title" value={title} onChange={e => setTitle(e.target.value)} required placeholder="e.g., Weekend Warmup" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="start_time">Start Time</Label>
                  <Input id="start_time" type="datetime-local" value={startTime} onChange={e => setStartTime(e.target.value)} required />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="duration">Duration (minutes)</Label>
                  <Input id="duration" type="number" value={duration} onChange={e => setDuration(e.target.value)} required />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Problem Set</h3>
                <Button type="button" variant="outline" size="sm" onClick={addProblem}>
                  <Plus className="w-4 h-4 mr-2" /> Add Problem
                </Button>
              </div>

              {problems.map((prob, index) => (
                <div key={index} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end p-4 border rounded-lg bg-slate-50/50">
                  <div className="md:col-span-2 space-y-2">
                    <Label>OJ</Label>
                    <select 
                      className="w-full border rounded p-2 text-sm h-10"
                      value={prob.oj} 
                      onChange={e => {
                        const newProbs = [...problems]
                        newProbs[index].oj = e.target.value as 'CF' | 'AC'
                        setProblems(newProbs)
                      }}
                    >
                      <option value="CF">Codeforces</option>
                      <option value="AC">AtCoder</option>
                    </select>
                  </div>
                  <div className="md:col-span-3 space-y-2">
                    <Label>Problem ID (e.g. 123A)</Label>
                    <div className="flex gap-1">
                      <Input 
                        value={prob.external_id} 
                        onChange={e => {
                          const newProbs = [...problems]
                          newProbs[index].external_id = e.target.value
                          setProblems(newProbs)
                        }} 
                        placeholder="ID"
                      />
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => scrapeProblem(index)}
                        disabled={scrapingIndex === index || !prob.external_id}
                      >
                        {scrapingIndex === index ? <Loader2 className="w-4 h-4 animate-spin" /> : <Info className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>
                  <div className="md:col-span-5 space-y-2">
                    <Label>Title</Label>
                    <Input 
                      value={prob.title} 
                      onChange={e => {
                        const newProbs = [...problems]
                        newProbs[index].title = e.target.value
                        setProblems(newProbs)
                      }} 
                      placeholder="Fetch title with extension..."
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Button type="button" variant="ghost" className="text-destructive w-full" onClick={() => removeProblem(index)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </form>
        </CardContent>
        <CardFooter>
          <Button 
            form="contest-form" 
            type="submit" 
            className="w-full bg-emerald-600 hover:bg-emerald-700"
            disabled={isSubmitting || problems.length === 0}
          >
            {isSubmitting ? 'Creating Contest...' : 'Create Contest'}
          </Button>
        </CardFooter>
      </Card>
    </main>
  )
}
