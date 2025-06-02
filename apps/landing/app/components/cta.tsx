"use client"

import type React from "react"

import { ArrowRight, Check, BarChart2, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import FadeIn from "./FadeIn"
import Link from "next/link"

export default function CTA() {
  return (
    <section id="cta-form" className="py-24 overflow-hidden scroll-mt-20">
      <div className="container px-4 mx-auto">
        <FadeIn className="relative max-w-3xl mx-auto text-center">
          <div className="absolute inset-0 scale-[2] blur-3xl bg-gradient-to-r from-sky-500/20 to-sky-500/40 -z-10" />
          <Badge variant="outline" className="mb-4 border-green-500/20 text-green-400">
            Now Live
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">Ready to take control of your data?</h2>
          <p className="text-slate-400 mb-8">
            Join thousands of privacy-conscious companies using advanced analytics. Get started with Databuddy today.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <Button size="lg" className="bg-sky-500 hover:bg-sky-600 group" asChild>
              <Link href="https://app.databuddy.cc" target="_blank" rel="noopener noreferrer">
                Get Started Free
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="border-slate-700 hover:border-slate-600 text-white group" asChild>
              <Link href="/demo">
                <BarChart2 className="mr-2 h-4 w-4" />
                View Live Demo
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-sm text-slate-400 mb-8">
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-400" />
              Free 30-day trial
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-400" />
              No credit card required
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-400" />
              Setup in under 5 minutes
            </div>
          </div>
          
          <div className="bg-slate-900/50 rounded-lg p-6 border border-slate-800">
            <div className="flex items-center justify-center gap-2 mb-3">
              <Zap className="h-5 w-5 text-sky-400" />
              <span className="font-semibold text-sky-400">Lightning Fast Setup</span>
            </div>
            <p className="text-slate-300 text-sm">
              Add one line of code to your website and start getting insights immediately. 
              No complex configuration or lengthy onboarding process.
            </p>
          </div>
        </FadeIn>
      </div>
    </section>
  )
}

