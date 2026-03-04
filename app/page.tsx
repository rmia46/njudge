import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Zap, Shield, Globe, Trophy } from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)]">
      {/* Hero Section */}
      <section className="flex-1 flex flex-col items-center justify-center py-20 px-4 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-sm font-medium mb-6">
          <Zap className="w-4 h-4 fill-emerald-500" />
          <span>Distributed Bridge Architecture v1.0</span>
        </div>
        
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 bg-gradient-to-b from-slate-900 to-slate-600 bg-clip-text text-transparent">
          Code locally. <br />
          Submit globally.
        </h1>
        
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
          The first competitive programming platform that uses a browser-based bridge to bypass OJ limitations. Zero rate-limiting. Zero IP blocks.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4">
          <Button size="lg" className="bg-emerald-600 hover:bg-emerald-700 h-12 px-8 text-lg" asChild>
            <Link href="/contests">
              Explore Contests <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
          </Button>
          <Button size="lg" variant="outline" className="h-12 px-8 text-lg" asChild>
            <Link href="/extension">
              Install Bridge
            </Link>
          </Button>
        </div>
      </section>

      {/* Features Grid */}
      <section className="bg-slate-50 border-t py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-3 gap-12">
            <Feature 
              icon={<Shield className="w-8 h-8 text-emerald-600" />}
              title="Safe & Secure"
              description="Submissions use your own browser session. No need to share passwords or handle complex API keys."
            />
            <Feature 
              icon={<Globe className="w-8 h-8 text-emerald-600" />}
              title="Multi-OJ Support"
              description="Native integration with Codeforces and AtCoder. One platform for all your practice needs."
            />
            <Feature 
              icon={<Trophy className="w-8 h-8 text-emerald-600" />}
              title="Real-time Leaderboards"
              description="Powered by Supabase, watch standings update live as soon as a verdict is reached."
            />
          </div>
        </div>
      </section>
    </div>
  );
}

function Feature({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="space-y-4">
      <div className="bg-white p-3 rounded-2xl w-fit shadow-sm border border-slate-100">
        {icon}
      </div>
      <h3 className="text-xl font-bold">{title}</h3>
      <p className="text-muted-foreground leading-relaxed">{description}</p>
    </div>
  );
}
