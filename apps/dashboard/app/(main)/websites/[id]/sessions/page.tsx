"use client";

import { useParams } from "next/navigation";

import { SessionsList } from "./_components";

export default function SessionsPage() {
  const params = useParams();
  const websiteId = params.id as string;

  return (
    <div className="p-3 sm:p-4 lg:p-6">
      <SessionsList websiteId={websiteId} />
    </div>
  );
}
