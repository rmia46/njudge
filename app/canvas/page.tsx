'use client'

import { INARA_PALETTE } from '@/lib/inara-colors'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Trophy, Zap, Clock, Code, User, Settings, ArrowRight, Info, AlertTriangle, CheckCircle2 } from 'lucide-react'

export default function CanvasPage() {
  return (
    <main className="max-w-7xl mx-auto py-12 px-4 space-y-16 w-full">
      <header className="space-y-4">
        <div className="inline-block px-3 py-1 rounded-md bg-inara-primary/10 border-2 border-inara-primary/20 text-inara-primary text-[10px] font-bold tracking-widest">
          Inara Lab v0.5
        </div>
        <h1 className="text-5xl md:text-7xl font-black italic uppercase tracking-tighter text-inara-logic">
          Design <span className="text-inara-primary">Canvas</span>
        </h1>
        <p className="text-inara-logic/60 text-xl max-w-2xl font-medium">
          The playground for Bit-Art Digitalism. Tune the personality of nJudge here.
        </p>
      </header>

      {/* 1. Color Palette */}
      <section className="space-y-8">
        <div className="flex items-center gap-4 text-inara-logic">
          <div className="h-[2px] flex-1 bg-inara-border/30" />
          <h2 className="text-xs font-black opacity-40">01. Color Palette</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <ColorSwatch name="Primary" oklch={INARA_PALETTE.primary.base} label="Grounded Green" />
          <ColorSwatch name="Accent" oklch={INARA_PALETTE.accent.base} label="Muted Blue" />
          <ColorSwatch name="Secondary" oklch={INARA_PALETTE.secondary.base} label="Deep Navy" />
          <ColorSwatch name="Surface" oklch={INARA_PALETTE.monolith.bg} label="Soft Sage" />
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
        <div className="flex items-center gap-4 text-inara-logic">
          <div className="h-[2px] flex-1 bg-inara-border/30" />
          <h2 className="text-xs font-black opacity-40">02. Typography</h2>
        </div>
        <div className="grid md:grid-cols-2 gap-12 text-inara-logic">
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-inara-primary tracking-widest">Interface Sans</h3>
            <p className="text-4xl font-black">Inter Regular</p>
            <p className="text-lg text-inara-logic/70">The quick brown fox jumps over the lazy dog. For joyful navigation and clear instructions.</p>
          </div>
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-inara-accent tracking-widest">Technical Mono</h3>
            <p className="text-4xl font-mono font-bold tracking-tight">JetBrains Mono</p>
            <p className="text-lg font-mono opacity-60">
              user_rank = 0x01;<br/>
              verdict: "ACCEPTED";<br/>
              [ 120ms ] [ 256MB ]
            </p>
          </div>
        </div>
      </section>

      {/* 3. Components */}
      <section className="space-y-8">
        <div className="flex items-center gap-4 text-inara-logic">
          <div className="h-[2px] flex-1 bg-inara-border/30" />
          <h2 className="text-xs font-black opacity-40">03. UI Elements</h2>
        </div>
        
        <div className="grid md:grid-cols-2 gap-8">
          {/* Card Showcase */}
          <div className="inara-block p-8 space-y-6">
            <div className="flex justify-between items-start">
              <h3 className="text-2xl font-black tracking-tight text-inara-logic">The Inara Block</h3>
              <Badge className="inara-badge border-inara-primary text-inara-primary">Active</Badge>
            </div>
            <p className="text-inara-logic/60 text-sm leading-relaxed">
              Cards are the foundation of Inara. They feature a thick 3px border and a solid shadow offset to create a pixel-art depth effect.
            </p>
            <div className="flex gap-2">
              <div className="h-8 w-8 rounded-md bg-inara-primary/10 flex items-center justify-center text-inara-primary border border-inara-primary/20">
                <Zap className="w-4 h-4" />
              </div>
              <div className="h-8 w-8 rounded-md bg-inara-accent/10 flex items-center justify-center text-inara-accent border border-inara-accent/20">
                <Trophy className="w-4 h-4" />
              </div>
              <div className="h-8 w-8 rounded-md bg-inara-logic/10 flex items-center justify-center text-inara-logic border border-inara-logic/20">
                <Clock className="w-4 h-4" />
              </div>
            </div>
          </div>

          {/* Button Showcase */}
          <div className="space-y-6 bg-inara-muted p-8 rounded-xl border-2 border-dashed border-inara-border/20">
            <h3 className="text-sm font-bold text-inara-logic/50 mb-4">Tactile Controls</h3>
            <div className="flex flex-wrap gap-4">
              <button className="inara-btn inara-btn-primary">
                Primary Action
              </button>
              <button className="inara-btn bg-white border-inara-border text-inara-logic hover:bg-inara-muted">
                Neutral Block
              </button>
              <button className="inara-btn bg-inara-accent text-white border-inara-accent/50">
                Accent Trigger
              </button>
            </div>
            <div className="pt-4 space-y-2">
               <p className="text-[10px] font-mono text-inara-primary font-bold uppercase">Feedback States:</p>
               <div className="flex gap-4 items-center">
                  <span className="text-xs text-inara-logic/40 underline decoration-dotted underline-offset-4">Active: Sinks by 2px</span>
                  <span className="text-xs text-inara-logic/40 underline decoration-dotted underline-offset-4">Hover: Scale + Spring</span>
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Specialized Data */}
      <section className="space-y-8 pb-20">
        <div className="flex items-center gap-4 text-inara-logic">
          <div className="h-[2px] flex-1 bg-inara-border/30" />
          <h2 className="text-xs font-black opacity-40">04. Data Objects</h2>
        </div>
        
        <div className="inara-block overflow-hidden">
          <div className="bg-inara-muted p-4 border-b-2 border-inara-border flex justify-between items-center">
            <span className="text-xs font-bold text-inara-logic/60">System Standings</span>
            <div className="flex gap-2 text-inara-logic/20">
              <div className="w-2 h-2 rounded-full bg-current border border-black/10" />
              <div className="w-2 h-2 rounded-full bg-current border border-black/10" />
              <div className="w-2 h-2 rounded-full bg-current border border-black/10" />
            </div>
          </div>
          <div className="p-0 overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-inara-bg/50">
                <tr className="border-b-2 border-inara-border">
                  <th className="p-4 text-[10px] font-black uppercase text-inara-logic/40">Rank</th>
                  <th className="p-4 text-[10px] font-black uppercase text-inara-logic/40">User</th>
                  <th className="p-4 text-[10px] font-black uppercase text-inara-logic/40 text-center">Score</th>
                  <th className="p-4 text-[10px] font-black uppercase text-inara-logic/40 text-right">Verdict</th>
                </tr>
              </thead>
              <tbody className="divide-y-2 divide-inara-border/5 text-inara-logic">
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
        className="h-24 rounded-lg border-2 border-inara-border shadow-md transition-transform group-hover:-translate-y-1" 
        style={{ backgroundColor: `oklch(${oklch})` }} 
      />
      <div className="text-inara-logic">
        <p className="text-xs font-black uppercase tracking-tighter">{name}</p>
        <p className="text-[10px] font-mono opacity-40">{label}</p>
      </div>
    </div>
  )
}

function DemoRow({ rank, name, score, verdict, color }: { rank: string, name: string, score: string, verdict: string, color: string }) {
  return (
    <tr className="hover:bg-inara-primary/5 transition-colors group">
      <td className="p-4 font-mono font-bold opacity-40 group-hover:text-inara-primary">{rank}</td>
      <td className="p-4">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-inara-muted border border-inara-border/20 flex items-center justify-center">
            <User className="w-3 h-3 text-inara-logic/40" />
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
