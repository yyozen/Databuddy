'use client';

import { InfoIcon } from '@phosphor-icons/react';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useMemo, useState } from 'react';
import { NotificationsPopover } from '@/components/notifications/notifications-popover';
import { useWebsites } from '@/hooks/use-websites';
import { cn } from '@/lib/utils';
import {
	getDefaultCategory,
	getNavigationWithWebsites,
} from './navigation/navigation-config';
import { ThemeToggle } from './theme-toggle';
import { UserMenu } from './user-menu';

const HelpDialog = dynamic(
	() => import('./help-dialog').then((mod) => mod.HelpDialog),
	{
		ssr: false,
		loading: () => null,
	}
);

interface CategorySidebarProps {
	onCategoryChange?: (categoryId: string) => void;
	selectedCategory?: string;
}

export function CategorySidebar({
	onCategoryChange,
	selectedCategory,
}: CategorySidebarProps) {
	const pathname = usePathname();
	const { websites, isLoading: isLoadingWebsites } = useWebsites();
	const [helpOpen, setHelpOpen] = useState(false);

	const { categories, defaultCategory } = useMemo(() => {
		const config = getNavigationWithWebsites(
			pathname,
			websites,
			isLoadingWebsites
		);
		const defaultCat = getDefaultCategory(pathname);
		return { categories: config.categories, defaultCategory: defaultCat };
	}, [pathname, websites, isLoadingWebsites]);

	const activeCategory = selectedCategory || defaultCategory;

	return (
		<div className="fixed inset-y-0 left-0 z-40 w-12 border-r bg-background">
			<div className="flex h-full flex-col">
				{/* Logo */}
				<div className="flex h-16 items-center justify-center border-border border-b">
					<div className="relative flex-shrink-0">
						<Image
							alt="DataBuddy Logo"
							className="drop-shadow-sm invert dark:invert-0"
							height={32}
							priority
							src="/logo.svg"
							width={32}
						/>
					</div>
				</div>
				{categories.map((category) => {
					const Icon = category.icon;
					const isActive = activeCategory === category.id;

					return (
						<button
							className={cn(
								'flex items-center justify-center p-2 transition-colors hover:bg-muted/50',
								'focus:outline-none',
								isActive && 'bg-muted text-foreground'
							)}
							key={category.id}
							onClick={() => onCategoryChange?.(category.id)}
							title={category.name}
							type="button"
						>
							<Icon
								className={cn(
									'h-5 w-5 transition-colors',
									isActive ? 'text-primary' : 'text-muted-foreground'
								)}
								weight={isActive ? 'fill' : 'duotone'}
							/>
						</button>
					);
				})}

				{/* Bottom area - spacer to push bottom items down */}
				<div className="flex-1" />

				{/* Bottom controls */}
				<div className="space-y-2 border-border border-t p-2 pb-4">
					{/* Notifications */}
					<div className="flex justify-center">
						<div className="flex h-8 w-8 items-center justify-center">
							<NotificationsPopover />
						</div>
					</div>

					{/* Theme Toggle */}
					<div className="flex justify-center">
						<div className="flex h-8 w-8 items-center justify-center">
							<ThemeToggle />
						</div>
					</div>

					{/* Support */}
					<div className="flex justify-center">
						<button
							className="flex h-8 w-8 items-center justify-center rounded-md transition-colors hover:bg-muted/50 focus:outline-none"
							onClick={() => setHelpOpen(true)}
							title="Help and Support"
							type="button"
						>
							<InfoIcon
								className="h-4 w-4 not-dark:text-primary"
								weight="duotone"
							/>
						</button>
					</div>

					{/* Profile */}
					<div className="flex justify-center">
						<div className="flex h-8 w-8 items-center justify-center">
							<UserMenu />
						</div>
					</div>
				</div>

				{/* Help Dialog */}
				<HelpDialog onOpenChange={setHelpOpen} open={helpOpen} />
			</div>
		</div>
	);
}
