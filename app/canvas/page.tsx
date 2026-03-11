'use client'

import { INARA_PALETTE } from '@/lib/inara-colors'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Trophy, Zap, Clock, Code, User, Settings, ArrowRight, Info, AlertTriangle, CheckCircle2 } from 'lucide-react'

export default function CanvasPage() {
  return (
    <main className="max-w-6xl mx-auto py-12 px-4 space-y-16 w-full">
      <header className="space-y-4">
        <div className="inline-block px-3 py-1 rounded-md bg-inara-primary/10 border-2 border-inara-primary/20 text-inara-primary text-[10px] font-black tracking-widest">
          Inara Lab v0.1
        </div>
        <h1 className="text-5xl md:text-7xl font-black italic tracking-tighter">
          Design <span className="text-inara-primary">Canvas</span>
        </h1>
        <p className="text-white/50 text-xl max-w-2xl font-medium">
          The playground for Bit-Art Digitalism. Tune the personality of nJudge here.
        </p>
      </header>

      {/* 1. Color Palette */}
      <section className="space-y-8">
        <div className="flex items-center gap-4">
          <div className="h-[2px] flex-1 bg-inara-border" />
          <h2 className="text-xs font-black opacity-40">01. Color Palette</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <ColorSwatch name="Primary" oklch={INARA_PALETTE.primary.base} label="Grounded Green" />
          <ColorSwatch name="Accent" oklch={INARA_PALETTE.accent.base} label="Lime Highlight" />
          <ColorSwatch name="Secondary" oklch={INARA_PALETTE.secondary.base} label="Muted Blue" />
          <ColorSwatch name="Surface" oklch={INARA_PALETTE.monolith.card} label="Deep Navy" />
          <ColorSwatch name="Border" oklch={INARA_PALETTE.monolith.border} label="Grid Line" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <ColorSwatch name="AC" oklch={INARA_PALETTE.status.ac} label="Accepted" />
          <ColorSwatch name="WA" oklch={INARA_PALETTE.status.wa} label="Wrong Answer" />
          <ColorSwatch name="TLE" oklch={INARA_PALETTE.status.tle} label="Time Limit" />
          <ColorSwatch name="RE" oklch={INARA_PALETTE.status.re} label="Runtime Error" />
          <ColorSwatch name="CE" oklch={INARA_PALETTE.status.ce} label="Compile Error" />
        </div>
      </section>

      {/* 2. Typography */}
      <section className="space-y-8">
        <div className="flex items-center gap-4">
          <div className="h-[2px] flex-1 bg-inara-border" />
          <h2 className="text-xs font-black opacity-40">02. Typography</h2>
        </div>
        <div className="grid md:grid-cols-2 gap-12">
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-inara-primary tracking-widest">Interface Sans</h3>
            <p className="text-4xl font-black">Figtree Black Italic</p>
            <p className="text-lg text-white/70">The quick brown fox jumps over the lazy dog. For joyful navigation and clear instructions.</p>
          </div>
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-inara-accent tracking-widest">Technical Mono</h3>
            <p className="text-4xl font-mono font-bold tracking-tight">JetBrains Mono</p>
            <p className="text-lg font-mono text-inara-primary/80">
              user_rank = 0x01;<br/>
              verdict: "ACCEPTED";<br/>
              [ 120ms ] [ 256MB ]
            </p>
          </div>
        </div>
      </section>

      {/* 3. Components */}
      <section className="space-y-8">
        <div className="flex items-center gap-4">
          <div className="h-[2px] flex-1 bg-inara-border" />
          <h2 className="text-xs font-black opacity-40">03. UI Elements</h2>
        </div>
        
        <div className="grid md:grid-cols-2 gap-8">
          {/* Card Showcase */}
          <div className="inara-block p-8 space-y-6">
            <div className="flex justify-between items-start">
              <h3 className="text-2xl font-black tracking-tight">The Inara Block</h3>
              <Badge className="inara-badge border-inara-primary text-inara-primary">Active</Badge>
            </div>
            <p className="text-white/60 text-sm leading-relaxed">
              Cards are the foundation of Inara. They feature a thick 3px border and a solid shadow offset to create a pixel-art depth effect.
            </p>
            <div className="flex gap-2">
              <div className="h-8 w-8 rounded-md bg-inara-primary/20 flex items-center justify-center text-inara-primary">
                <Zap className="w-4 h-4" />
              </div>
              <div className="h-8 w-8 rounded-md bg-inara-accent/20 flex items-center justify-center text-inara-accent">
                <Trophy className="w-4 h-4" />
              </div>
              <div className="h-8 w-8 rounded-md bg-inara-logic/20 flex items-center justify-center text-inara-logic">
                <Clock className="w-4 h-4" />
              </div>
            </div>
          </div>

          {/* Button Showcase */}
          <div className="space-y-6 bg-inara-muted/30 p-8 rounded-2xl border-2 border-dashed border-inara-border">
            <h3 className="text-sm font-bold uppercase tracking-widest opacity-50 mb-4">Tactile Controls</h3>
            <div className="flex flex-wrap gap-4">
              <button className="inara-btn inara-btn-primary">
                Primary Action
              </button>
              <button className="inara-btn bg-inara-accent border-inara-accent/50 text-white">
                Accent Trigger
              </button>
              <button className="inara-btn bg-white/5 border-white/10 text-white hover:border-inara-primary">
                Ghost Block
              </button>
            </div>
            <div className="pt-4 space-y-2">
               <p className="text-[10px] font-mono text-inara-primary font-bold uppercase">Button States:</p>
               <div className="flex gap-4 items-center">
                  <span className="text-xs text-white/40">Active: Sinks by 4px</span>
                  <span className="text-xs text-white/40">Hover: Scales + Spring</span>
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Specialized Data */}
      <section className="space-y-8 pb-20">
        <div className="flex items-center gap-4">
          <div className="h-[2px] flex-1 bg-inara-border" />
          <h2 className="text-xs font-black uppercase tracking-[0.3em] opacity-40">04. Data Objects</h2>
        </div>
        
        <div className="inara-block overflow-hidden">
          <div className="bg-inara-muted/50 p-4 border-b-2 border-inara-border flex justify-between items-center">
            <span className="text-xs font-bold text-white/60">System Standings</span>
            <div className="flex gap-2">
              <div className="w-2 h-2 rounded-full bg-rose-500" />
              <div className="w-2 h-2 rounded-full bg-amber-500" />
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
            </div>
          </div>
          <div className="p-0">
            <table className="w-full text-left border-collapse">
              <thead className="bg-inara-bg">
                <tr className="border-b-2 border-inara-border">
                  <th className="p-4 text-[10px] font-black opacity-40">Rank</th>
                  <th className="p-4 text-[10px] font-black opacity-40">User</th>
                  <th className="p-4 text-[10px] font-black opacity-40 text-center">Score</th>
                  <th className="p-4 text-[10px] font-black opacity-40 text-right">Verdict</th>
                </tr>
              </thead>
              <tbody className="divide-y-2 divide-inara-border/10">
                <DemoRow rank="01" name="tourist" score="2400" verdict="OK" color="text-inara-ac" />
                <DemoRow rank="02" name="Benq" score="2350" verdict="OK" color="text-inara-ac" />
                <DemoRow rank="03" name="Um_nik" score="2100" verdict="WA" color="text-inara-wa" />
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </main>
  )
}

function ColorSwatch({ name, oklch, label }: { name: string, oklch: string, label: string }) {
  return (
    <div className="space-y-3 group">
      <div 
        className="h-24 rounded-xl border-2 border-inara-border shadow-lg transition-transform group-hover:-translate-y-1" 
        style={{ backgroundColor: `oklch(${oklch})` }} 
      />
      <div>
        <p className="text-xs font-black uppercase tracking-tighter">{name}</p>
        <p className="text-[10px] font-mono text-white/40">{label}</p>
      </div>
    </div>
  )
}

function DemoRow({ rank, name, score, verdict, color }: { rank: string, name: string, score: string, verdict: string, color: string }) {
  return (
    <tr className="hover:bg-inara-primary/5 transition-colors group">
      <td className="p-4 font-mono font-bold text-white/40 group-hover:text-inara-primary">{rank}</td>
      <td className="p-4">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-inara-muted border border-inara-border flex items-center justify-center">
            <User className="w-3 h-3" />
          </div>
          <span className="font-bold">{name}</span>
        </div>
      </td>
      <td className="p-4 text-center font-mono font-black text-inara-primary">{score}</td>
      <td className="p-4 text-right">
        <span className={`inara-badge ${color} border-current`}>{verdict}</span>
      </td>
    </tr>
  )
}
