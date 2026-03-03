import { BridgeTester } from "@/components/bridge-tester";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-background">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm flex flex-col gap-8">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold tracking-tight text-emerald-600">nJudge</h1>
          <p className="text-muted-foreground">The Client-Side Bridge Competitive Programming Platform</p>
        </div>
        
        <BridgeTester />
      </div>
    </main>
  );
}
