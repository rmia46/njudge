'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Download, CheckCircle2, XCircle, HelpCircle, Chrome, Globe } from 'lucide-react'

export function ExtensionInstaller() {
  const [status, setStatus] = useState<'CHECKING' | 'DETECTED' | 'NOT_FOUND'>('CHECKING')
  const [platform, setPlatform] = useState<'chrome' | 'firefox'>('chrome')

  useEffect(() => {
    // Detect browser for default tab
    if (typeof window !== 'undefined') {
      const ua = window.navigator.userAgent.toLowerCase()
      if (ua.includes('firefox')) setPlatform('firefox')
    }

    const checkExtension = () => {
      const requestId = Math.random().toString(36).substring(7)
      const handleResponse = (event: MessageEvent) => {
        if (event.source !== window) return
        if (event.data && event.data.type === 'NJUDGE_PING_RESPONSE' && event.data.requestId === requestId) {
          setStatus('DETECTED')
          window.removeEventListener('message', handleResponse)
        }
      }
      window.addEventListener('message', handleResponse)
      window.postMessage({ type: 'NJUDGE_PING', requestId }, '*')
      setTimeout(() => {
        setStatus((current) => current === 'CHECKING' ? 'NOT_FOUND' : current)
        window.removeEventListener('message', handleResponse)
      }, 1500)
    }
    checkExtension()
  }, [])

  return (
    <div className="max-w-4xl mx-auto py-12 px-4">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-extrabold tracking-tight mb-4">Bridge the Gap</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          nJudge uses a local browser bridge to bypass online judge limitations and keep you in the flow.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8 items-start">
        <div className="space-y-6">
          <Card className={status === 'DETECTED' ? 'border-emerald-500 bg-emerald-50/10' : ''}>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Extension Status</CardTitle>
                {status === 'CHECKING' && <div className="animate-pulse h-4 w-4 bg-slate-300 rounded-full" />}
                {status === 'DETECTED' && <CheckCircle2 className="text-emerald-500 h-6 w-6" />}
                {status === 'NOT_FOUND' && <XCircle className="text-rose-500 h-6 w-6" />}
              </div>
              <CardDescription>
                {status === 'CHECKING' ? 'Verifying bridge connection...' : 
                 status === 'DETECTED' ? 'You are all set! The bridge is active.' : 
                 'The bridge extension was not detected in your browser.'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {status === 'NOT_FOUND' && (
                <Button asChild className="w-full bg-emerald-600 hover:bg-emerald-700 h-11">
                  <a href={platform === 'chrome' ? "/njudge-extension-chrome.zip" : "/njudge-extension-firefox.zip"} download>
                    <Download className="mr-2 h-4 w-4" /> Download for {platform === 'chrome' ? 'Chrome/Edge' : 'Firefox'} (.zip)
                  </a>
                </Button>
              )}
              {status === 'DETECTED' && (
                <div className="text-emerald-800 text-sm font-medium p-3 bg-emerald-100/50 rounded-lg border border-emerald-200">
                  Ready to submit to Codeforces and AtCoder.
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <HelpCircle className="w-4 h-4" /> Why do I need this?
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-3">
              <p>
                Platforms like Codeforces use Cloudflare and rate-limiters to prevent automated submissions from servers.
              </p>
              <p>
                The nJudge Bridge allows you to submit directly from <strong>your browser</strong> using <strong>your session</strong>, ensuring 100% reliable submissions without being blocked.
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Tabs value={platform} onValueChange={(v) => setPlatform(v as any)} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="chrome" className="gap-2">
                <Chrome className="w-4 h-4" /> Chrome / Edge
              </TabsTrigger>
              <TabsTrigger value="firefox" className="gap-2">
                <Globe className="w-4 h-4" /> Firefox
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="chrome" className="space-y-4 pt-4">
              <h3 className="font-bold">Installation Steps (Chromium)</h3>
              <Step number="1" title="Download & Extract" desc="Download the .zip and extract it to a folder." />
              <Step number="2" title="Extensions Page" desc={<>Go to <code className="bg-slate-100 px-1 rounded">chrome://extensions</code></>} />
              <Step number="3" title="Developer Mode" desc="Enable 'Developer mode' in the top right." />
              <Step number="4" title="Load Unpacked" desc="Click 'Load unpacked' and select the extracted folder." />
            </TabsContent>

            <TabsContent value="firefox" className="space-y-4 pt-4">
              <h3 className="font-bold">Installation Steps (Firefox)</h3>
              <Step number="1" title="Download & Extract" desc="Download the .zip and extract it to a folder." />
              <Step number="2" title="Debugging Page" desc={<>Go to <code className="bg-slate-100 px-1 rounded">about:debugging#/runtime/this-firefox</code></>} />
              <Step number="3" title="Load Temporary" desc="Click 'Load Temporary Add-on...' button." />
              <Step number="4" title="Select Manifest" desc="Select the 'manifest.json' file from the extracted folder." />
              <Alert variant="default" className="mt-4 bg-amber-50 border-amber-200">
                <HelpCircle className="h-4 w-4 text-amber-600" />
                <AlertTitle className="text-amber-800 text-xs font-bold">Note for Firefox</AlertTitle>
                <AlertDescription className="text-amber-700 text-[10px] leading-tight">
                  Temporary extensions are removed when Firefox restarts. For permanent use, use Firefox Developer Edition or Nightly.
                </AlertDescription>
              </Alert>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}

function Step({ number, title, desc }: { number: string, title: string, desc: React.ReactNode }) {
  return (
    <div className="flex gap-4">
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-sm">
        {number}
      </div>
      <div>
        <div className="font-semibold">{title}</div>
        <div className="text-sm text-muted-foreground">{desc}</div>
      </div>
    </div>
  )
}
