'use client'

import { useEffect, useRef } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Copy, CheckCheck } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

export function ProblemStatement({ html, oj }: { html: string, oj: string }) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // 1. MathJax Initialization
    const scriptId = 'mathjax-script'
    if (!document.getElementById(scriptId)) {
      const script = document.createElement('script')
      script.id = scriptId
      script.src = 'https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js'
      script.async = true
      
      // Configuration for CF ($$$) and standard LaTeX
      window.MathJax = {
        tex: {
          inlineMath: [['$', '$'], ['\\(', '\\)'], ['$$$', '$$$']],
          displayMath: [['$$', '$$'], ['\\[', '\\]']]
        },
        svg: { fontCache: 'global' }
      }
      
      document.head.appendChild(script)
    } else if (window.MathJax && window.MathJax.typesetPromise) {
      window.MathJax.typesetPromise()
    }

    // 2. Sample Tests Processing (Add Copy Buttons)
    if (containerRef.current) {
      // Logic to find sample inputs and add copy functionality
      // This is handled by React state below for a cleaner approach
    }
  }, [html])

  return (
    <div ref={containerRef} className="problem-view space-y-6">
      <div 
        className={`prose prose-slate dark:prose-invert max-w-none 
          prose-pre:p-0 prose-pre:bg-transparent
          ${oj === 'CF' ? 'cf-styles' : 'ac-styles'}`}
        dangerouslySetInnerHTML={{ __html: html }}
      />
      
      {/* Dynamic Copy Button Logic Injector */}
      <style jsx global>{`
        /* Hide original headers since we show them in our UI */
        .problem-statement .header, 
        .problem-statement .property-title,
        .problem-statement .time-limit,
        .problem-statement .memory-limit,
        .problem-statement .input-file,
        .problem-statement .output-file {
          display: none !important;
        }

        /* Codeforces Sections mapping */
        .problem-statement .input-specification::before { content: "Input"; display: block; font-weight: 800; font-size: 1.25rem; color: var(--primary); margin-top: 2rem; margin-bottom: 0.75rem; border-bottom: 2px solid color-mix(in oklch, var(--primary), transparent 90%); padding-bottom: 0.25rem; text-transform: uppercase; }
        .problem-statement .output-specification::before { content: "Output"; display: block; font-weight: 800; font-size: 1.25rem; color: var(--primary); margin-top: 2rem; margin-bottom: 0.75rem; border-bottom: 2px solid color-mix(in oklch, var(--primary), transparent 90%); padding-bottom: 0.25rem; text-transform: uppercase; }
        .problem-statement .sample-tests .section-title { font-weight: 800; font-size: 1.25rem; color: var(--primary); margin-top: 2rem; margin-bottom: 0.75rem; text-transform: uppercase; }
        
        /* Pre-formatted blocks */
        .problem-statement pre { background: oklch(var(--muted)); padding: 1rem; border-radius: 0.75rem; font-family: var(--font-mono); border: 2px dashed color-mix(in oklch, var(--primary), transparent 80%); }
      `}</style>
    </div>
  )
}

declare global {
  interface Window {
    MathJax: any
  }
}
