'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'
import { User } from '@supabase/supabase-js'
import { Trophy, PlusCircle, LogIn, LogOut, User as UserIcon, Palette, Moon, Sun, CheckCircle2 } from 'lucide-react'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu'
import { applyTheme, getSavedTheme, Theme } from '@/lib/theme'

export function Navbar() {
  const [user, setUser] = useState<User | null>(null)
  const [currentTheme, setCurrentTheme] = useState<Theme>('emerald')

  useEffect(() => {
    // Initialize Theme
    const saved = getSavedTheme()
    setCurrentTheme(saved)
    applyTheme(saved)

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  return (
    <nav className="border-b-4 border-inara-border bg-inara-bg/80 backdrop-blur-md sticky top-0 z-50 py-2 w-full">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-10">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-9 h-9 bg-inara-primary rounded-lg flex items-center justify-center rotate-3 group-hover:rotate-0 transition-transform duration-300 border-2 border-inara-primary-dark shadow-[2px_2px_0px_0px_rgba(0,0,0,0.3)]">
              <Trophy className="w-5 h-5 text-inara-bg" />
            </div>
            <span className="text-2xl font-black italic tracking-tighter uppercase text-white">
              n<span className="text-inara-primary">Judge</span>
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-8 text-[10px] font-black uppercase tracking-[0.2em]">
            <Link href="/contests" className="text-white/70 hover:text-inara-primary transition-colors flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-inara-primary/40 rounded-full" />
              Contests
            </Link>
            <Link href="/extension" className="text-white/70 hover:text-inara-primary transition-colors flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-inara-primary/40 rounded-full" />
              Bridge
              <span className="flex h-2 w-2 rounded-full bg-slate-700" id="extension-status-dot"></span>
            </Link>
            <Link href="/canvas" className="text-inara-accent hover:text-inara-accent/80 transition-colors">
              Canvas
            </Link>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9 rounded-md hover:bg-inara-primary/10 text-white/60 hover:text-inara-primary">
                <Palette className="w-5 h-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 inara-block bg-inara-card p-1">
              <div className="px-3 py-2 text-[10px] font-black text-white/40 uppercase tracking-widest border-b border-inara-border mb-1">Appearance</div>
              <DropdownMenuItem onClick={() => { setCurrentTheme('emerald'); applyTheme('emerald'); }} className="gap-3 cursor-pointer py-2 focus:bg-inara-primary/10 rounded-lg">
                <div className="h-4 w-4 rounded-md bg-inara-primary border-2 border-inara-primary-dark" />
                <span className="font-bold text-xs uppercase tracking-tight">Emerald Theme</span>
                {currentTheme === 'emerald' && <CheckCircle2 className="w-3 h-3 ml-auto text-inara-primary" />}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => { setCurrentTheme('midnight'); applyTheme('midnight'); }} className="gap-3 cursor-pointer py-2 focus:bg-inara-accent/10 rounded-lg">
                <div className="h-4 w-4 rounded-md bg-inara-accent border-2 border-inara-accent/50" />
                <span className="font-bold text-xs uppercase tracking-tight">Midnight Theme</span>
                {currentTheme === 'midnight' && <CheckCircle2 className="w-3 h-3 ml-auto text-inara-accent" />}
              </DropdownMenuItem>
              
              <DropdownMenuSeparator className="bg-inara-border h-[2px]" />
              
              <DropdownMenuItem onClick={() => document.documentElement.classList.toggle('dark')} className="gap-3 cursor-pointer py-2 rounded-lg text-white">
                <div className="w-4 flex justify-center">
                  <Moon className="w-4 h-4 dark:hidden" />
                  <Sun className="w-4 h-4 hidden dark:block text-amber-400" />
                </div>
                <span className="font-bold text-xs uppercase tracking-tight">Dark Mode</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <script dangerouslySetInnerHTML={{ __html: `
            (function() {
              const check = () => {
                const requestId = Math.random().toString(36).substring(7);
                const handleResponse = (e) => {
                  if (e.data && e.data.type === 'NJUDGE_PING_RESPONSE' && e.data.requestId === requestId) {
                    const dot = document.getElementById('extension-status-dot');
                    if (dot) dot.className = 'flex h-2 w-2 rounded-full bg-inara-primary shadow-[0_0_10px_oklch(var(--inara-primary))]';
                    window.removeEventListener('message', handleResponse);
                  }
                };
                window.addEventListener('message', handleResponse);
                window.postMessage({ type: 'NJUDGE_PING', requestId }, '*');
                setTimeout(() => window.removeEventListener('message', handleResponse), 1000);
              };
              setTimeout(check, 1000);
              setInterval(check, 10000);
            })();
          `}} />
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-10 gap-2 pl-2 pr-3 hover:bg-inara-primary/10 text-white group rounded-xl border-2 border-transparent hover:border-inara-primary/30 transition-all">
                  <div className="w-7 h-7 rounded-lg bg-inara-primary flex items-center justify-center border-2 border-inara-primary-dark">
                    <UserIcon className="w-4 h-4 text-inara-bg" />
                  </div>
                  <span className="text-xs font-black uppercase tracking-tight hidden lg:inline-block">
                    {user.email?.split('@')[0]}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 inara-block bg-inara-card p-1">
                <Link href="/profile">
                  <DropdownMenuItem className="gap-3 cursor-pointer py-2 focus:bg-inara-primary/10 rounded-lg text-white">
                    <UserIcon className="w-4 h-4 text-inara-primary" />
                    <span className="font-bold text-xs uppercase tracking-tight">My Profile</span>
                  </DropdownMenuItem>
                </Link>
                <Link href="/contests/create">
                  <DropdownMenuItem className="gap-3 cursor-pointer py-2 focus:bg-inara-primary/10 rounded-lg text-white">
                    <PlusCircle className="w-4 h-4 text-inara-primary" />
                    <span className="font-bold text-xs uppercase tracking-tight">Create Contest</span>
                  </DropdownMenuItem>
                </Link>
                <DropdownMenuSeparator className="bg-inara-border h-[2px]" />
                <DropdownMenuItem 
                  className="gap-3 cursor-pointer py-2 focus:bg-rose-500/10 text-rose-500 rounded-lg"
                  onClick={() => supabase.auth.signOut().then(() => window.location.href = '/')}
                >
                  <LogOut className="w-4 h-4" />
                  <span className="font-bold text-xs uppercase tracking-tight">Sign Out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button asChild className="inara-btn inara-btn-primary h-10 px-6 text-xs shadow-none">
              <Link href="/login">
                <LogIn className="w-4 h-4 mr-2" />
                Sign In
              </Link>
            </Button>
          )}
        </div>
      </div>
    </nav>
  )
}
