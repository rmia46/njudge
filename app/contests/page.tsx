'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { supabase } from '@/lib/supabase'
import { Loader2, Search, Trophy, Users, Clock, Calendar, ChevronRight, Lock, Plus } from 'lucide-react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'

export default function ContestsPage() {
  const [contests, setContests] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'active' | 'upcoming' | 'past'>('all')

  useEffect(() => {
    async function loadContests() {
      setIsLoading(true)
      let query = supabase
        .from('contests')
        .select('*, participants(count)')
        .order('start_time', { ascending: false })

      if (search) {
        query = query.ilike('title', `%${search}%`)
      }

      const { data } = await query
      
      const now = new Date()
      const processed = (data || []).map(c => {
        const start = new Date(c.start_time)
        const end = new Date(start.getTime() + c.duration_minutes * 60000)
        
        let status: 'active' | 'upcoming' | 'past' = 'past'
        if (now < start) status = 'upcoming'
        else if (now <= end) status = 'active'
        
        return { ...c, status }
      })

      setContests(processed)
      setIsLoading(false)
    }
    loadContests()
  }, [search])

  const filteredContests = contests.filter(c => filter === 'all' || c.status === filter)

  return (
    <main className="max-w-7xl mx-auto py-12 px-4 space-y-8 w-full">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-2">
          <h1 className="text-4xl font-extrabold tracking-tight">Contests</h1>
          <p className="text-muted-foreground text-lg">Join ongoing challenges or practice with past problems.</p>
        </div>
        <Button asChild className="bg-primary hover:bg-primary/90 h-11 font-bold shadow-lg">
          <Link href="/contests/create">
            <Plus className="w-5 h-5 mr-2" /> Create Contest
          </Link>
        </Button>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Search contests by title..." 
            className="pl-10 h-11"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex bg-muted/50 p-1 rounded-lg border">
          {(['all', 'active', 'upcoming', 'past'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider transition-all ${
                filter === f ? 'bg-background text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="py-24 flex justify-center"><Loader2 className="w-10 h-10 animate-spin text-primary" /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredContests.map((contest) => (
            <ContestCard key={contest.id} contest={contest} />
          ))}
          {filteredContests.length === 0 && (
            <div className="col-span-full py-24 text-center border-2 border-dashed rounded-3xl bg-muted/20">
              <Trophy className="w-12 h-12 text-muted-foreground/20 mx-auto mb-4" />
              <p className="text-muted-foreground font-medium">No contests found matching your criteria.</p>
            </div>
          )}
        </div>
      )}
    </main>
  )
}

function ContestCard({ contest }: { contest: any }) {
  const statusColors = {
    active: 'bg-emerald-500 text-white shadow-emerald-500/20',
    upcoming: 'bg-amber-500 text-white shadow-amber-500/20',
    past: 'bg-slate-400 text-white'
  }

  const participantCount = contest.participants?.[0]?.count || 0

  return (
    <Card className="group hover:border-primary/50 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 overflow-hidden border-2 flex flex-col h-full">
      <CardHeader className="pb-4 relative">
        <div className={`absolute top-4 right-4 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest shadow-lg ${statusColors[contest.status as keyof typeof statusColors]}`}>
          {contest.status}
        </div>
        <CardTitle className="text-xl font-bold leading-tight pr-12 group-hover:text-primary transition-colors">
          {contest.title}
        </CardTitle>
        <CardDescription className="line-clamp-2 mt-2 h-10">
          {contest.description || 'Join this competitive programming challenge on nJudge.'}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4 flex-1">
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
             <Calendar className="w-3.5 h-3.5" />
             {new Date(contest.start_time).toLocaleDateString()}
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
             <Clock className="w-3.5 h-3.5" />
             {contest.duration_minutes} mins
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
             <Users className="w-3.5 h-3.5" />
             {participantCount} joined
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
             <Trophy className="w-3.5 h-3.5" />
             {contest.ranking_rule}
          </div>
        </div>
      </CardContent>

      <CardFooter className="bg-muted/30 border-t p-4 pt-4">
        <Button asChild className="w-full font-bold group/btn" variant={contest.status === 'past' ? 'outline' : 'default'}>
          <Link href={`/contests/${contest.id}`}>
            {contest.is_private && <Lock className="w-3.5 h-3.5 mr-2" />}
            {contest.status === 'active' ? 'Enter Contest' : contest.status === 'upcoming' ? 'Join Now' : 'Upsolve Problems'}
            <ChevronRight className="w-4 h-4 ml-1 group-hover/btn:translate-x-1 transition-transform" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  )
}
