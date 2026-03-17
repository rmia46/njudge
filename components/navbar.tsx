'use client'

import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { User } from '@supabase/supabase-js'
import { 
  Trophy, 
  PlusCircle, 
  LogIn, 
  LogOut, 
  User as UserIcon, 
  Home, 
  LayoutGrid, 
  Zap
} from 'lucide-react'
import { cn } from '@/lib/utils'

export function Navbar() {
  const [user, setUser] = useState<User | null>(null)
  const [activeMenu, setActiveMenu] = useState<string | null>(null)
  const pathname = usePathname()
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    setActiveMenu(null)
  }, [pathname])

  const handleMouseEnter = (menu: string) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    setActiveMenu(menu)
  }

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setActiveMenu(null)
    }, 150)
  }

  return (
    <>
      {/* 1. Slide-up Sub-menus */}
      <div 
        className={cn(
          "inara-submenu px-4 py-4 space-y-3",
          activeMenu === 'contests' ? "flex flex-col" : "hidden"
        )}
        onMouseEnter={() => handleMouseEnter('contests')}
        onMouseLeave={handleMouseLeave}
      >
        <div className="text-[10px] font-black uppercase text-inara-logic/40 px-2 border-b border-inara-border/10 pb-2 mb-1">
          Contest Operations
        </div>
        <Link href="/contests" className="flex items-center gap-3 p-3 rounded-xl hover:bg-inara-muted/10 text-inara-logic transition-all group">
          <div className="w-8 h-8 rounded-lg bg-inara-muted flex items-center justify-center border-2 border-inara-border group-hover:border-inara-primary text-inara-logic">
            <LayoutGrid className="w-4 h-4" />
          </div>
          <span className="font-bold text-sm">Contest Gallery</span>
        </Link>
        <Link href="/contests/create" className="flex items-center gap-3 p-3 rounded-xl hover:bg-inara-muted/10 text-inara-logic transition-all group">
          <div className="w-8 h-8 rounded-lg bg-inara-muted flex items-center justify-center border-2 border-inara-border group-hover:border-inara-primary text-inara-logic">
            <PlusCircle className="w-4 h-4" />
          </div>
          <span className="font-bold text-sm">New Challenge</span>
        </Link>
      </div>

      <div 
        className={cn(
          "inara-submenu px-4 py-4 space-y-3",
          activeMenu === 'profile' ? "flex flex-col" : "hidden"
        )}
        onMouseEnter={() => handleMouseEnter('profile')}
        onMouseLeave={handleMouseLeave}
      >
        <div className="text-[10px] font-black uppercase text-inara-logic/40 px-2 border-b border-inara-border/10 pb-2 mb-1">
          User Identity
        </div>
        {user ? (
          <>
            <Link href="/profile" className="flex items-center gap-3 p-3 rounded-xl hover:bg-inara-muted/10 text-inara-logic transition-all group">
              <div className="w-8 h-8 rounded-lg bg-inara-logic/20 flex items-center justify-center border-2 border-inara-logic/40">
                <UserIcon className="w-4 h-4 text-inara-logic" />
              </div>
              <div className="flex flex-col text-inara-logic">
                <span className="font-bold text-sm leading-none">{user.email?.split('@')[0]}</span>
                <span className="text-[10px] opacity-40 mt-1 uppercase font-mono">Profile Config</span>
              </div>
            </Link>
            <button 
              onClick={() => supabase.auth.signOut().then(() => window.location.href = '/')}
              className="flex items-center gap-3 p-3 rounded-xl hover:bg-rose-50 text-rose-600 transition-all w-full text-left"
            >
              <div className="w-8 h-8 rounded-lg bg-rose-100 flex items-center justify-center border-2 border-rose-200">
                <LogOut className="w-4 h-4" />
              </div>
              <span className="font-bold text-sm uppercase tracking-tighter">Sign Out</span>
            </button>
          </>
        ) : (
          <Link href="/login" className="flex items-center gap-3 p-3 rounded-xl bg-inara-muted/10 text-inara-logic transition-all group border-2 border-inara-border/20">
            <LogIn className="w-5 h-5" />
            <span className="font-black text-sm uppercase">Auth Required</span>
          </Link>
        )}
      </div>

      {/* 2. The Main Dock */}
      <nav 
        className="inara-dock fixed bottom-0 left-0 right-0 w-full z-50 flex justify-center items-center h-[4.5rem] bg-inara-primary border-t-[4px] border-inara-primary-dark shadow-[0_-4px_20px_rgba(0,0,0,0.1)]" 
        onMouseLeave={handleMouseLeave}
      >
        <Link 
          href="/" 
          className={cn(
            "inara-dock-item flex flex-col md:flex-row items-center justify-center gap-2", 
            pathname === '/' && "active"
          )}
          title="Home"
        >
          <Home className="w-6 h-6" />
          <span className="font-pixel text-xs md:text-sm uppercase leading-none">Home</span>
        </Link>

        <div 
          className={cn(
            "inara-dock-item flex flex-col md:flex-row items-center justify-center gap-2 cursor-pointer", 
            (pathname.startsWith('/contests') || activeMenu === 'contests') && "active"
          )}
          onMouseEnter={() => handleMouseEnter('contests')}
        >
          <Trophy className="w-6 h-6" />
          <span className="font-pixel text-xs md:text-sm uppercase leading-none">Arena</span>
        </div>

        <Link 
          href="/extension" 
          className={cn(
            "inara-dock-item flex flex-col md:flex-row items-center justify-center gap-2", 
            pathname === '/extension' && "active"
          )}
        >
          <div className="relative">
            <Zap className="w-6 h-6" />
            <div className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-inara-muted border border-inara-logic/20" id="extension-status-dot" />
          </div>
          <span className="font-pixel text-xs md:text-sm uppercase leading-none">Bridge</span>
        </Link>

        <div 
          className={cn(
            "inara-dock-item flex flex-col md:flex-row items-center justify-center gap-2 cursor-pointer",
            (pathname === '/profile' || activeMenu === 'profile') && "active"
          )}
          onMouseEnter={() => handleMouseEnter('profile')}
        >
          {user ? (
            <div className="w-6 h-6 rounded bg-inara-logic/20 flex items-center justify-center border-2 border-inara-logic/40 overflow-hidden">
              <UserIcon className="w-4 h-4 text-inara-logic" />
            </div>
          ) : (
            <LogIn className="w-6 h-6" />
          )}
          <span className="font-pixel text-xs md:text-sm uppercase leading-none">Account</span>
        </div>

        <script dangerouslySetInnerHTML={{ __html: `
          (function() {
            const check = () => {
              const requestId = Math.random().toString(36).substring(7);
              const handleResponse = (e) => {
                if (e.data && e.data.type === 'NJUDGE_PING_RESPONSE' && e.data.requestId === requestId) {
                  const dot = document.getElementById('extension-status-dot');
                  if (dot) dot.className = 'absolute -top-1 -right-1 w-2 h-2 rounded-full bg-inara-logic border border-white';
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
      </nav>
    </>
  )
}
