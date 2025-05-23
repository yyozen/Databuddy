import Link from "next/link";
import { Globe } from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

interface Website {
  id: string;
  name?: string;
  domain: string;
}

interface WebsiteListProps {
  websites: Website[] | undefined;
  isLoading: boolean;
  pathname: string;
}

export function WebsiteList({ websites, isLoading, pathname }: WebsiteListProps) {
  if (isLoading) {
    return (
      <>
        <div className="px-2 py-1.5">
          <Skeleton className="h-7 w-full rounded-md" />
        </div>
        <div className="px-2 py-1.5">
          <Skeleton className="h-7 w-full rounded-md" />
        </div>
      </>
    );
  }

  if (!websites?.length) {
    return (
      <div className="px-3 py-2 text-sm text-muted-foreground bg-accent/30 rounded-md border border-border/50">
        No websites yet
      </div>
    );
  }

  return (
    <div className="bg-accent/20 rounded-md py-1">
      {websites.map((site) => (
        <Link
          key={site.id}
          href={`/websites/${site.id}`}
          className={cn(
            "flex items-center gap-x-3 px-3 py-2 text-sm rounded-md transition-all cursor-pointer mx-1",
            pathname === `/websites/${site.id}`
              ? "bg-primary/15 text-primary font-medium"
              : "text-foreground hover:bg-accent/70"
          )}
        >
          <Globe className={cn("h-4 w-4", pathname === `/websites/${site.id}` && "text-primary")} />
          <span className="truncate">{site.name || site.domain}</span>
        </Link>
      ))}
    </div>
  );
} 