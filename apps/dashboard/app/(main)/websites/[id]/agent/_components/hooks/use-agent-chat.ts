"use client";

import { useChat, useChatActions } from "@ai-sdk-tools/store";
import type { UIMessage } from "ai";
import { DefaultChatTransport } from "ai";
import { useAtom, useSetAtom } from "jotai";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { agentInputAtom, agentMessagesAtom, agentStatusAtom } from "../agent-atoms";
import { useAgentChatId } from "../agent-chat-context";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

const DEBUG_PREFIX = "[AGENT-CHAT]";

export function useAgentChat() {
    const chatId = useAgentChatId();
    const params = useParams();
    const websiteId = params.id as string;
    const routeChatId = params.chatId as string | undefined;
    const setInput = useSetAtom(agentInputAtom);

    // Use route chatId if available, otherwise fall back to context chatId
    const stableChatId = routeChatId ?? chatId;

    console.log(`${DEBUG_PREFIX} Hook render - chatId: ${chatId}, routeChatId: ${routeChatId}, stableChatId: ${stableChatId}`);

    // Store stable chatId in ref to prevent useChat from resetting
    const stableChatIdRef = useRef<string>(stableChatId);
    if (stableChatIdRef.current !== stableChatId) {
        console.log(`${DEBUG_PREFIX} ChatId changed - old: ${stableChatIdRef.current}, new: ${stableChatId}`);
        stableChatIdRef.current = stableChatId;
    }

    const transport = useMemo(
        () =>
            new DefaultChatTransport({
                api: `${API_URL}/v1/agent/chat`,
                credentials: "include",
                prepareSendMessagesRequest({ messages, id }) {
                    const lastMessage = messages[messages.length - 1];
                    return {
                        body: {
                            id,
                            websiteId,
                            message: lastMessage,
                            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                        },
                    };
                },
            }),
        [websiteId]
    );

    // Use useChat from SDK but sync to Jotai for persistence
    const { messages: sdkMessages, status: sdkStatus } = useChat<UIMessage>({
        id: stableChatIdRef.current,
        transport,
    });

    console.log(`${DEBUG_PREFIX} SDK messages:`, {
        count: sdkMessages.length,
        messages: sdkMessages.map(m => ({ id: m.id, role: m.role, textLength: m.parts?.find(p => p.type === "text")?.text?.length || 0 }))
    });

    // Sync SDK messages to Jotai atom for persistence
    const [jotaiMessages, setJotaiMessages] = useAtom(agentMessagesAtom);
    const [jotaiStatus, setJotaiStatus] = useAtom(agentStatusAtom);

    // Use refs to track previous values and avoid infinite loops
    const prevSdkMessagesRef = useRef<UIMessage[]>([]);
    const prevSdkStatusRef = useRef<string>(sdkStatus);

    console.log(`${DEBUG_PREFIX} Jotai messages:`, {
        count: jotaiMessages.length,
        messages: jotaiMessages.map(m => ({ id: m.id, role: m.role, textLength: m.parts?.find(p => p.type === "text")?.text?.length || 0 }))
    });

    useEffect(() => {
        // Check if SDK messages actually changed
        const sdkMessagesChanged =
            sdkMessages.length !== prevSdkMessagesRef.current.length ||
            sdkMessages.some((msg, idx) => {
                const prevMsg = prevSdkMessagesRef.current[idx];
                return !prevMsg || msg.id !== prevMsg.id ||
                    JSON.stringify(msg) !== JSON.stringify(prevMsg);
            });

        const sdkStatusChanged = sdkStatus !== prevSdkStatusRef.current;

        // Only proceed if something actually changed
        if (!sdkMessagesChanged && !sdkStatusChanged) {
            return;
        }

        // Use functional update to read current Jotai messages without adding to dependencies
        setJotaiMessages((currentJotaiMessages) => {
            console.log(`${DEBUG_PREFIX} Sync effect triggered - SDK: ${sdkMessages.length} msgs, Jotai: ${currentJotaiMessages.length} msgs, SDK status: ${sdkStatus}`);

            // Always merge when SDK messages change - they're the source of truth for new/updated messages
            if (sdkMessages.length > 0) {
                // Merge: keep Jotai messages that aren't in SDK, update/add SDK messages
                const sdkMessageIds = new Set(sdkMessages.map(m => m.id));
                const mergedMessages: UIMessage[] = [];

                // Add Jotai messages that aren't being updated by SDK (preserve history)
                currentJotaiMessages.forEach(jotaiMsg => {
                    if (!sdkMessageIds.has(jotaiMsg.id)) {
                        mergedMessages.push(jotaiMsg);
                    }
                });

                // Add all SDK messages (they're more up-to-date, including new ones)
                sdkMessages.forEach(sdkMsg => {
                    const existingIndex = mergedMessages.findIndex(m => m.id === sdkMsg.id);
                    if (existingIndex >= 0) {
                        // Update existing message with SDK version (might have new content)
                        mergedMessages[existingIndex] = sdkMsg;
                    } else {
                        // Add new message from SDK
                        mergedMessages.push(sdkMsg);
                    }
                });

                console.log(`${DEBUG_PREFIX} Syncing SDK to Jotai - Jotai: ${currentJotaiMessages.length}, SDK: ${sdkMessages.length}, Merged: ${mergedMessages.length}`);
                return mergedMessages;
            } else if (sdkMessages.length === 0 && currentJotaiMessages.length > 0) {
                // SDK cleared but we have Jotai messages - keep Jotai (preserve history)
                console.log(`${DEBUG_PREFIX} SDK cleared but keeping Jotai messages (${currentJotaiMessages.length})`);
                return currentJotaiMessages;
            } else {
                // Both empty or SDK has messages but we already processed them
                return currentJotaiMessages;
            }
        });

        // Map SDK status to our status type (ready -> idle)
        const mappedStatus = sdkStatus === "ready" ? "idle" : sdkStatus as "idle" | "submitted" | "streaming" | "error";
        setJotaiStatus(mappedStatus);

        // Update refs
        prevSdkMessagesRef.current = sdkMessages;
        prevSdkStatusRef.current = sdkStatus;
    }, [sdkMessages, sdkStatus, setJotaiMessages, setJotaiStatus]);

    // Use Jotai messages for display (they persist even if SDK resets)
    const messages = jotaiMessages.length > 0 ? jotaiMessages : sdkMessages;
    const status = jotaiStatus !== "idle" ? jotaiStatus : sdkStatus;

    console.log(`${DEBUG_PREFIX} Final messages for display:`, {
        count: messages.length,
        source: jotaiMessages.length > 0 ? "jotai" : "sdk",
        messages: messages.map(m => ({ id: m.id, role: m.role, textLength: m.parts?.find(p => p.type === "text")?.text?.length || 0 }))
    });

    const {
        sendMessage: sdkSendMessage,
        reset: sdkReset,
        stop: sdkStop,
    } = useChatActions();

    const lastUserMessageRef = useRef<string>("");

    const sendMessage = useCallback(
        (
            content: string,
            metadata?: { agentChoice?: string; toolChoice?: string }
        ) => {
            if (!content.trim()) return;

            console.log(`${DEBUG_PREFIX} sendMessage called:`, {
                content: content.trim(),
                currentMessages: messages.length,
                jotaiMessages: jotaiMessages.length,
                sdkMessages: sdkMessages.length
            });

            lastUserMessageRef.current = content.trim();
            setInput("");

            sdkSendMessage({
                text: content.trim(),
                metadata,
            });
        },
        [sdkSendMessage, setInput, messages.length, jotaiMessages.length, sdkMessages.length]
    );

    const reset = useCallback(() => {
        console.log(`${DEBUG_PREFIX} reset called - clearing ${jotaiMessages.length} Jotai messages and ${sdkMessages.length} SDK messages`);
        sdkReset();
        setJotaiMessages([]);
        setJotaiStatus("idle");
        setInput("");
        lastUserMessageRef.current = "";
    }, [sdkReset, setJotaiMessages, setJotaiStatus, setInput, jotaiMessages.length, sdkMessages.length]);

    const stop = useCallback(() => {
        sdkStop();
    }, [sdkStop]);

    // Retry by resending the last user message
    const retry = useCallback(() => {
        const lastUserMessage = lastUserMessageRef.current;
        if (!lastUserMessage) return;

        sdkSendMessage({
            text: lastUserMessage,
        });
    }, [sdkSendMessage]);

    const isLoading = status === "streaming" || status === "submitted";
    const hasError = status === "error";

    return {
        messages,
        status,
        isLoading,
        hasError,
        sendMessage,
        stop,
        reset,
        retry,
    };
}
