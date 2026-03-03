'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { CheckCircle2, XCircle, Info } from 'lucide-react'

export function BridgeTester() {
  const [status, setStatus] = useState<'IDLE' | 'PENDING' | 'SUCCESS' | 'ERROR'>('IDLE')
  const [response, setResponse] = useState<any>(null)

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.source !== window) return
      if (event.data && event.data.type === 'NJUDGE_PING_RESPONSE') {
        setStatus('SUCCESS')
        setResponse(event.data.payload)
      }
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [])

  const testPing = () => {
    setStatus('PENDING')
    window.postMessage({
      type: 'NJUDGE_PING',
      requestId: Math.random().toString(36).substring(7)
    }, '*')
    
    // Timeout if no response
    setTimeout(() => {
      if (status === 'PENDING') setStatus('ERROR')
    }, 2000)
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Extension Bridge Tester</CardTitle>
        <CardDescription>Verify if the nJudge Bridge extension is installed and working.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={testPing} 
          disabled={status === 'PENDING'}
          className="w-full"
        >
          {status === 'PENDING' ? 'Pinging...' : 'Send Ping to Extension'}
        </Button>

        {status === 'SUCCESS' && (
          <Alert variant="default" className="bg-emerald-50 border-emerald-200">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <AlertTitle className="text-emerald-800">Connection Established!</AlertTitle>
            <AlertDescription className="text-emerald-700">
              The extension responded: {JSON.stringify(response)}
            </AlertDescription>
          </Alert>
        )}

        {status === 'ERROR' && (
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertTitle>Connection Failed</AlertTitle>
            <AlertDescription>
              The extension did not respond. Make sure it is installed and enabled in Developer Mode.
            </AlertDescription>
          </Alert>
        )}

        <Alert variant="secondary" className="bg-slate-50 border-slate-200">
          <Info className="h-4 w-4 text-slate-600" />
          <AlertTitle className="text-slate-800">How to test:</AlertTitle>
          <AlertDescription className="text-slate-700 text-xs">
            1. Open chrome://extensions<br/>
            2. Enable "Developer Mode"<br/>
            3. Click "Load unpacked" and select the `extension` folder.<br/>
            4. Refresh this page.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  )
}
