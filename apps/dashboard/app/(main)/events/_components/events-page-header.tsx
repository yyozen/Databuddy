"use client";

import { ArrowClockwiseIcon } from "@phosphor-icons/react/dist/ssr/ArrowClockwise";
import { CaretDownIcon } from "@phosphor-icons/react/dist/ssr/CaretDown";
import { LightningIcon } from "@phosphor-icons/react/dist/ssr/Lightning";
import { PageHeader } from "@/app/(main)/websites/_components/page-header";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { useEventsPageContext } from "./events-page-context";

export function EventsPageHeader() {
	const {
		setSelectedWebsiteId,
		selectedWebsite,
		websites,
		isLoadingWebsites,
		refresh,
		isFetching,
		hasQueryId,
	} = useEventsPageContext();

	return (
		<PageHeader
			badgeContent="Alpha"
			badgeVariant="amber"
			description="Track and analyze custom events across all websites"
			icon={<LightningIcon weight="duotone" />}
			right={
				<div className="flex items-center gap-2">
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button
								className="min-w-[140px] justify-between"
								disabled={isLoadingWebsites}
								variant="outline"
							>
								{isLoadingWebsites ? (
									<Skeleton className="h-4 w-20" />
								) : selectedWebsite ? (
									<span className="truncate">{selectedWebsite.name}</span>
								) : (
									<span>All Websites</span>
								)}
								<CaretDownIcon className="ml-2 size-4" weight="fill" />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end" className="w-[200px]">
							<DropdownMenuItem onClick={() => setSelectedWebsiteId(null)}>
								All Websites
							</DropdownMenuItem>
							{websites.map((website) => (
								<DropdownMenuItem
									key={website.id}
									onClick={() => setSelectedWebsiteId(website.id)}
								>
									{website.name || website.domain}
								</DropdownMenuItem>
							))}
						</DropdownMenuContent>
					</DropdownMenu>
					<Button
						disabled={isFetching || !hasQueryId}
						onClick={refresh}
						size="icon"
						variant="secondary"
					>
						<ArrowClockwiseIcon
							className={isFetching ? "animate-spin" : ""}
							size={16}
						/>
					</Button>
				</div>
			}
			title="Custom Events"
		/>
	);
}
