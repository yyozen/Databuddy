"use client";

import { useParams } from "next/navigation";
import { RevenueContent } from "./_components/revenue-content";

export default function RevenuePage() {
	const { id: websiteId } = useParams();

	return (
		<div className="relative flex h-full flex-col">
			<RevenueContent websiteId={websiteId as string} />
		</div>
	);
}
