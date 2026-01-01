import { getServerRPCClient } from "@/lib/orpc-server";
import { WebsiteLayoutClient } from "./_components/website-layout-client";

interface WebsiteLayoutProps {
	children: React.ReactNode;
	params: Promise<{ id: string }>;
}

export default async function WebsiteLayout({
	children,
	params,
}: WebsiteLayoutProps) {
	const { id: websiteId } = await params;
	const rpc = await getServerRPCClient();

	const [website, trackingData] = await Promise.all([
		rpc.websites.getById({ id: websiteId }).catch(() => null),
		rpc.websites.isTrackingSetup({ websiteId }).catch(() => null),
	]);

	return (
		<WebsiteLayoutClient
			initialTrackingSetup={trackingData?.tracking_setup ?? false}
			initialWebsite={website}
			websiteId={websiteId}
		>
			{children}
		</WebsiteLayoutClient>
	);
}
