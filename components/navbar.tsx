'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
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
  Zap, 
  Palette,
  ChevronUp,
  Settings,
  History
} from 'lucide-react'
import { cn } from '@/lib/utils'

export function Navbar() {
  const [user, setUser] = useState<User | null>(null)
  const [activeMenu, setActiveMenu] = useState<string | null>(null)
  const pathname = usePathname()

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  // Close menu on path change
  useEffect(() => {
    setActiveMenu(null)
  }, [pathname])

  const toggleMenu = (menu: string) => {
    setActiveMenu(activeMenu === menu ? null : menu)
  }

  return (
    <>
      {/* 1. Backdrop Overlay (Close menu when clicking outside) */}
      {activeMenu && (
        <div 
          className="fixed inset-0 bg-transparent z-30"
          onClick={() => setActiveMenu(null)}
        />
      )}

      {/* 2. Slide-up Sub-menus */}
      <div className={cn(
        "inara-submenu px-4 py-4 space-y-3",
        activeMenu === 'contests' ? "flex flex-col" : "hidden"
      )}>
        <div className="text-[10px] font-black uppercase text-inara-logic/40 px-2 border-b border-inara-border/10 pb-2 mb-1">
          Contest Operations
        </div>
        <Link href="/contests" className="flex items-center gap-3 p-3 rounded-xl hover:bg-inara-primary/10 text-inara-logic transition-all group">
          <div className="w-8 h-8 rounded-lg bg-inara-muted flex items-center justify-center border-2 border-inara-border group-hover:border-inara-primary">
            <LayoutGrid className="w-4 h-4" />
          </div>
          <span className="font-bold text-sm">Contest Gallery</span>
        </Link>
        <Link href="/contests/create" className="flex items-center gap-3 p-3 rounded-xl hover:bg-inara-primary/10 text-inara-logic transition-all group">
          <div className="w-8 h-8 rounded-lg bg-inara-muted flex items-center justify-center border-2 border-inara-border group-hover:border-inara-primary">
            <PlusCircle className="w-4 h-4" />
          </div>
          <span className="font-bold text-sm">New Challenge</span>
        </Link>
      </div>

      <div className={cn(
        "inara-submenu px-4 py-4 space-y-3",
        activeMenu === 'profile' ? "flex flex-col" : "hidden"
      )}>
        <div className="text-[10px] font-black uppercase text-inara-logic/40 px-2 border-b border-inara-border/10 pb-2 mb-1">
          User Identity
        </div>
        {user ? (
          <>
            <Link href="/profile" className="flex items-center gap-3 p-3 rounded-xl hover:bg-inara-primary/10 text-inara-logic transition-all group">
              <div className="w-8 h-8 rounded-lg bg-inara-primary flex items-center justify-center border-2 border-inara-primary-dark">
                <UserIcon className="w-4 h-4 text-white" />
              </div>
              <div className="flex flex-col">
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
          <Link href="/login" className="flex items-center gap-3 p-3 rounded-xl bg-inara-primary text-white transition-all group border-2 border-inara-primary-dark">
            <LogIn className="w-5 h-5" />
            <span className="font-black text-sm uppercase">Auth Required</span>
          </Link>
        )}
      </div>

      {/* 3. The Main Dock */}
      <div className="inara-dock">
        <Link 
          href="/" 
          className={cn("inara-dock-item", pathname === '/' && "active")}
          title="Home"
        >
          <Home className="w-5 h-5" />
          <span className="text-[8px] font-black uppercase mt-1">Base</span>
        </Link>

        <div className="w-[2px] h-8 bg-inara-border/20 mx-1" />

        <button 
          onClick={() => toggleMenu('contests')}
          className={cn(
            "inara-dock-item", 
            (pathname.startsWith('/contests') || activeMenu === 'contests') && "text-inara-primary"
          )}
        >
          <Trophy className={cn("w-5 h-5", activeMenu === 'contests' && "animate-bounce")} />
          <span className="text-[8px] font-black uppercase mt-1">Arena</span>
        </button>

        <Link 
          href="/extension" 
          className={cn("inara-dock-item", pathname === '/extension' && "text-inara-primary")}
        >
          <div className="relative">
            <Zap className="w-5 h-5" />
            <div className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-slate-300 border border-white" id="extension-status-dot" />
          </div>
          <span className="text-[8px] font-black uppercase mt-1">Bridge</span>
        </Link>

        <div className="w-[2px] h-8 bg-inara-border/20 mx-1" />

        <button 
          onClick={() => toggleMenu('profile')}
          className={cn(
            "inara-dock-item",
            (pathname === '/profile' || activeMenu === 'profile') && "text-inara-primary"
          )}
        >
          {user ? (
            <div className="w-6 h-6 rounded bg-inara-primary flex items-center justify-center border-2 border-inara-primary-dark overflow-hidden">
              <UserIcon className="w-3.5 h-3.5 text-white" />
            </div>
          ) : (
            <LogIn className="w-5 h-5" />
          )}
          <span className="text-[8px] font-black uppercase mt-1">Account</span>
        </button>

        {/* Extension Detection Logic */}
        <script dangerouslySetInnerHTML={{ __html: `
          (function() {
            const check = () => {
              const requestId = Math.random().toString(36).substring(7);
              const handleResponse = (e) => {
                if (e.data && e.data.type === 'NJUDGE_PING_RESPONSE' && e.data.requestId === requestId) {
                  const dot = document.getElementById('extension-status-dot');
                  if (dot) dot.className = 'absolute -top-1 -right-1 w-2 h-2 rounded-full bg-inara-primary shadow-[0_0_8px_oklch(var(--inara-primary))] border border-white';
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
      </div>
    </>
  )
}
