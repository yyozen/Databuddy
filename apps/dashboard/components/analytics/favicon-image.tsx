"use client";

import { GlobeIcon } from "@phosphor-icons/react";
import Image from "next/image";
import { useState } from "react";

interface FaviconImageProps {
	domain: string;
	altText?: string;
	size?: number;
	className?: string;
	fallbackIcon?: React.ReactNode;
}

const hostnameRegex = /^https?:\/\//;
const wwwRegex = /^www\./;

/**
 * Maps CDN/plugin domains to their canonical brand domains for favicon lookup
 */
const FAVICON_DOMAIN_MAP: Record<string, string> = {
	"framercdn.com": "framer.com",
	"plugins.framercdn.com": "framer.com",
	"figma.design": "figma.com",
	"canva.me": "canva.com",
	"vercel.app": "vercel.com",
	"netlify.app": "netlify.com",
	"pages.dev": "cloudflare.com",
	"workers.dev": "cloudflare.com",
	"checkout.stripe.com": "stripe.com",
	"billing.stripe.com": "stripe.com",
	"invoice.stripe.com": "stripe.com",
};

function getFaviconDomain(hostname: string): string {
	// Check exact match first
	if (hostname in FAVICON_DOMAIN_MAP) {
		return FAVICON_DOMAIN_MAP[hostname];
	}

	// Check if it's a subdomain of a mapped domain
	for (const [pattern, canonical] of Object.entries(FAVICON_DOMAIN_MAP)) {
		if (hostname.endsWith(`.${pattern}`)) {
			return canonical;
		}
	}

	return hostname;
}

export function FaviconImage({
	domain,
	altText,
	size = 20,
	className = "",
	fallbackIcon,
}: FaviconImageProps) {
	const [error, setError] = useState(false);
	const [loaded, setLoaded] = useState(false);

	const hostname = domain
		.replace(hostnameRegex, "")
		.replace(wwwRegex, "")
		.split("/")[0]
		.split("?")[0]
		.split("#")[0];

	const faviconHost = getFaviconDomain(hostname);

	const invalid =
		!hostname ||
		hostname.length < 3 ||
		!hostname.includes(".") ||
		hostname === "direct" ||
		hostname === "unknown" ||
		hostname.includes("localhost") ||
		hostname.includes("127.0.0.1");

	const showFallback = invalid || error || !loaded;

	const isGitHub = faviconHost === "github.com";

	const fallbackContent = fallbackIcon || (
		<GlobeIcon
			aria-label={altText || "Website icon"}
			className="text-muted-foreground"
			size={size}
			weight="duotone"
		/>
	);

	return (
		<div
			className={`${className} relative flex shrink-0 items-center justify-center rounded-sm`}
			style={{ width: size, height: size, minWidth: size, minHeight: size }}
		>
			{showFallback && (
				<div
					className={`absolute inset-0 flex items-center justify-center ${loaded ? "opacity-0" : "opacity-100"} transition-opacity`}
				>
					{fallbackContent}
				</div>
			)}
			{!invalid && (
				<Image
					alt={altText || `${domain} favicon`}
					className={`${isGitHub ? "dark:invert" : ""} ${loaded ? "opacity-100" : "opacity-0"} transition-opacity`}
					height={size}
					onError={() => setError(true)}
					onLoad={() => setLoaded(true)}
					src={`https://icons.duckduckgo.com/ip3/${faviconHost}.ico`}
					style={{ width: size, height: size }}
					width={size}
				/>
			)}
		</div>
	);
}
