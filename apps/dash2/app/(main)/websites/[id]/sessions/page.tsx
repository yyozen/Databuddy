"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useAnalyticsSessions } from "@/hooks/use-analytics";
import { SessionStats } from "@/components/sessions/session-stats";
import { SessionsTable } from "@/components/sessions/sessions-table";
import { SessionDetailsModal } from "@/components/sessions/session-details-modal";
import type { SessionData } from "@/hooks/use-analytics";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function SessionsPage() {
  const params = useParams();
  const websiteId = params.id as string;
  
  const [selectedSession, setSelectedSession] = useState<SessionData | null>(null);
  const [page, setPage] = useState(1);
  const limit = 1000;
  
  const { data, isLoading } = useAnalyticsSessions(websiteId, undefined, limit, page);

  const sessions = data?.sessions || [];
  const pagination = data?.pagination;
  
  // Calculate stats from all sessions
  const totalSessions = sessions.length;
  const avgDuration = sessions.length > 0 
    ? sessions.reduce((sum, session) => sum + (session.duration || 0), 0) / sessions.length 
    : 0;
  const bounceRate = sessions.length > 0 
    ? (sessions.filter(session => (session.page_views || 0) <= 1).length / sessions.length) * 100 
    : 0;
  const totalPageViews = sessions.reduce((sum, session) => sum + (session.page_views || 0), 0);

  return (
    <div className="h-full overflow-hidden flex flex-col">
      <div className="flex-shrink-0 p-4 sm:p-6">
        <SessionStats
          totalSessions={totalSessions}
          avgDuration={Math.round(avgDuration)}
          bounceRate={bounceRate}
          totalPageViews={totalPageViews}
        />
      </div>
      
      {/* Table Section - Flexible height with scroll */}
      <div className="flex-1 px-4 sm:px-6 pb-4 sm:pb-6 min-h-0 flex flex-col">
        <SessionsTable
          sessions={sessions}
          isLoading={isLoading}
          onSessionClick={setSelectedSession}
        />
        {/* Pagination Controls */}
        {pagination && (
          <div className="flex items-center justify-between mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={!pagination.hasPrev}
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="ml-1">Previous</span>
            </Button>
            <span className="text-sm px-2">
              Page {pagination.page} of {pagination.hasNext ? pagination.page + 1 : pagination.page}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => p + 1)}
              disabled={!pagination.hasNext}
            >
              <span className="mr-1">Next</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Modal */}
      {selectedSession && (
        <SessionDetailsModal
          session={selectedSession}
          isOpen={!!selectedSession}
          onClose={() => setSelectedSession(null)}
        />
      )}
    </div>
  );
} 