"use client";

import { ChartBarIcon, ListBulletsIcon } from "@phosphor-icons/react";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export default function EventsLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const params = useParams();
	const websiteId = params.id as string;
	const eventName = params.eventName as string | undefined;
	const pathname = usePathname();

	const isDetailPage = Boolean(eventName);
	const isSummaryPage = pathname === `/websites/${websiteId}/events`;
	const isStreamPage = pathname === `/websites/${websiteId}/events/stream`;

	if (isDetailPage) {
		return <div className="flex h-full min-h-0 flex-col">{children}</div>;
	}

	return (
		<div className="flex h-full min-h-0 flex-col">
			<div className="box-border flex h-10 shrink-0 border-border border-b bg-accent/30">
				<Link
					className={cn(
						"flex cursor-pointer items-center gap-2 border-b-2 px-3 py-2.5 font-medium text-sm transition-all",
						isSummaryPage
							? "border-primary text-foreground"
							: "border-transparent text-muted-foreground hover:border-border hover:text-foreground"
					)}
					href={`/websites/${websiteId}/events`}
				>
					<ChartBarIcon
						className={cn("size-4", isSummaryPage && "text-primary")}
						weight={isSummaryPage ? "fill" : "duotone"}
					/>
					Summary
				</Link>
				<Link
					className={cn(
						"flex cursor-pointer items-center gap-2 border-b-2 px-3 py-2.5 font-medium text-sm transition-all",
						isStreamPage
							? "border-primary text-foreground"
							: "border-transparent text-muted-foreground hover:border-border hover:text-foreground"
					)}
					href={`/websites/${websiteId}/events/stream`}
				>
					<ListBulletsIcon
						className={cn("size-4", isStreamPage && "text-primary")}
						weight={isStreamPage ? "fill" : "duotone"}
					/>
					Stream
				</Link>
			</div>
			<div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
		</div>
	);
}
