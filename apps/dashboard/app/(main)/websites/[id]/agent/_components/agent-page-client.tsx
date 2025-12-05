"use client";

import { useEffect, useRef } from "react";
import type { UIMessage } from "ai";
import { useSetAtom } from "jotai";
import { agentMessagesAtom, agentStatusAtom } from "./agent-atoms";
import { AgentPageContent } from "./agent-page-content";

const DEBUG_PREFIX = "[AGENT-PAGE-CLIENT]";

interface AgentPageClientProps {
	chatId: string;
	websiteId: string;
	initialMessages?: UIMessage[];
}

export function AgentPageClient({ 
	chatId, 
	websiteId,
	initialMessages = []
}: AgentPageClientProps) {
	const setMessages = useSetAtom(agentMessagesAtom);
	const setStatus = useSetAtom(agentStatusAtom);
	const prevChatIdRef = useRef<string | null>(null);

	console.log(`${DEBUG_PREFIX} Component render:`, {
		chatId,
		websiteId,
		initialMessagesCount: initialMessages.length,
		prevChatId: prevChatIdRef.current
	});

	useEffect(() => {
		const prevChatId = prevChatIdRef.current;
		console.log(`${DEBUG_PREFIX} Effect triggered:`, {
			prevChatId,
			currentChatId: chatId,
			initialMessagesCount: initialMessages.length,
			shouldSet: prevChatId !== chatId && initialMessages.length > 0
		});

		if (prevChatId !== chatId && initialMessages.length > 0) {
			console.log(`${DEBUG_PREFIX} Setting initial messages:`, initialMessages.length);
			setMessages(initialMessages);
			setStatus("idle");
			prevChatIdRef.current = chatId;
		} else if (prevChatId === chatId && initialMessages.length > 0) {
			console.log(`${DEBUG_PREFIX} Same chatId, checking if messages need update`);
			// Still set messages if they exist, even if chatId hasn't changed (initial mount)
			setMessages(initialMessages);
			setStatus("idle");
		}
	}, [chatId, initialMessages, setMessages, setStatus]);

	return (
		<div className="relative flex h-full flex-col">
			<AgentPageContent chatId={chatId} websiteId={websiteId} />
		</div>
	);
}

