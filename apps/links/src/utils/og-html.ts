import type { CachedLink } from "@databuddy/redis";

function escapeHtml(text: string): string {
	return text
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&#039;");
}

export function generateOgHtml(
	link: CachedLink,
	requestUrl: string,
	destinationUrl: string
): string {
	const title = escapeHtml(link.ogTitle ?? "Shared Link");
	const description = link.ogDescription ? escapeHtml(link.ogDescription) : "";
	const image = link.ogImageUrl ? escapeHtml(link.ogImageUrl) : "";
	const url = escapeHtml(requestUrl);
	const dest = escapeHtml(destinationUrl);

	return `<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="utf-8">
	<meta name="viewport" content="width=device-width, initial-scale=1">
	<title>${title}</title>
	<meta property="og:title" content="${title}">
	<meta property="og:url" content="${url}">
	<meta property="og:type" content="website">
	${description ? `<meta property="og:description" content="${description}">` : ""}
	${image ? `<meta property="og:image" content="${image}">` : ""}
	${image ? `<meta property="og:image:secure_url" content="${image}">` : ""}
	<meta name="twitter:card" content="${image ? "summary_large_image" : "summary"}">
	<meta name="twitter:title" content="${title}">
	${description ? `<meta name="twitter:description" content="${description}">` : ""}
	${image ? `<meta name="twitter:image" content="${image}">` : ""}
</head>
<body>
	<script>window.location.replace("${dest}")</script>
	<noscript><a href="${dest}">Click here to continue</a></noscript>
</body>
</html>`;
}
