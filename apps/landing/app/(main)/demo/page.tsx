"use client"

import dynamic from "next/dynamic";
const Navbar = dynamic(() => import("@/app/components/navbar"), { ssr: true });

export default function DemoPage() {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      <Navbar />
      <main className="flex-1 flex items-center justify-center">
        <div className="w-full max-w-[1000px] min-w-[320px] bg-slate-900 rounded-2xl shadow-2xl border border-slate-800 overflow-hidden flex items-center justify-center" style={{ height: '80vh' }}>
          <iframe
            src="http://localhost:3000/embed"
            width="100%"
            height="100%"
            className="w-full h-full"
            style={{ border: "none" }}
            allowFullScreen
            title="Databuddy Embedded Dashboard"
          />
        </div>
      </main>
    </div>
  );
} 