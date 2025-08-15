import type { Website } from '@databuddy/shared';
import { CaretLeftIcon, PlanetIcon } from '@phosphor-icons/react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { FaviconImage } from '@/components/analytics/favicon-image';

interface WebsiteHeaderProps {
	website: Website | null | undefined;
}

export function WebsiteHeader({ website }: WebsiteHeaderProps) {
	return (
		<div className="flex flex-col gap-2">
			<div>
				<Button
					asChild
					className="group w-full cursor-pointer justify-start text-muted-foreground hover:text-foreground"
					size="sm"
					variant="ghost"
				>
					<Link href="/websites">
						<CaretLeftIcon
							className="group-hover:-translate-x-0.5 mr-2 h-4 w-4 transition-transform"
							size={32}
							weight="fill"
						/>
						<span>Back to Websites</span>
					</Link>
				</Button>
			</div>

			<div className="rounded-lg border border-border/50 bg-accent/30 px-2 py-2">
				<h2 className="flex items-center truncate font-semibold text-base">
					<FaviconImage
						altText={`${website?.name || website?.domain || 'Website'} favicon`}
						className="mr-2"
						domain={website?.domain || ''}
						fallbackIcon={
							<PlanetIcon
								className="text-primary/70"
								size={20}
								weight="duotone"
							/>
						}
						size={20}
					/>
					{website?.name || website?.domain || (
						<Skeleton className="h-5 w-36" />
					)}
				</h2>
				<div className="mt-1 truncate pl-6 text-muted-foreground text-xs">
					{website?.domain || <Skeleton className="h-4 w-24" />}
				</div>
			</div>
		</div>
	);
}
