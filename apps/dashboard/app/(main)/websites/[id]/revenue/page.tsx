"use client";

import { useParams } from "next/navigation";
import { RevenueContent } from "./_components/revenue-content";

export default function RevenuePage() {
	const { id: websiteId } = useParams();

	return (
		<div className="flex h-[calc(100vh-6rem)] flex-col overflow-hidden p-4">
			<RevenueContent websiteId={websiteId as string} />
		</div>
	);
}
