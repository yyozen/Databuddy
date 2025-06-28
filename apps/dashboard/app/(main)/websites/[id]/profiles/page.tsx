"use client";

import { useParams } from "next/navigation";

import { ProfilesList } from "./_components";

export default function ProfilesPage() {
  const params = useParams();
  const websiteId = params.id as string;

  return (
    <div className="p-3 sm:p-4 lg:p-6">
      <ProfilesList websiteId={websiteId} />
    </div>
  );
}
