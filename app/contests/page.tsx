'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { supabase } from '@/lib/supabase'
import { Loader2, Search, Trophy, Users, Clock, Calendar, ChevronRight, Lock, Plus } from 'lucide-react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

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
    <main className="max-w-7xl mx-auto py-12 px-4 space-y-10 w-full">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-1">
          <h1 className="text-5xl font-black tracking-tight text-inara-logic text-white">Contest Gallery</h1>
          <p className="text-inara-logic/60 font-medium">Join challenges or practice with the global community.</p>
        </div>
        <Button asChild className="inara-btn inara-btn-primary h-12 px-8 font-black">
          <Link href="/contests/create">
            <Plus className="w-5 h-5 mr-2" /> CREATE CONTEST
          </Link>
        </Button>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-inara-logic/40" />
          <Input 
            placeholder="Search by title..." 
            className="pl-11 h-12 border-2 border-inara-border bg-white font-medium focus-visible:ring-inara-primary/20"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex bg-inara-muted/30 p-1 rounded-lg border-2 border-inara-border h-12">
          {(['all', 'active', 'upcoming', 'past'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "px-6 rounded-md text-xs font-black uppercase tracking-widest transition-all",
                filter === f ? "bg-white text-inara-primary shadow-sm" : "text-inara-logic/40 hover:text-inara-logic"
              )}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="py-24 flex justify-center text-inara-primary"><Loader2 className="w-10 h-10 animate-spin" /></div>
      ) : (
        <div className="inara-block overflow-hidden bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-inara-muted/20 border-b-2 border-inara-border">
                <tr>
                  <th className="p-4 text-[10px] font-black uppercase text-inara-logic/40 pl-8">Status</th>
                  <th className="p-4 text-[10px] font-black uppercase text-inara-logic/40">Contest Title</th>
                  <th className="p-4 text-[10px] font-black uppercase text-inara-logic/40 text-center">Start Time</th>
                  <th className="p-4 text-[10px] font-black uppercase text-inara-logic/40 text-center">Duration</th>
                  <th className="p-4 text-[10px] font-black uppercase text-inara-logic/40 text-center">Users</th>
                  <th className="p-4 text-[10px] font-black uppercase text-inara-logic/40 text-right pr-8">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y-2 divide-inara-border/5">
                {filteredContests.map((contest) => (
                  <ContestRow key={contest.id} contest={contest} />
                ))}
                {filteredContests.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-24 text-center">
                      <Trophy className="w-12 h-12 text-inara-logic/10 mx-auto mb-4" />
                      <p className="text-inara-logic/40 font-bold italic text-sm">No contests found matching your search.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </main>
  )
}

function ContestRow({ contest }: { contest: any }) {
  const statusConfig = {
    active: { label: 'Live', class: 'text-emerald-600 border-emerald-200 bg-emerald-50' },
    upcoming: { label: 'Upcoming', class: 'text-amber-600 border-amber-200 bg-amber-50' },
    past: { label: 'Ended', class: 'text-slate-400 border-slate-200 bg-slate-50' }
  }
  const config = statusConfig[contest.status as keyof typeof statusConfig]
  const participantCount = contest.participants?.[0]?.count || 0

  return (
    <tr className="hover:bg-inara-primary/5 transition-colors group">
      <td className="p-4 pl-8">
        <span className={cn("inara-badge border-2", config.class)}>{config.label}</span>
      </td>
      <td className="p-4">
        <div className="flex flex-col gap-0.5">
          <Link href={`/contests/${contest.id}`} className="font-bold text-inara-logic hover:text-inara-primary transition-colors text-base flex items-center gap-2">
            {contest.title}
            {contest.is_private && <Lock className="w-3 h-3 text-inara-logic/30" />}
          </Link>
          <span className="text-[10px] font-mono text-inara-logic/40 font-bold uppercase">{contest.ranking_rule} Rule</span>
        </div>
      </td>
      <td className="p-4 text-center">
        <div className="flex flex-col items-center">
          <span className="text-xs font-bold text-inara-logic/70">{new Date(contest.start_time).toLocaleDateString()}</span>
          <span className="text-[10px] font-mono font-bold opacity-40">{new Date(contest.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
      </td>
      <td className="p-4 text-center font-mono font-bold text-sm text-inara-logic/60">
        {contest.duration_minutes}m
      </td>
      <td className="p-4 text-center">
        <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-inara-logic/5 border border-inara-border/10">
          <Users className="w-3 h-3 text-inara-logic/40" />
          <span className="text-xs font-black text-inara-logic/70">{participantCount}</span>
        </div>
      </td>
      <td className="p-4 text-right pr-8">
        <Button asChild variant="ghost" className="h-9 w-9 p-0 group-hover:bg-inara-primary group-hover:text-white transition-all border-2 border-transparent group-hover:border-inara-primary-dark">
          <Link href={`/contests/${contest.id}`}>
            <ChevronRight className="w-5 h-5" />
          </Link>
        </Button>
      </td>
    </tr>
  )
}
