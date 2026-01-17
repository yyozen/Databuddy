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
	const video = link.ogVideoUrl ? escapeHtml(link.ogVideoUrl) : "";
	const url = escapeHtml(requestUrl);
	const dest = escapeHtml(destinationUrl);

	return `<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="utf-8">
	<meta name="viewport" content="width=device-width, initial-scale=1">
	<title>${title}</title>

	<!-- Open Graph -->
	<meta property="og:site_name" content="Databuddy">
	<meta property="og:type" content="website">
	<meta property="og:url" content="${url}">
	<meta property="og:title" content="${title}">
	${description ? `<meta property="og:description" content="${description}">` : ""}
	${image ? `<meta property="og:image" content="${image}">` : ""}
	${image ? `<meta property="og:image:url" content="${image}">` : ""}
	${image ? `<meta property="og:image:secure_url" content="${image}">` : ""}
	${image ? `<meta property="og:image:type" content="image/png">` : ""}
	${image ? `<meta property="og:image:width" content="1200">` : ""}
	${image ? `<meta property="og:image:height" content="630">` : ""}
	${image ? `<meta property="og:image:alt" content="${title}">` : ""}
	${video ? `<meta property="og:video" content="${video}">` : ""}
	${video ? `<meta property="og:video:secure_url" content="${video}">` : ""}
	${video ? `<meta property="og:video:type" content="video/mp4">` : ""}

	<!-- Twitter -->
	<meta name="twitter:card" content="${video ? "player" : image ? "summary_large_image" : "summary"}">
	<meta name="twitter:title" content="${title}">
	${description ? `<meta name="twitter:description" content="${description}">` : ""}
	${image ? `<meta name="twitter:image" content="${image}">` : ""}
	${image ? `<meta name="twitter:image:alt" content="${title}">` : ""}
	${video ? `<meta name="twitter:player" content="${video}">` : ""}

	<!-- Link tags for bots that follow them -->
	${image ? `<link rel="image_src" href="${image}">` : ""}
</head>
<body>
	<script>window.location.replace("${dest}")</script>
	<noscript><a href="${dest}">Click here to continue</a></noscript>
</body>
</html>`;
}
