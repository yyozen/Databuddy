"use client";

import { Sora } from "next/font/google";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { cn } from "@/lib/utils";

const sora = Sora({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export default function LogoPage() {
  const handleDownload = () => {
    // Create a canvas element
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size with padding
    canvas.width = 1200;
    canvas.height = 600;

    // Set background
    ctx.fillStyle = "#0f172a";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Configure text
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 160px Sora";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    // Draw text
    ctx.fillText("Databuddy", canvas.width / 2, canvas.height / 2);

    // Convert to PNG and download
    const link = document.createElement("a");
    link.download = "databuddy-logo.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
      <div className="text-center space-y-12 max-w-4xl mx-auto">
        <div className="space-y-6">
          <h1 className={cn(
            sora.className,
            "text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-bold bg-gradient-to-r from-sky-400 via-sky-500 to-sky-600 bg-clip-text text-transparent leading-tight"
          )}>
            Databuddy
          </h1>
          <p className="text-slate-400 text-lg md:text-xl max-w-md mx-auto">
            Your trusted companion for data analytics and insights
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-slate-900/50 p-8 rounded-xl border border-slate-800/50 backdrop-blur-sm hover:border-sky-500/20 transition-colors duration-200">
            <div className={cn(
              sora.className,
              "text-4xl md:text-5xl font-bold text-white leading-tight"
            )}>
              Databuddy
            </div>
            <div className="mt-4 space-y-2">
              <div className="text-sm text-slate-400">
                Font: Sora | Weight: 700 | Size: 48px
              </div>
              <div className="text-xs text-slate-500">
                Solid white version for dark backgrounds
              </div>
            </div>
          </div>
          
          <div className="bg-slate-900/50 p-8 rounded-xl border border-slate-800/50 backdrop-blur-sm hover:border-sky-500/20 transition-colors duration-200">
            <div className={cn(
              sora.className,
              "text-4xl md:text-5xl font-bold bg-gradient-to-r from-sky-400 via-sky-500 to-sky-600 bg-clip-text text-transparent leading-tight"
            )}>
              Databuddy
            </div>
            <div className="mt-4 space-y-2">
              <div className="text-sm text-slate-400">
                Font: Sora | Weight: 700 | Size: 48px
              </div>
              <div className="text-xs text-slate-500">
                Gradient version for light backgrounds
              </div>
            </div>
          </div>
        </div>

        <div className="pt-4">
          <Button
            onClick={handleDownload}
            size="lg"
            className="bg-sky-500 hover:bg-sky-600 text-white px-8 py-6 text-lg"
          >
            <Download className="mr-2 h-5 w-5" />
            Download Logo
          </Button>
        </div>
      </div>
    </div>
  );
} 