"use client";

import {
	ArrowRightIcon,
	BrainIcon,
	ChartBarIcon,
	FlagIcon,
	LinkIcon,
	SparkleIcon,
} from "@phosphor-icons/react";
import { Menu, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { ThemeToggle } from "@/components/theme-toggle";
import {
	NavigationMenu,
	NavigationMenuContent,
	NavigationMenuItem,
	NavigationMenuLink,
	NavigationMenuList,
	NavigationMenuTrigger,
	navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { cn } from "@/lib/utils";
import { Logo } from "./logo";

export interface NavbarProps {
	stars?: number | null;
}

const productLinks = [
	{
		title: "Feature Flags",
		description: "Ship safely with gradual rollouts",
		href: "/docs/sdk/feature-flags",
		icon: FlagIcon,
		color: "text-amber-400",
		bgColor: "bg-amber-400/10",
		borderColor: "border-amber-400/20",
	},
	{
		title: "LLM Analytics",
		description: "Monitor AI costs and latency",
		href: "/docs/sdk/ai",
		icon: BrainIcon,
		color: "text-violet-400",
		bgColor: "bg-violet-400/10",
		borderColor: "border-violet-400/20",
		isNew: true,
	},
	{
		title: "Link Analytics",
		description: "Track clicks and engagement",
		href: "/docs/api/links",
		icon: LinkIcon,
		color: "text-sky-400",
		bgColor: "bg-sky-400/10",
		borderColor: "border-sky-400/20",
	},
];

const docsLinks = [
	{ title: "Getting Started", href: "/docs/getting-started" },
	{ title: "SDK Reference", href: "/docs/sdk" },
	{ title: "API Reference", href: "/docs/api" },
	{ title: "Integrations", href: "/docs/Integrations" },
];

const sdkLinks = [
	{ title: "React / Next.js", href: "/docs/sdk/react" },
	{ title: "Node.js", href: "/docs/sdk/node" },
	{ title: "Vue", href: "/docs/sdk/vue" },
	{ title: "Vanilla JS", href: "/docs/sdk/vanilla-js" },
];

export const Navbar = ({ stars }: NavbarProps) => {
	const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

	const toggleMobileMenu = () => {
		setIsMobileMenuOpen(!isMobileMenuOpen);
	};

	return (
		<div className="sticky top-0 z-30 flex flex-col border-b bg-background/60 backdrop-blur-xl">
			<nav>
				<div className="mx-auto w-full px-2 sm:px-2 md:px-6 lg:px-8">
					<div className="flex h-16 items-center justify-between">
						{/* Logo Section */}
						<div className="shrink-0 transition-opacity hover:opacity-90">
							<Logo />
						</div>

						{/* Desktop Navigation */}
						<div className="hidden md:block">
							<NavigationMenu>
								<NavigationMenuList>
									{/* Products Dropdown */}
									<NavigationMenuItem>
										<NavigationMenuTrigger className="bg-transparent">
											Products
										</NavigationMenuTrigger>
										<NavigationMenuContent>
											<div className="w-[520px] p-3">
												{/* Featured: Web Analytics */}
												<Link
													className="group relative mb-3 flex overflow-hidden rounded border border-primary/20 bg-primary/5 p-3.5 no-underline transition-all hover:border-primary/30 hover:bg-primary/10"
													href="/docs"
												>
													<div className="absolute top-0 right-0 size-24 translate-x-6 -translate-y-6 rounded-full bg-primary/10 blur-2xl" />
													<div className="relative flex flex-1 items-start gap-3">
														<div className="flex size-10 shrink-0 items-center justify-center rounded border border-primary/20 bg-primary/10">
															<ChartBarIcon
																className="size-5 text-primary"
																weight="duotone"
															/>
														</div>
														<div className="flex-1">
															<div className="mb-0.5 flex items-center gap-2">
																<p className="font-semibold text-foreground text-sm">
																	Web Analytics
																</p>
																<span className="flex items-center gap-0.5 rounded-full border border-primary/30 bg-primary/10 px-1.5 py-0.5 text-[9px] text-primary">
																	<SparkleIcon
																		className="size-2.5"
																		weight="fill"
																	/>
																	Core
																</span>
															</div>
															<p className="mb-2 text-muted-foreground text-xs">
																Privacy-first, real-time analytics. GDPR
																compliant.
															</p>
															<span className="inline-flex items-center gap-1 font-medium text-primary text-xs transition-all group-hover:gap-1.5">
																Explore
																<ArrowRightIcon className="size-3" />
															</span>
														</div>
													</div>
												</Link>

												{/* Divider with label */}
												<div className="relative mb-3">
													<div className="absolute inset-0 flex items-center">
														<div className="w-full border-border border-t" />
													</div>
													<div className="relative flex justify-start">
														<span className="bg-popover pr-2 text-[10px] text-muted-foreground uppercase tracking-wider">
															More Products
														</span>
													</div>
												</div>

												{/* Other Products Grid */}
												<div className="grid grid-cols-3 gap-2">
													{productLinks.map((link) => {
														const IconComponent = link.icon;
														return (
															<NavigationMenuLink asChild key={link.title}>
																<Link
																	className={cn(
																		"group flex flex-col rounded border bg-card/50 p-3 transition-all hover:bg-card",
																		link.borderColor
																	)}
																	href={link.href}
																>
																	<div className="mb-2 flex items-center justify-between">
																		<div
																			className={cn(
																				"flex size-7 items-center justify-center rounded",
																				link.bgColor
																			)}
																		>
																			<IconComponent
																				className={cn("size-4", link.color)}
																				weight="duotone"
																			/>
																		</div>
																		{link.isNew && (
																			<span className="rounded-full bg-emerald-400/10 px-1.5 py-0.5 font-medium text-[9px] text-emerald-500 uppercase">
																				New
																			</span>
																		)}
																	</div>
																	<p className="mb-0.5 font-medium text-foreground text-sm">
																		{link.title}
																	</p>
																	<p className="text-[11px] text-muted-foreground leading-snug">
																		{link.description}
																	</p>
																</Link>
															</NavigationMenuLink>
														);
													})}
												</div>
											</div>
										</NavigationMenuContent>
									</NavigationMenuItem>

									{/* Docs Dropdown */}
									<NavigationMenuItem>
										<NavigationMenuTrigger className="bg-transparent">
											Docs
										</NavigationMenuTrigger>
										<NavigationMenuContent>
											<div className="flex w-[360px] p-3">
												{/* Documentation Links */}
												<div className="flex-1 border-border border-r pr-3">
													<p className="mb-2 text-[10px] text-muted-foreground uppercase tracking-wider">
														Documentation
													</p>
													<div className="flex flex-col">
														{docsLinks.map((link) => (
															<NavigationMenuLink asChild key={link.title}>
																<Link
																	className="rounded px-2 py-1.5 font-medium text-sm transition-colors hover:bg-accent"
																	href={link.href}
																>
																	{link.title}
																</Link>
															</NavigationMenuLink>
														))}
													</div>
												</div>

												{/* SDK Links */}
												<div className="flex-1 pl-3">
													<p className="mb-2 text-[10px] text-muted-foreground uppercase tracking-wider">
														SDK
													</p>
													<div className="flex flex-col">
														{sdkLinks.map((link) => (
															<NavigationMenuLink asChild key={link.title}>
																<Link
																	className="rounded px-2 py-1.5 text-muted-foreground text-sm transition-colors hover:bg-accent hover:text-foreground"
																	href={link.href}
																>
																	{link.title}
																</Link>
															</NavigationMenuLink>
														))}
													</div>
												</div>
											</div>
										</NavigationMenuContent>
									</NavigationMenuItem>

									{/* Blog Link */}
									<NavigationMenuItem>
										<Link href="/blog" legacyBehavior passHref>
											<NavigationMenuLink
												className={cn(
													navigationMenuTriggerStyle(),
													"bg-transparent"
												)}
											>
												Blog
											</NavigationMenuLink>
										</Link>
									</NavigationMenuItem>

									{/* Pricing Link */}
									<NavigationMenuItem>
										<Link href="/pricing" legacyBehavior passHref>
											<NavigationMenuLink
												className={cn(
													navigationMenuTriggerStyle(),
													"bg-transparent"
												)}
											>
												Pricing
											</NavigationMenuLink>
										</Link>
									</NavigationMenuItem>

									{/* GitHub Link */}
									<NavigationMenuItem>
										<a
											href="https://github.com/databuddy-analytics/Databuddy"
											rel="noopener noreferrer"
											target="_blank"
										>
											<NavigationMenuLink
												className={cn(
													navigationMenuTriggerStyle(),
													"bg-transparent"
												)}
											>
												<span className="inline-flex items-center gap-2">
													<svg
														height="1.1em"
														viewBox="0 0 496 512"
														width="1.1em"
														xmlns="http://www.w3.org/2000/svg"
													>
														<title>GitHub</title>
														<path
															d="M165.9 397.4c0 2-2.3 3.6-5.2 3.6c-3.3.3-5.6-1.3-5.6-3.6c0-2 2.3-3.6 5.2-3.6c3-.3 5.6 1.3 5.6 3.6m-31.1-4.5c-.7 2 1.3 4.3 4.3 4.9c2.6 1 5.6 0 6.2-2s-1.3-4.3-4.3-5.2c-2.6-.7-5.5.3-6.2 2.3m44.2-1.7c-2.9.7-4.9 2.6-4.6 4.9c.3 2 2.9 3.3 5.9 2.6c2.9-.7 4.9-2.6 4.6-4.6c-.3-1.9-3-3.2-5.9-2.9M244.8 8C106.1 8 0 113.3 0 252c0 110.9 69.8 205.8 169.5 239.2c12.8 2.3 17.3-5.6 17.3-12.1c0-6.2-.3-40.4-.3-61.4c0 0-70 15-84.7-29.8c0 0-11.4-29.1-27.8-36.6c0 0-22.9-15.7 1.6-15.4c0 0 24.9 2 38.6 25.8c21.9 38.6 58.6 27.5 72.9 20.9c2.3-16 8.8-27.1 16-33.7c-55.9-6.2-112.3-14.3-112.3-110.5c0-27.5 7.6-41.3 23.6-58.9c-2.6-6.5-11.1-33.3 2.6-67.9c20.9-6.5 69 27 69 27c20-5.6 41.5-8.5 62.8-8.5s42.8 2.9 62.8 8.5c0 0 48.1-33.6 69-27c13.7 34.7 5.2 61.4 2.6 67.9c16 17.7 25.8 31.5 25.8 58.9c0 96.5-58.9 104.2-114.8 110.5c9.2 7.9 17 22.9 17 46.4c0 33.7-.3 75.4-.3 83.6c0 6.5 4.6 14.4 17.3 12.1C428.2 457.8 496 362.9 496 252C496 113.3 383.5 8 244.8 8M97.2 352.9c-1.3 1-1 3.3.7 5.2c1.6 1.6 3.9 2.3 5.2 1c1.3-1 1-3.3-.7-5.2c-1.6-1.6-3.9-2.3-5.2-1m-10.8-8.1c-.7 1.3.3 2.9 2.3 3.9c1.6 1 3.6.7 4.3-.7c.7-1.3-.3-2.9-2.3-3.9c-2-.6-3.6-.3-4.3.7m32.4 35.6c-1.6 1.3-1 4.3 1.3 6.2c2.3 2.3 5.2 2.6 6.5 1c1.3-1.3.7-4.3-1.3-6.2c-2.2-2.3-5.2-2.6-6.5-1m-11.4-14.7c-1.6 1-1.6 3.6 0 5.9s4.3 3.3 5.6 2.3c1.6-1.3 1.6-3.9 0-6.2c-1.4-2.3-4-3.3-5.6-2"
															fill="currentColor"
														/>
													</svg>
													{typeof stars === "number" && (
														<span
															className="rounded-full border border-border bg-muted px-2 py-0.5 font-medium text-foreground text-xs tabular-nums"
															title="GitHub stars"
														>
															{stars.toLocaleString()}
														</span>
													)}
												</span>
											</NavigationMenuLink>
										</a>
									</NavigationMenuItem>

									{/* Dashboard Link */}
									<NavigationMenuItem>
										<a
											href="https://app.databuddy.cc/login"
											rel="noopener noreferrer"
											target="_blank"
										>
											<NavigationMenuLink
												className={cn(
													navigationMenuTriggerStyle(),
													"border border-primary bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 hover:text-primary-foreground focus:bg-primary/90 focus:text-primary-foreground"
												)}
											>
												Dashboard
											</NavigationMenuLink>
										</a>
									</NavigationMenuItem>

									<NavigationMenuItem className="ml-1">
										<ThemeToggle />
									</NavigationMenuItem>
								</NavigationMenuList>
							</NavigationMenu>
						</div>

						{/* Mobile Burger Menu Button */}
						<button
							aria-label="Toggle mobile menu"
							className="group relative rounded border border-transparent p-2.5 transition-colors hover:border-border hover:bg-muted/50 active:bg-muted/70 md:hidden"
							onClick={toggleMobileMenu}
							type="button"
						>
							<div className="relative size-5">
								<Menu
									className={`absolute inset-0 size-5 transition-all duration-200 ${
										isMobileMenuOpen
											? "rotate-90 opacity-0"
											: "rotate-0 opacity-100"
									}`}
								/>
								<X
									className={`absolute inset-0 size-5 transition-all duration-200 ${
										isMobileMenuOpen
											? "rotate-0 opacity-100"
											: "-rotate-90 opacity-0"
									}`}
								/>
							</div>
						</button>
					</div>
				</div>
			</nav>

			{/* Mobile Navigation Menu */}
			<div
				className={`overflow-hidden transition-all duration-200 md:hidden ${
					isMobileMenuOpen
						? "max-h-[85vh] border-border border-b opacity-100"
						: "max-h-0 opacity-0"
				}`}
			>
				<div className="bg-background">
					<div className="mx-auto max-w-7xl px-4 py-3 sm:px-6">
						{/* Featured: Web Analytics */}
						<Link
							className="group mb-3 flex items-center gap-3 rounded border border-primary/20 bg-primary/5 p-3 transition-all hover:border-primary/30 hover:bg-primary/10"
							href="/docs"
							onClick={() => setIsMobileMenuOpen(false)}
						>
							<div className="flex size-9 shrink-0 items-center justify-center rounded border border-primary/20 bg-primary/10">
								<ChartBarIcon
									className="size-4 text-primary"
									weight="duotone"
								/>
							</div>
							<div className="flex-1">
								<p className="font-semibold text-sm">Web Analytics</p>
								<p className="text-muted-foreground text-xs">
									Privacy-first, real-time analytics
								</p>
							</div>
							<span className="rounded-full border border-primary/30 bg-primary/10 px-1.5 py-0.5 text-[9px] text-primary">
								Core
							</span>
						</Link>

						{/* Products Grid */}
						<div className="mb-3 space-y-1.5">
							{productLinks.map((link) => {
								const IconComponent = link.icon;
								return (
									<Link
										className={cn(
											"flex items-center gap-3 rounded border bg-card/50 p-2.5 transition-all hover:bg-card",
											link.borderColor
										)}
										href={link.href}
										key={link.title}
										onClick={() => setIsMobileMenuOpen(false)}
									>
										<div
											className={cn(
												"flex size-7 shrink-0 items-center justify-center rounded",
												link.bgColor
											)}
										>
											<IconComponent
												className={cn("size-4", link.color)}
												weight="duotone"
											/>
										</div>
										<div className="flex-1">
											<p className="font-medium text-sm">{link.title}</p>
											<p className="text-[11px] text-muted-foreground">
												{link.description}
											</p>
										</div>
										{link.isNew && (
											<span className="rounded-full bg-emerald-400/10 px-1.5 py-0.5 font-medium text-[9px] text-emerald-500 uppercase">
												New
											</span>
										)}
									</Link>
								);
							})}
						</div>

						{/* Divider */}
						<div className="mb-3 border-border border-t" />

						{/* Docs & SDK */}
						<div className="mb-3 flex gap-4">
							<div className="flex-1">
								<p className="mb-1.5 text-[10px] text-muted-foreground uppercase tracking-wider">
									Docs
								</p>
								<div className="flex flex-col">
									{docsLinks.map((link) => (
										<Link
											className="rounded px-2 py-1 text-sm transition-colors hover:bg-muted"
											href={link.href}
											key={link.title}
											onClick={() => setIsMobileMenuOpen(false)}
										>
											{link.title}
										</Link>
									))}
								</div>
							</div>
							<div className="flex-1">
								<p className="mb-1.5 text-[10px] text-muted-foreground uppercase tracking-wider">
									SDK
								</p>
								<div className="flex flex-col">
									{sdkLinks.map((link) => (
										<Link
											className="rounded px-2 py-1 text-muted-foreground text-sm transition-colors hover:bg-muted hover:text-foreground"
											href={link.href}
											key={link.title}
											onClick={() => setIsMobileMenuOpen(false)}
										>
											{link.title}
										</Link>
									))}
								</div>
							</div>
						</div>

						{/* Divider */}
						<div className="mb-3 border-border border-t" />

						{/* Other Links */}
						<div className="mb-3 flex flex-wrap items-center gap-1.5">
							<Link
								className="rounded border border-border/50 px-2.5 py-1.5 text-sm transition-colors hover:bg-muted"
								href="/blog"
								onClick={() => setIsMobileMenuOpen(false)}
							>
								Blog
							</Link>
							<Link
								className="rounded border border-border/50 px-2.5 py-1.5 text-sm transition-colors hover:bg-muted"
								href="/pricing"
								onClick={() => setIsMobileMenuOpen(false)}
							>
								Pricing
							</Link>
							<a
								className="flex items-center gap-1.5 rounded border border-border/50 px-2.5 py-1.5 text-sm transition-colors hover:bg-muted"
								href="https://github.com/databuddy-analytics/Databuddy"
								onClick={() => setIsMobileMenuOpen(false)}
								rel="noopener noreferrer"
								target="_blank"
							>
								<svg
									height="1em"
									viewBox="0 0 496 512"
									width="1em"
									xmlns="http://www.w3.org/2000/svg"
								>
									<title>GitHub</title>
									<path
										d="M165.9 397.4c0 2-2.3 3.6-5.2 3.6c-3.3.3-5.6-1.3-5.6-3.6c0-2 2.3-3.6 5.2-3.6c3-.3 5.6 1.3 5.6 3.6m-31.1-4.5c-.7 2 1.3 4.3 4.3 4.9c2.6 1 5.6 0 6.2-2s-1.3-4.3-4.3-5.2c-2.6-.7-5.5.3-6.2 2.3m44.2-1.7c-2.9.7-4.9 2.6-4.6 4.9c.3 2 2.9 3.3 5.9 2.6c2.9-.7 4.9-2.6 4.6-4.6c-.3-1.9-3-3.2-5.9-2.9M244.8 8C106.1 8 0 113.3 0 252c0 110.9 69.8 205.8 169.5 239.2c12.8 2.3 17.3-5.6 17.3-12.1c0-6.2-.3-40.4-.3-61.4c0 0-70 15-84.7-29.8c0 0-11.4-29.1-27.8-36.6c0 0-22.9-15.7 1.6-15.4c0 0 24.9 2 38.6 25.8c21.9 38.6 58.6 27.5 72.9 20.9c2.3-16 8.8-27.1 16-33.7c-55.9-6.2-112.3-14.3-112.3-110.5c0-27.5 7.6-41.3 23.6-58.9c-2.6-6.5-11.1-33.3 2.6-67.9c20.9-6.5 69 27 69 27c20-5.6 41.5-8.5 62.8-8.5s42.8 2.9 62.8 8.5c0 0 48.1-33.6 69-27c13.7 34.7 5.2 61.4 2.6 67.9c16 17.7 25.8 31.5 25.8 58.9c0 96.5-58.9 104.2-114.8 110.5c9.2 7.9 17 22.9 17 46.4c0 33.7-.3 75.4-.3 83.6c0 6.5 4.6 14.4 17.3 12.1C428.2 457.8 496 362.9 496 252C496 113.3 383.5 8 244.8 8M97.2 352.9c-1.3 1-1 3.3.7 5.2c1.6 1.6 3.9 2.3 5.2 1c1.3-1 1-3.3-.7-5.2c-1.6-1.6-3.9-2.3-5.2-1m-10.8-8.1c-.7 1.3.3 2.9 2.3 3.9c1.6 1 3.6.7 4.3-.7c.7-1.3-.3-2.9-2.3-3.9c-2-.6-3.6-.3-4.3.7m32.4 35.6c-1.6 1.3-1 4.3 1.3 6.2c2.3 2.3 5.2 2.6 6.5 1c1.3-1.3.7-4.3-1.3-6.2c-2.2-2.3-5.2-2.6-6.5-1m-11.4-14.7c-1.6 1-1.6 3.6 0 5.9s4.3 3.3 5.6 2.3c1.6-1.3 1.6-3.9 0-6.2c-1.4-2.3-4-3.3-5.6-2"
										fill="currentColor"
									/>
								</svg>
								{typeof stars === "number" && (
									<span className="text-muted-foreground text-xs tabular-nums">
										{stars.toLocaleString()}
									</span>
								)}
							</a>
							<div className="ml-auto">
								<ThemeToggle />
							</div>
						</div>

						{/* Dashboard CTA */}
						<a
							className="flex w-full items-center justify-center gap-1.5 rounded border border-primary bg-primary px-3 py-2.5 font-medium text-primary-foreground text-sm transition-colors hover:bg-primary/90"
							href="https://app.databuddy.cc/login"
							onClick={() => setIsMobileMenuOpen(false)}
							rel="noopener noreferrer"
							target="_blank"
						>
							Open Dashboard
							<ArrowRightIcon className="size-3.5" />
						</a>
					</div>
				</div>
			</div>
		</div>
	);
};
