import { Boxes, Server, RefreshCw, Code, Database, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function DataOS() {
  return (
    <section className="py-16 sm:py-24 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950 to-slate-900/30 pointer-events-none"></div>
      <div className="container px-4 mx-auto relative z-10">
        <div className="text-center mb-10 sm:mb-16">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4 tracking-tight">
            More than analytics: A complete <span className="text-sky-400">Data OS</span>
          </h2>
          <p className="text-slate-300 max-w-2xl mx-auto text-sm sm:text-base leading-relaxed">
            Databuddy isn't just an analytics tool—it's an interoperable data layer that powers your entire digital ecosystem.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* Left column */}
          <div className="space-y-6">
            <div className="bg-slate-900/50 rounded-2xl p-6 border border-slate-800 hover:border-sky-500/30 transition-all duration-300 hover:shadow-[0_0_25px_-5px_rgba(14,165,233,0.15)]">
              <div className="bg-sky-500/10 p-3 rounded-xl w-fit mb-4">
                <RefreshCw className="h-6 w-6 text-sky-400" />
              </div>
              <h3 className="text-xl font-semibold mb-2 tracking-tight">Event Streaming</h3>
              <p className="text-slate-300 text-sm leading-relaxed mb-4">
                Stream analytics events in real-time via WebSockets, enabling instant reactions to user behavior without polling.
              </p>
              <div className="flex items-center text-xs font-medium">
                <span className="bg-amber-600/20 text-amber-400 py-1 px-2 rounded-full">Coming Soon</span>
              </div>
            </div>

            <div className="bg-slate-900/50 rounded-2xl p-6 border border-slate-800 hover:border-sky-500/30 transition-all duration-300 hover:shadow-[0_0_25px_-5px_rgba(14,165,233,0.15)]">
              <div className="bg-sky-500/10 p-3 rounded-xl w-fit mb-4">
                <Code className="h-6 w-6 text-sky-400" />
              </div>
              <h3 className="text-xl font-semibold mb-2 tracking-tight">Developer-Friendly API</h3>
              <p className="text-slate-300 text-sm leading-relaxed mb-4">
                Query your analytics data with a powerful GraphQL API that gives you exactly what you need in a single request.
              </p>
              <div className="flex items-center text-xs font-medium">
                <span className="bg-amber-600/20 text-amber-400 py-1 px-2 rounded-full">Coming Soon</span>
              </div>
            </div>

            <div className="bg-slate-900/50 rounded-2xl p-6 border border-slate-800 hover:border-sky-500/30 transition-all duration-300 hover:shadow-[0_0_25px_-5px_rgba(14,165,233,0.15)]">
              <div className="bg-sky-500/10 p-3 rounded-xl w-fit mb-4">
                <Globe className="h-6 w-6 text-sky-400" />
              </div>
              <h3 className="text-xl font-semibold mb-2 tracking-tight">Edge Computing</h3>
              <p className="text-slate-300 text-sm leading-relaxed mb-4">
                Process analytics at the edge for unparalleled performance and privacy, keeping sensitive data close to its source.
              </p>
              <div className="flex items-center text-xs font-medium">
                <span className="bg-indigo-600/20 text-indigo-400 py-1 px-2 rounded-full">On Roadmap</span>
              </div>
            </div>
          </div>

          {/* Right column */}
          <div className="space-y-6">
            <div className="bg-slate-900/50 rounded-2xl p-6 border border-slate-800 hover:border-sky-500/30 transition-all duration-300 hover:shadow-[0_0_25px_-5px_rgba(14,165,233,0.15)]">
              <div className="bg-sky-500/10 p-3 rounded-xl w-fit mb-4">
                <Boxes className="h-6 w-6 text-sky-400" />
              </div>
              <h3 className="text-xl font-semibold mb-2 tracking-tight">Plugin Ecosystem</h3>
              <p className="text-slate-300 text-sm leading-relaxed mb-4">
                Extend Databuddy's capabilities with plugins created by our team or build your own custom extensions.
              </p>
              <div className="flex items-center text-xs font-medium">
                <span className="bg-indigo-600/20 text-indigo-400 py-1 px-2 rounded-full">On Roadmap</span>
              </div>
            </div>

            <div className="bg-slate-900/50 rounded-2xl p-6 border border-slate-800 hover:border-sky-500/30 transition-all duration-300 hover:shadow-[0_0_25px_-5px_rgba(14,165,233,0.15)]">
              <div className="bg-sky-500/10 p-3 rounded-xl w-fit mb-4">
                <Server className="h-6 w-6 text-sky-400" />
              </div>
              <h3 className="text-xl font-semibold mb-2 tracking-tight">Self-Hosting Option</h3>
              <p className="text-slate-300 text-sm leading-relaxed mb-4">
                Deploy Databuddy on your own infrastructure with our enterprise-grade self-hosting solution for maximum control.
              </p>
              <div className="flex items-center text-xs font-medium">
                <span className="bg-indigo-600/20 text-indigo-400 py-1 px-2 rounded-full">On Roadmap</span>
              </div>
            </div>

            <div className="bg-slate-900/50 rounded-2xl p-6 border border-slate-800 hover:border-sky-500/30 transition-all duration-300 hover:shadow-[0_0_25px_-5px_rgba(14,165,233,0.15)]">
              <div className="bg-sky-500/10 p-3 rounded-xl w-fit mb-4">
                <Database className="h-6 w-6 text-sky-400" />
              </div>
              <h3 className="text-xl font-semibold mb-2 tracking-tight">Data Warehouse Sync</h3>
              <p className="text-slate-300 text-sm leading-relaxed mb-4">
                Automatically sync your analytics data with your existing data warehouse for unified business intelligence.
              </p>
              <div className="flex items-center text-xs font-medium">
                <span className="bg-indigo-600/20 text-indigo-400 py-1 px-2 rounded-full">On Roadmap</span>
              </div>
            </div>
          </div>
        </div>

        <div className="text-center mt-12">
          <Link href="/demo">
            <Button className="bg-sky-600 hover:bg-sky-500 text-white">
              Get early access
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
} 