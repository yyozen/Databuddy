import Link from "next/link";
import { LayoutDashboard } from "lucide-react";

export function Logo() {
  return (
    <Link href="/websites" className="flex items-center gap-2.5 group">
      <div className="p-1.5 rounded-md bg-primary shadow-sm group-hover:shadow-md transition-all duration-200">
        <LayoutDashboard className="h-5 w-5 text-primary-foreground" />
      </div>
      <span className="font-semibold text-lg">Databuddy</span>
    </Link>
  );
} 