import { notFound } from "next/navigation";
import { ImageResponse } from "next/og";
import { getPageImage, source } from "@/lib/source";

export const revalidate = false;

export async function GET(
	_req: Request,
	{ params }: { params: Promise<{ slug: string[] }> }
) {
	const { slug } = await params;
	const page = source.getPage(slug.slice(0, -1));

	if (!page) {
		notFound();
	}

	return new ImageResponse(
		<div
			style={{
				height: "100%",
				width: "100%",
				display: "flex",
				flexDirection: "column",
				alignItems: "flex-start",
				justifyContent: "flex-end",
				backgroundColor: "#09090b",
				padding: "60px 80px",
				position: "relative",
			}}
		>
			{/* Background gradient */}
			<div
				style={{
					position: "absolute",
					top: 0,
					left: 0,
					right: 0,
					bottom: 0,
					background:
						"radial-gradient(ellipse 80% 50% at 50% -20%, rgba(120, 119, 198, 0.3), transparent)",
				}}
			/>

			{/* Grid pattern overlay */}
			<div
				style={{
					position: "absolute",
					top: 0,
					left: 0,
					right: 0,
					bottom: 0,
					backgroundImage:
						"linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)",
					backgroundSize: "60px 60px",
				}}
			/>

			{/* Logo and brand */}
			<div
				style={{
					position: "absolute",
					top: "60px",
					left: "80px",
					display: "flex",
					alignItems: "center",
					gap: "12px",
				}}
			>
				<div
					style={{
						width: "40px",
						height: "40px",
						borderRadius: "8px",
						backgroundColor: "#a855f7",
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
					}}
				>
					<svg
						aria-hidden="true"
						fill="white"
						height="24"
						viewBox="0 0 24 24"
						width="24"
					>
						<path d="M3 3v18h18V3H3zm16 16H5V5h14v14zM7 7h2v10H7V7zm4 4h2v6h-2v-6zm4-2h2v8h-2V9z" />
					</svg>
				</div>
				<span
					style={{
						color: "#fafafa",
						fontSize: "24px",
						fontWeight: 600,
						letterSpacing: "-0.02em",
					}}
				>
					Databuddy
				</span>
			</div>

			{/* Documentation badge */}
			<div
				style={{
					display: "flex",
					alignItems: "center",
					gap: "8px",
					marginBottom: "24px",
					padding: "8px 16px",
					backgroundColor: "rgba(168, 85, 247, 0.15)",
					borderRadius: "9999px",
					border: "1px solid rgba(168, 85, 247, 0.3)",
				}}
			>
				<span
					style={{
						color: "#a855f7",
						fontSize: "14px",
						fontWeight: 500,
						textTransform: "uppercase",
						letterSpacing: "0.05em",
					}}
				>
					Documentation
				</span>
			</div>

			{/* Title */}
			<h1
				style={{
					color: "#fafafa",
					fontSize: "64px",
					fontWeight: 700,
					lineHeight: 1.1,
					letterSpacing: "-0.03em",
					marginBottom: "16px",
					maxWidth: "900px",
				}}
			>
				{page.data.title}
			</h1>

			{/* Description */}
			{page.data.description && (
				<p
					style={{
						color: "#a1a1aa",
						fontSize: "24px",
						lineHeight: 1.4,
						maxWidth: "800px",
					}}
				>
					{page.data.description}
				</p>
			)}

			{/* Bottom bar */}
			<div
				style={{
					position: "absolute",
					bottom: "60px",
					right: "80px",
					display: "flex",
					alignItems: "center",
					gap: "8px",
				}}
			>
				<span
					style={{
						color: "#71717a",
						fontSize: "18px",
					}}
				>
					databuddy.cc/docs
				</span>
			</div>
		</div>,
		{
			width: 1200,
			height: 630,
		}
	);
}

export function generateStaticParams() {
	return source.getPages().map((page) => ({
		slug: getPageImage(page).segments,
	}));
}
