"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";

const industryLeaders = [
	{
		name: "Open (YC W24)",
		url: "https://open.cx",
		logo: "/social/opencx-black.svg",
		invert: true,
		description: "AI-Powered customer support platform",
	},
	{
		name: "Autumn (S25)",
		url: "https://useautumn.com",
		logo: "/social/autumn.svg",
		logoClass: "h-8 sm:h-10",
		invert: false,
		description: "Monetization infrastructure for developers",
	},
	{
		name: "Better Auth (YC X25)",
		url: "https://www.better-auth.com",
		logo: "/social/better-auth.svg",
		invert: true,
		description: "The #1 Authentication framework for TypeScript",
	},
	{
		name: "OpenCut",
		url: "https://opencut.app",
		logo: "/social/opencut.svg",
		invert: true,
		description: "Open source video editor",
	},
	{
		name: "Maza",
		url: "https://maza.vc",
		logo: "/social/maza.svg",
		description: "Venture Capital Fund",
	},
	{
		name: "Figurable",
		url: "https://figurable.ai",
		logo: "/social/figurable.svg",
		invert: true,
	},
];

// const engineerCompanies = [{ name: "Vercel" }, { name: "Mintlify" }];

function MarqueeItem({ company }: { company: (typeof industryLeaders)[0] }) {
	return (
		<a
			className="group/item relative flex shrink-0 items-center justify-center px-8 opacity-60 transition-opacity duration-200 hover:opacity-100 sm:px-12"
			href={`${company.url}?utm_source=databuddy&utm_medium=referral`}
			rel="noopener"
			target="_blank"
		>
			<Image
				alt={company.name}
				className={cn(
					"h-6 w-auto sm:h-8",
					company.logoClass,
					company.invert && "dark:invert"
				)}
				height={32}
				src={company.logo}
				width={120}
			/>
			{company.description && (
				<span className="absolute top-full left-1/2 mt-1 -translate-x-1/2 whitespace-nowrap text-center text-muted-foreground text-xs opacity-0 transition-opacity group-hover/item:opacity-100">
					{company.description}
				</span>
			)}
		</a>
	);
}

export function TrustedBy() {
	return (
		<div className="relative space-y-8 sm:space-y-10">
			<div className="space-y-4">
				<p className="text-balance text-center font-medium text-muted-foreground text-xs uppercase tracking-widest">
					Trusted by industry leaders
				</p>

				<div className="group relative overflow-hidden">
					<div className="absolute inset-y-0 left-0 z-10 w-16 bg-linear-to-r from-background to-transparent sm:w-24" />
					<div className="absolute inset-y-0 right-0 z-10 w-16 bg-linear-to-l from-background to-transparent sm:w-24" />

					<div className="flex py-4">
						<div className="flex shrink-0 animate-marquee items-center group-hover:[animation-play-state:paused]">
							{industryLeaders.map((company) => (
								<MarqueeItem company={company} key={company.name} />
							))}
						</div>
						<div className="flex shrink-0 animate-marquee items-center group-hover:[animation-play-state:paused]">
							{industryLeaders.map((company) => (
								<MarqueeItem company={company} key={`${company.name}-copy`} />
							))}
						</div>
					</div>
				</div>
			</div>

			{/* <div className="space-y-4">
				<p className="text-balance text-center font-medium text-muted-foreground text-xs uppercase tracking-widest">
					Trusted by engineers from
				</p>

				<div className="mx-auto grid max-w-2xl grid-cols-2 gap-x-8 gap-y-4 px-4 sm:grid-cols-4 sm:gap-x-12">
					{engineerCompanies.map((company) => (
						<div
							className="flex items-center justify-center"
							key={company.name}
						>
							<span className="font-medium text-muted-foreground/60 text-sm">
								{company.name}
							</span>
						</div>
					))}
				</div>
			</div> */}
		</div>
	);
}
