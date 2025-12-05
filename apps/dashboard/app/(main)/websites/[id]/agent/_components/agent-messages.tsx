"use client";

import { PaperclipIcon, RobotIcon, WarningIcon } from "@phosphor-icons/react";
import type { UIMessage } from "ai";
import Image from "next/image";
import { Message, MessageAvatar, MessageContent } from "@/components/ai-elements/message";
import { Response } from "@/components/ai-elements/response";
import { ToolOutput } from "@/components/ai-elements/tool";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useSession } from "@/components/layout/session-provider";
import { AgentMessageActions } from "./agent-message-actions";
import { authClient } from "@databuddy/auth/client";

interface AgentMessagesProps {
	messages: UIMessage[];
	isStreaming?: boolean;
	hasError?: boolean;
}

function getTextContent(message: UIMessage): string {
	if (!message.parts) return "";
	return message.parts
		.filter(
			(part): part is { type: "text"; text: string } => part.type === "text"
		)
		.map((part) => part.text)
		.join("");
}

function extractFileParts(parts: UIMessage["parts"]) {
	return parts.filter((part) => part.type === "file");
}

function extractToolParts(parts: UIMessage["parts"]) {
	return parts.filter((part) => part.type?.startsWith("tool")) as Array<{
		type: string;
		toolCallId?: string;
		toolName?: string;
		output?: unknown;
		errorText?: string;
	}>;
}

const DEBUG_PREFIX = "[AGENT-MESSAGES]";

export function AgentMessages({
	messages,
	isStreaming = false,
	hasError = false,
}: AgentMessagesProps) {
	console.log(`${DEBUG_PREFIX} Render:`, {
		messagesCount: messages.length,
		isStreaming,
		hasError,
		messages: messages.map(m => ({ id: m.id, role: m.role, textLength: m.parts?.find(p => p.type === "text")?.text?.length || 0 }))
	});

	if (messages.length === 0) {
		console.log(`${DEBUG_PREFIX} No messages to render`);
		return null;
	}

	return (
		<>
			{messages.map((message, index) => {
				const isLastMessage = index === messages.length - 1;
				const isAssistant = message.role === "assistant";
				const textContent = getTextContent(message);
				const fileParts = extractFileParts(message.parts);
				const toolParts = extractToolParts(message.parts);
				const hasToolErrors = toolParts.some((tool) => tool.errorText);
				const showError = isLastMessage && hasError && isAssistant;
				const isMessageFinished = !isLastMessage || !isStreaming;

				return (
					<div key={message.id} className="group">
						{/* Render tool parts (including errors) */}
						{toolParts.length > 0 && (
							<Message from={message.role}>
								<MessageContent className="max-w-[80%]">
									<div className="space-y-2">
										{toolParts.map((toolPart) => (
											<div key={toolPart.toolCallId}>
												{toolPart.errorText && (
													<div className="rounded border border-destructive/20 bg-destructive/5 p-3">
														<div className="flex items-start gap-2">
															<WarningIcon
																className="size-4 shrink-0 text-destructive mt-0.5"
																weight="fill"
															/>
															<div className="flex-1 min-w-0">
																<p className="font-medium text-destructive text-sm mb-1">
																	Tool Error: {toolPart.toolName}
																</p>
																<p className="text-destructive/80 text-xs">
																	{toolPart.errorText}
																</p>
															</div>
														</div>
													</div>
												)}
												{!toolPart.errorText && toolPart.output !== undefined && (
													<ToolOutput
														output={
															typeof toolPart.output === "string" ||
															typeof toolPart.output === "object"
																? (toolPart.output as string | Record<string, unknown>)
																: String(toolPart.output)
														}
														errorText={toolPart.errorText}
													/>
												)}
											</div>
										))}
									</div>
								</MessageContent>
								{message.role === "assistant" && (
									<AgentMessageAvatar hasError={hasToolErrors} />
								)}
							</Message>
						)}

						{/* Render file attachments */}
						{fileParts.length > 0 && (
							<Message from={message.role}>
								<MessageContent className="max-w-[80%]">
									<div className="flex flex-wrap gap-2 mb-2">
										{fileParts.map((part) => {
											if (part.type !== "file") return null;

											const file = part as {
												type: "file";
												url?: string;
												mediaType?: string;
												filename?: string;
											};

											const fileKey = `${file.url}-${file.filename}`;
											const isImage = file.mediaType?.startsWith("image/");

											if (isImage && file.url) {
												return (
													<div
														key={fileKey}
														className="relative rounded border overflow-hidden"
													>
														<Image
															src={file.url}
															alt={file.filename || "attachment"}
															className="max-w-xs max-h-48 object-cover"
															height={192}
															unoptimized
															width={300}
														/>
													</div>
												);
											}

											return (
												<div
													key={fileKey}
													className="flex items-center gap-2 px-3 py-2 rounded border bg-muted/50"
												>
													<PaperclipIcon
														className="size-4 shrink-0 text-muted-foreground"
														weight="duotone"
													/>
													<span className="font-medium text-sm">
														{file.filename || "Unknown file"}
													</span>
												</div>
											);
										})}
									</div>
								</MessageContent>
								{message.role === "user" && <UserMessageAvatar />}
							</Message>
						)}

						{/* Render text content */}
						{textContent && !showError && (
							<Message from={message.role}>
								<MessageContent className="max-w-[80%]" variant="flat">
									{isLastMessage && isStreaming ? (
										<Response isAnimating>{textContent}</Response>
									) : (
										<Response>{textContent}</Response>
									)}
								</MessageContent>
								{message.role === "user" && <UserMessageAvatar />}
								{message.role === "assistant" && <AgentMessageAvatar hasError={hasError} />}
							</Message>
						)}

						{/* Render error state */}
						{showError && (
							<Message from="assistant">
								<MessageContent className="max-w-[80%]">
									<div className="space-y-2">
										<p className="font-medium text-destructive text-sm">
											Failed to generate response
										</p>
										<p className="text-muted-foreground text-xs">
											There was an error processing your request. Please try again.
										</p>
									</div>
								</MessageContent>
								<AgentMessageAvatar hasError />
							</Message>
						)}

						{/* Render message actions for finished assistant messages */}
						{isAssistant &&
							isMessageFinished &&
							textContent &&
							!showError && (
								<div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
									<div className="flex items-center gap-1 mt-3">
										<AgentMessageActions
											isError={false}
											isLastMessage={isLastMessage}
											messageContent={textContent}
										/>
									</div>
								</div>
							)}
					</div>
				);
			})}
		</>
	);
}

function UserMessageAvatar() {
	const { data: session, isPending } = authClient.useSession();
	const user = session?.user;

	if (isPending) return <Skeleton className="size-8 rounded-full shrink-0" />;

	return (
		<MessageAvatar
			src={user?.image || ""}
			name={user?.name || user?.email || "User"}
		/>
	);
}

function AgentMessageAvatar({ hasError = false }: { hasError?: boolean }) {
	return (
		<Avatar className="size-8 ring-1 ring-border shrink-0">
			<AvatarFallback
				className={cn(
					hasError ? "bg-destructive/10" : "bg-primary/10"
				)}
			>
				<RobotIcon
					className={cn(
						"size-4",
						hasError ? "text-destructive" : "text-primary"
					)}
					weight="duotone"
				/>
			</AvatarFallback>
		</Avatar>
	);
}

export function MessagesLoadingSkeleton() {
	return (
		<div className="space-y-4">
			<Message from="user">
				<MessageContent className="max-w-[80%]">
					<Skeleton className="h-4 w-32" />
				</MessageContent>
				<Skeleton className="size-8 rounded-full shrink-0" />
			</Message>
			<Message from="assistant">
				<Skeleton className="size-8 rounded-full shrink-0" />
				<MessageContent className="max-w-[80%]">
					<div className="space-y-2">
						<Skeleton className="h-4 w-full" />
						<Skeleton className="h-4 w-3/4" />
						<Skeleton className="h-4 w-1/2" />
					</div>
				</MessageContent>
			</Message>
		</div>
	);
}
