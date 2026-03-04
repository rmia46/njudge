'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'
import { User } from '@supabase/supabase-js'
import { LayoutDashboard, Trophy, PlusCircle, LogIn, LogOut, User as UserIcon, Palette, Moon, Sun, CheckCircle2 } from 'lucide-react'
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

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  return (
    <nav className="border-b bg-white/50 backdrop-blur-md sticky top-0 z-50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/" className="text-xl font-bold text-emerald-600 flex items-center gap-2">
            <Trophy className="w-6 h-6" />
            <span>nJudge</span>
          </Link>
          
          <div className="hidden md:flex items-center gap-6 text-sm font-medium">
            <Link href="/contests" className="hover:text-emerald-600 transition-colors">Contests</Link>
            <Link href="/problems" className="hover:text-emerald-600 transition-colors">Problems</Link>
            <Link href="/extension" className="hover:text-emerald-600 transition-colors flex items-center gap-1.5">
              Bridge
              <span className="flex h-2 w-2 rounded-full bg-slate-300" id="extension-status-dot"></span>
            </Link>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full text-muted-foreground hover:text-primary">
                <Palette className="w-5 h-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Themes</div>
              <DropdownMenuItem onClick={() => { setCurrentTheme('emerald'); applyTheme('emerald'); }} className="gap-2 cursor-pointer">
                <div className="h-4 w-4 rounded-full bg-emerald-500 border border-black/10" />
                Emerald
                {currentTheme === 'emerald' && <CheckCircle2 className="w-3 h-3 ml-auto text-emerald-600" />}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => { setCurrentTheme('midnight'); applyTheme('midnight'); }} className="gap-2 cursor-pointer">
                <div className="h-4 w-4 rounded-full bg-indigo-950 border border-black/10" />
                Midnight
                {currentTheme === 'midnight' && <CheckCircle2 className="w-3 h-3 ml-auto text-indigo-400" />}
              </DropdownMenuItem>
              
              <DropdownMenuSeparator />
              
              <DropdownMenuItem onClick={() => document.documentElement.classList.toggle('dark')} className="gap-2 cursor-pointer">
                <Moon className="w-4 h-4 dark:hidden" />
                <Sun className="w-4 h-4 hidden dark:block" />
                Dark Mode
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
                    if (dot) dot.className = 'flex h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]';
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
            <>
              <Button variant="ghost" size="sm" asChild className="hidden sm:flex">
                <Link href="/contests/create">
                  <PlusCircle className="w-4 h-4 mr-2" />
                  Create Contest
                </Link>
              </Button>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <UserIcon className="w-4 h-4" />
                    <span className="max-w-[100px] truncate">{user.email}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem asChild>
                    <Link href="/profile" className="cursor-pointer">Profile</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/my-submissions" className="cursor-pointer">My Submissions</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleLogout} className="text-destructive cursor-pointer">
                    <LogOut className="w-4 h-4 mr-2" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <Button size="sm" asChild className="bg-emerald-600 hover:bg-emerald-700">
              <Link href="/login">
                <LogIn className="w-4 h-4 mr-2" />
                Login
              </Link>
            </Button>
          )}
        </div>
      </div>
    </nav>
  )
}
