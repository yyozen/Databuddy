import { Provider as ChatProvider } from "@ai-sdk-tools/store";
import type { UIMessage } from "ai";
import { FeatureGate } from "@/components/feature-gate";
import { GATED_FEATURES } from "@/components/providers/billing-provider";
import { getServerRPCClient } from "@/lib/orpc-server";
import { AgentPageClient } from "../_components/agent-page-client";

type Props = {
	params: Promise<{ id: string; chatId: string }>;
};

const DEBUG_PREFIX = "[AGENT-PAGE]";

export default async function AgentPage(props: Props) {
	const { id, chatId } = await props.params;

	console.log(`${DEBUG_PREFIX} Server component render:`, { id, chatId });

	const rpcClient = await getServerRPCClient();
	const chat = await rpcClient.agent.getMessages({ chatId, websiteId: id });

	const initialMessages = (chat?.messages ?? []) as UIMessage[];

	console.log(`${DEBUG_PREFIX} Fetched messages:`, {
		chatId,
		websiteId: id,
		messagesCount: initialMessages.length,
		messages: initialMessages.map(m => ({ id: m.id, role: m.role, textLength: m.parts?.find(p => p.type === "text")?.text?.length || 0 }))
	});

	return (
		// <FeatureGate feature={GATED_FEATURES.AI_AGENT}>
			<ChatProvider
				initialMessages={initialMessages}
				key={`${id}-${chatId}`}
			>
				<AgentPageClient 
					chatId={chatId} 
					websiteId={id}
					initialMessages={initialMessages}
				/>
			</ChatProvider>
		// </FeatureGate>
	);
}
