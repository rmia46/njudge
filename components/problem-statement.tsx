'use client'

import { useEffect, useRef } from 'react'

export function ProblemStatement({ html, oj }: { html: string, oj: string }) {
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
        svg: { fontCache: 'global' },
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
      // Small delay to ensure DOM is updated before typesetting
      setTimeout(triggerMathJax, 100)
    }
  }, [html])

  return (
    <div className="problem-view inara-block p-8 bg-white min-h-[400px]">
      <div 
        ref={containerRef}
        className={`prose prose-slate max-w-none 
          prose-pre:p-0 prose-pre:bg-transparent
          text-inara-logic leading-relaxed
          ${oj === 'CF' ? 'cf-styles' : 'ac-styles'}`}
        dangerouslySetInnerHTML={{ __html: html }}
      />
      
      <style jsx global>{`
        /* Reset original styles that clash with our light theme */
        .problem-view .header, 
        .problem-view .property-title,
        .problem-view .time-limit,
        .problem-view .memory-limit,
        .problem-view .input-file,
        .problem-view .output-file {
          display: none !important;
        }

        /* Standardize Section Titles */
        .problem-view .section-title, 
        .problem-view h2, 
        .problem-view h3 { 
          font-family: var(--font-vt323) !important;
          font-weight: 400 !important;
          font-size: 1.75rem !important;
          color: var(--inara-primary) !important;
          margin-top: 2.5rem !important;
          margin-bottom: 1rem !important;
          border-bottom: 2px solid color-mix(in oklch, var(--inara-primary), transparent 80%) !important;
          padding-bottom: 0.25rem !important;
          text-transform: none !important;
        }

        /* Formatted Code Blocks (Samples) */
        .problem-view pre { 
          background: oklch(var(--inara-muted)) !important; 
          padding: 1.25rem !important; 
          border-radius: 0.5rem !important; 
          font-family: var(--font-jetbrains) !important; 
          font-size: 0.875rem !important;
          border: 2px dashed color-mix(in oklch, var(--inara-primary), transparent 70%) !important;
          margin: 1rem 0 !important;
          color: var(--inara-logic) !important;
          overflow-x: auto !important;
        }

        /* LaTeX / Math Elements */
        mjx-container {
          color: var(--inara-primary) !important;
          font-size: 110% !important;
        }

        /* AtCoder specific cleanup */
        .problem-view .lang-en { display: block !important; }
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
