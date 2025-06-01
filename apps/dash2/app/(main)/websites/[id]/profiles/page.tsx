"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useAnalyticsProfiles } from "@/hooks/use-analytics";
import { ProfileStats } from "@/components/profiles/profile-stats";
import { ProfilesTable } from "@/components/profiles/profiles-table";
import { ProfileDetailsModal } from "@/components/profiles/profile-details-modal";
import type { ProfileData } from "@/hooks/use-analytics";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function ProfilesPage() {
  const params = useParams();
  const websiteId = params.id as string;
  
  const [selectedProfile, setSelectedProfile] = useState<ProfileData | null>(null);
  const [page, setPage] = useState(1);
      
  const { data, isLoading } = useAnalyticsProfiles(websiteId, undefined, 500, page);

  const profiles = data?.profiles || [];
  const pagination = data?.pagination;
  // Use accurate stats from API if available
  const totalVisitors = data?.total_visitors ?? profiles.length;
  const returningVisitors = data?.returning_visitors ?? profiles.filter(profile => profile.total_sessions > 1).length;
  const returningRate = totalVisitors > 0 ? (returningVisitors / totalVisitors) * 100 : 0;
  const totalPageViews = profiles.reduce((sum, profile) => sum + (profile.total_pageviews || 0), 0);

  return (
    <div className="h-full overflow-hidden flex flex-col">
      <div className="flex-shrink-0 p-4 sm:p-6">
        <ProfileStats
          totalVisitors={totalVisitors}
          returningVisitors={returningVisitors}
          returningRate={returningRate}
          totalPageViews={totalPageViews}
        />
      </div>
      {/* Table Section - Flexible height with scroll */}
      <div className="flex-1 px-4 sm:px-6 pb-4 sm:pb-6 min-h-0 flex flex-col">
        <ProfilesTable
          profiles={profiles}
          isLoading={isLoading}
          onProfileClick={setSelectedProfile}
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
      {selectedProfile && (
        <ProfileDetailsModal
          profile={selectedProfile}
          isOpen={!!selectedProfile}
          onClose={() => setSelectedProfile(null)}
        />
      )}
    </div>
  );
} 