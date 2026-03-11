'use client'

import { useEffect, useRef } from 'react'
import { Clock, BarChart3 } from 'lucide-react'
import { cn } from '@/lib/utils'

export function ProblemStatement({ html, oj, timeLimit, memoryLimit }: { html: string, oj: string, timeLimit?: string, memoryLimit?: string }) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // MathJax initialization and typesetting
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
        svg: { fontCache: 'global' }
      }
      const script = document.createElement('script')
      script.id = scriptId
      script.src = 'https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js'
      script.async = true
      document.head.appendChild(script)
    } else {
      setTimeout(triggerMathJax, 200)
    }
  }, [html])

  return (
    <div className="inara-block p-8 bg-white min-h-[400px]">
      {/* 1. Header Metadata Bar */}
      <div className="flex flex-wrap gap-8 mb-10 pb-8 border-b-2 border-inara-border/10">
        {timeLimit && (
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-bold uppercase text-inara-primary tracking-widest leading-none">Time Limit</span>
            <div className="flex items-center gap-2 font-mono text-sm font-bold text-inara-logic">
              <Clock className="w-4 h-4 text-inara-primary" /> {timeLimit}
            </div>
          </div>
        )}
        {memoryLimit && (
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-bold uppercase text-inara-primary tracking-widest leading-none">Memory Limit</span>
            <div className="flex items-center gap-2 font-mono text-sm font-bold text-inara-logic">
              <BarChart3 className="w-4 h-4 text-inara-primary" /> {memoryLimit}
            </div>
          </div>
        )}
      </div>

      {/* 2. Raw Content Container with Universal Inara Overrides */}
      <div 
        ref={containerRef}
        className={cn(
          "oj-content prose prose-slate max-w-none text-inara-logic leading-relaxed",
          oj === 'CF' ? 'cf-raw' : 'ac-raw'
        )}
        dangerouslySetInnerHTML={{ __html: html }}
      />
      
      <style jsx global>{`
        /* Universal Hides */
        .oj-content .header, .oj-content .property-title, .oj-content .title, .oj-content .time-limit, .oj-content .memory-limit, .oj-content .input-file, .oj-content .output-file {
          display: none !important;
        }

        /* Generic Text Coloring */
        .oj-content, .oj-content p, .oj-content div, .oj-content span, .oj-content li {
          color: var(--inara-logic) !important;
        }

        /* Section Titles (VT323) */
        .oj-content h2, .oj-content h3, .oj-content .section-title {
          font-family: var(--font-vt323) !important;
          font-size: 1.5rem !important;
          color: var(--inara-primary) !important;
          margin-top: 2rem !important;
          margin-bottom: 0.75rem !important;
          border-bottom: 2px solid var(--inara-border) !important;
          padding-bottom: 0.125rem !important;
          text-transform: none !important;
          font-weight: 400 !important;
        }

        /* Mono Elements (JetBrains Mono) */
        .oj-content code, .oj-content tt, .oj-content .tex-font-size-small {
          font-family: var(--font-jetbrains) !important;
          background: oklch(var(--inara-muted) / 0.4) !important;
          padding: 0.1rem 0.2rem !important;
          border-radius: 0.25rem !important;
          font-size: 0.9em !important;
          color: var(--inara-primary-dark) !important;
        }

        /* Sample Tests Styling (VJudge Style) */
        .oj-content .sample-test, .oj-content .sample-tests {
          margin-top: 1.5rem !important;
        }
        
        .oj-content .sample-test {
          border: 2px solid var(--inara-border) !important;
          border-radius: 0.5rem !important;
          overflow: hidden;
          margin-bottom: 1.5rem !important;
          background: white !important;
        }

        /* Force vertical layout for samples */
        .oj-content .sample-test .input, .oj-content .sample-test .output {
          display: block !important;
          width: 100% !important;
          padding: 0 !important;
        }

        .oj-content .sample-test .input::before, .oj-content .sample-test .output::before {
          display: block;
          padding: 0.375rem 0.75rem;
          background: oklch(var(--inara-muted));
          font-family: var(--font-vt323);
          font-size: 1.1rem;
          color: var(--inara-primary);
          border-bottom: 2px solid var(--inara-border);
        }
        .oj-content .sample-test .input::before { content: "Input Data"; }
        .oj-content .sample-test .output::before { content: "Output Data"; }
        
        .oj-content .sample-test .output {
          border-top: 2px solid var(--inara-border) !important;
        }

        .oj-content pre {
          background: transparent !important;
          padding: 0.75rem 1rem !important;
          margin: 0 !important;
          font-family: var(--font-jetbrains) !important;
          font-size: 0.8125rem !important;
          line-height: 1.4 !important;
          color: var(--inara-logic) !important;
          border: none !important;
          overflow-x: auto !important;
        }

        /* MathJax / LaTeX */
        mjx-container {
          color: var(--inara-logic) !important;
          font-family: 'MathJax_Main', 'Times New Roman', serif !important;
        }

        /* Language Hides */
        .oj-content .lang-ja { display: none !important; }
        .oj-content .lang-en { display: block !important; }
      `}</style>
    </div>
  )
}

declare global {
  interface Window {
    MathJax: any
  }
}
