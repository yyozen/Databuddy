import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	experimental: {
		optimizePackageImports: ["@phosphor-icons/react"],
	},
	typescript: {
		ignoreBuildErrors: true,
	},
	images: {
		remotePatterns: [
			{
				protocol: "https",
				hostname: "cdn.databuddy.cc",
			},
			{
				protocol: "http",
				hostname: "localhost",
			},
			{
				protocol: "https",
				hostname: "icons.duckduckgo.com",
			},
			{
				protocol: "https",
				hostname: "flagcdn.com",
			},
			{
				protocol: "https",
				hostname: "multiavatar.com",
			},
		],
	},
	transpilePackages: [],
	output: "standalone",
	async rewrites() {
		return [
			{
				source: "/geojson/:path*",
				destination: "https://cdn.databuddy.cc/geojson/:path*",
			},
		];
	},
	async headers() {
		const securityHeaders = [
			{
				key: "Strict-Transport-Security",
				value: "max-age=31536000; includeSubDomains; preload",
			},
			{
				key: "X-Content-Type-Options",
				value: "nosniff",
			},
			{
				key: "Referrer-Policy",
				value: "strict-origin-when-cross-origin",
			},
			{
				key: "Permissions-Policy",
				value: "camera=(), microphone=(), geolocation=()",
			},
		];

		const cspDirectives = [
			"default-src 'self'",
			"script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.databuddy.cc",
			"style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
			"font-src 'self' https://fonts.gstatic.com",
			"img-src 'self' data: blob: https://cdn.databuddy.cc https://icons.duckduckgo.com https://flagcdn.com https://multiavatar.com",
			"connect-src 'self' https://cdn.databuddy.cc https://*.databuddy.cc wss://*.databuddy.cc",
			"frame-ancestors 'none'",
			"base-uri 'self'",
			"form-action 'self'",
		];

		const demoCspDirectives = [
			"default-src 'self'",
			"script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.databuddy.cc",
			"style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
			"font-src 'self' https://fonts.gstatic.com",
			"img-src 'self' data: blob: https://cdn.databuddy.cc https://icons.duckduckgo.com https://flagcdn.com https://multiavatar.com",
			"connect-src 'self' https://cdn.databuddy.cc https://*.databuddy.cc wss://*.databuddy.cc",
			"frame-ancestors 'self' https://*.databuddy.cc https://databuddy.cc",
			"base-uri 'self'",
			"form-action 'self'",
		];

		return [
			{
				source: "/demo/:path*",
				headers: [
					...securityHeaders,
					{
						key: "Content-Security-Policy",
						value: demoCspDirectives.join("; "),
					},
				],
			},
			{
				source: "/((?!demo).*)",
				headers: [
					...securityHeaders,
					{
						key: "X-Frame-Options",
						value: "DENY",
					},
					{
						key: "Content-Security-Policy",
						value: cspDirectives.join("; "),
					},
				],
			},
		];
	},
};

export default nextConfig;
