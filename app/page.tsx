import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Zap, Shield, Globe, Trophy } from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col min-h-[calc(100vh-4.5rem)] relative overflow-hidden w-full">
      {/* Hero Section */}
      <section className="flex-1 flex flex-col items-center justify-center py-20 px-4 text-center z-10 w-full max-w-7xl mx-auto">
        <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-inara-primary/10 border-2 border-inara-primary/30 text-inara-primary text-xs font-black uppercase tracking-widest mb-8 animate-pulse">
          <Zap className="w-4 h-4 fill-inara-primary" />
          <span>Inara System v0.1 Online</span>
        </div>
        
        <h1 className="text-6xl md:text-8xl font-black tracking-tighter mb-6 bg-gradient-to-b from-white to-white/60 bg-clip-text text-transparent uppercase italic leading-none">
          Code <span className="text-inara-primary">Locally</span> <br />
          Submit <span className="text-inara-accent">Globally</span>
        </h1>
        
        <p className="text-xl text-white/60 max-w-2xl mx-auto mb-12 font-medium leading-relaxed">
          The first distributed bridge for competitive programming. <br/>
          <span className="inara-data font-mono">[ 0% rate-limiting ] [ 100% reliable ]</span>
        </p>
        
        <div className="flex flex-col sm:flex-row gap-6 justify-center w-full sm:w-auto">
          <Button size="lg" className="inara-btn inara-btn-primary h-14 px-10 text-lg" asChild>
            <Link href="/contests">
              Enter Arena <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
          </Button>
          <Button size="lg" variant="outline" className="inara-btn h-14 px-10 text-lg bg-transparent border-white/20 hover:border-inara-accent hover:text-inara-accent text-white" asChild>
            <Link href="/extension">
              Install Bridge
            </Link>
          </Button>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 px-4 border-t-4 border-inara-border bg-white/[0.02] w-full">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            <Feature 
              icon={<Shield className="w-8 h-8 text-inara-primary" />}
              title="Byte-Safe"
              description="Submissions flow through your browser. Your session, your security, zero blocks."
            />
            <Feature 
              icon={<Globe className="w-8 h-8 text-inara-accent" />}
              title="Multi-Node"
              description="Native scraping and submission for Codeforces and AtCoder with real-time feedback."
            />
            <Feature 
              icon={<Trophy className="w-8 h-8 text-inara-logic" />}
              title="Live Data"
              description="Leaderboards that pulse with life. Watch your rank climb in real-time."
            />
          </div>
        </div>
      </section>
    </div>
  );
}

function Feature({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="inara-block p-8 space-y-4">
      <div className="bg-inara-bg/50 p-4 rounded-xl w-fit border-2 border-inara-border">
        {icon}
      </div>
      <h3 className="text-2xl font-black uppercase tracking-tight">{title}</h3>
      <p className="text-white/50 leading-relaxed text-sm font-medium">{description}</p>
    </div>
  );
}
