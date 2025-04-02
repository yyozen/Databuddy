"use client";

import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface AuthLoadingProps {
  className?: string;
}

export function AuthLoading({ className }: AuthLoadingProps) {
  return (
    <div className={cn("flex min-h-[400px] items-center justify-center", className)}>
      <Loader2 className="h-8 w-8 animate-spin text-sky-500" />
    </div>
  );
} 