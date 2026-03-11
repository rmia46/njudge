'use client'

import { useEffect, useRef } from 'react'
import { Clock, BarChart3 } from 'lucide-react'
import { cn } from '@/lib/utils'

export function ProblemStatement({ html, oj, timeLimit, memoryLimit }: { html: string, oj: string, timeLimit?: string, memoryLimit?: string }) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // 1. MathJax Initialization and Trigger
    const scriptId = 'mathjax-script'
    
    const triggerMathJax = () => {
      if (window.MathJax && window.MathJax.typesetPromise) {
        window.MathJax.typesetPromise([containerRef.current]).catch((err: any) => 
          console.error('MathJax typeset failed:', err)
        )
      }
    }

    if (!document.getElementById(scriptId)) {
      window.MathJax = {
        tex: {
          inlineMath: [['$', '$'], ['\\(', '\\)'], ['$$$', '$$$']],
          displayMath: [['$$', '$$'], ['\\[', '\\]']]
        },
        svg: { 
          fontCache: 'global',
          scale: 1.1
        },
        startup: {
          pageReady: () => {
            return window.MathJax.startup.defaultPageReady().then(triggerMathJax)
          }
        }
      }

      const script = document.createElement('script')
      script.id = scriptId
      script.src = 'https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js'
      script.async = true
      document.head.appendChild(script)
    } else {
      setTimeout(triggerMathJax, 200)
      setTimeout(triggerMathJax, 1000)
    }
  }, [html, oj])

  return (
    <div className="problem-view inara-block p-8 bg-white min-h-[400px]">
      {/* Problem Metadata Strip */}
      <div className="flex flex-wrap gap-8 mb-8 pb-6 border-b-2 border-inara-border/10">
        {timeLimit && (
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-bold uppercase text-inara-primary tracking-widest">Time Limit</span>
            <div className="flex items-center gap-2 font-mono text-sm font-bold text-inara-logic">
              <Clock className="w-4 h-4 text-inara-primary" /> {timeLimit}
            </div>
          </div>
        )}
        {memoryLimit && (
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-bold uppercase text-inara-primary tracking-widest">Memory Limit</span>
            <div className="flex items-center gap-2 font-mono text-sm font-bold text-inara-logic">
              <BarChart3 className="w-4 h-4 text-inara-primary" /> {memoryLimit}
            </div>
          </div>
        )}
      </div>

      <div 
        ref={containerRef}
        className={cn(
          "prose prose-slate max-w-none text-inara-logic leading-relaxed",
          oj === 'CF' ? 'cf-styles' : 'ac-styles'
        )}
        dangerouslySetInnerHTML={{ __html: html }}
      />
      
      <style jsx global>{`
        /* Reset original styles - HIDE REDUNDANT DATA */
        .problem-view .header, 
        .problem-view .property-title,
        .problem-view .time-limit,
        .problem-view .memory-limit,
        .problem-view .input-file,
        .problem-view .output-file { 
          display: none !important; 
        }

        /* Hide original section titles inside samples to prevent "Input" "Input" double text */
        .problem-view .sample-test .section-title,
        .problem-view .sample-test .title {
          display: none !important;
        }

        /* Very Compact Vertical Samples */
        .problem-view .sample-tests {
          margin-top: 1.5rem !important;
        }
        .problem-view .sample-test {
          margin-bottom: 1rem !important;
          border: 2px solid var(--inara-border) !important;
          border-radius: 0.5rem !important;
          overflow: hidden;
        }
        
        .problem-view .input, .problem-view .output {
          padding: 0 !important;
        }

        .problem-view .input::before, .problem-view .output::before {
          display: block;
          padding: 0.375rem 0.75rem;
          background: oklch(var(--inara-muted));
          font-family: var(--font-vt323);
          font-size: 1.25rem;
          color: var(--inara-primary);
          font-weight: 400;
          border-bottom: 2px solid var(--inara-border);
        }
        .problem-view .input::before { content: "Input"; }
        .problem-view .output::before { content: "Output"; }
        
        .problem-view .output {
          border-top: 2px solid var(--inara-border) !important;
        }

        .problem-view pre { 
          background: oklch(var(--inara-muted) / 0.1) !important; 
          padding: 0.75rem !important; 
          margin: 0 !important;
          font-family: var(--font-jetbrains) !important; 
          font-size: 0.8125rem !important;
          line-height: 1.4 !important;
          color: var(--inara-logic) !important;
          border: none !important;
        }

        /* Generic Code and Mono formatting */
        .problem-view code, .problem-view tt, .problem-view .tex-font-size-small {
          font-family: var(--font-jetbrains) !important;
          background: oklch(var(--inara-muted) / 0.4) !important;
          padding: 0.1rem 0.2rem !important;
          border-radius: 0.25rem !important;
          font-size: 0.9em !important;
          color: var(--inara-primary-dark) !important;
        }

        /* MathJax (LaTeX) Styling - Authentic Serif Math */
        mjx-container {
          color: var(--inara-logic) !important;
          font-family: 'MathJax_Main', 'Times New Roman', serif !important;
        }

        /* Section Titles */
        .problem-view .section-title, .problem-view h2, .problem-view h3 { 
          font-family: var(--font-vt323) !important;
          font-size: 1.375rem !important;
          color: var(--inara-primary) !important;
          margin-top: 1.5rem !important;
          margin-bottom: 0.5rem !important;
          border-bottom: 1px solid var(--inara-border) !important;
          padding-bottom: 0.125rem !important;
        }

        /* Hide language specific noise */
        .problem-view .lang-ja { display: none !important; }
      `}</style>
    </div>
  )
}

declare global {
  interface Window {
    MathJax: any
  }
}
