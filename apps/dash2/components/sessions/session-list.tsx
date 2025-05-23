import { Activity } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { SessionRow } from "./session-row";
import type { SessionData } from "@/hooks/use-analytics";

interface SessionListProps {
  sessions: SessionData[];
  isLoading: boolean;
  onSessionClick: (session: SessionData) => void;
}

export function SessionList({ sessions, isLoading, onSessionClick }: SessionListProps) {
  if (isLoading) {
    return (
      <div className="border border-border rounded-lg overflow-hidden">
        <div className="flex items-center justify-between p-3 border-b border-border bg-muted/20 text-xs font-medium text-muted-foreground">
          <div className="flex items-center gap-3 flex-1">
            <div className="w-6" />
            <div className="flex-1">Location</div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-center min-w-[70px]">Date</div>
            <div className="text-center min-w-[50px]">Duration</div>
            <div className="text-center min-w-[40px]">Pages</div>
            <div className="text-center min-w-[60px]">Device</div>
            <div className="text-center min-w-[70px]">Browser</div>
            <div className="text-center min-w-[60px]">OS</div>
          </div>
        </div>
        <div>
          {Array.from({ length: 10 }, (_, i) => (
            <div key={`session-skeleton-${i + 1}`} className="p-3 border-b border-border/50">
              <Skeleton className="h-10 w-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div className="border border-border rounded-lg">
        <div className="flex flex-col items-center justify-center h-48 text-center space-y-3">
          <div className="p-3 bg-muted/50 rounded-full">
            <Activity className="h-6 w-6 text-muted-foreground" />
          </div>
          <div className="space-y-1">
            <h3 className="font-medium">No sessions found</h3>
            <p className="text-sm text-muted-foreground">
              Try adjusting your filters or date range
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-border bg-muted/20 text-xs font-medium text-muted-foreground">
        <div className="flex items-center gap-3 flex-1">
          <div className="w-6" />
          <div className="flex-1">Location</div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-center min-w-[70px]">Date</div>
          <div className="text-center min-w-[50px]">Duration</div>
          <div className="text-center min-w-[40px]">Pages</div>
          <div className="text-center min-w-[60px]">Device</div>
          <div className="text-center min-w-[70px]">Browser</div>
          <div className="text-center min-w-[60px]">OS</div>
        </div>
      </div>
      
      {/* Scrollable Rows */}
      <div className="max-h-[60vh] overflow-y-auto">
        {sessions.map((session) => (
          <SessionRow 
            key={session.session_id}
            session={session}
            onClick={onSessionClick}
          />
        ))}
      </div>
    </div>
  );
} 