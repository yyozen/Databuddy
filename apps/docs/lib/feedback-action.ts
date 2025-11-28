"use server";

import { Databuddy } from "@databuddy/sdk/node";
import type { ActionResponse, Feedback } from "@/components/feedback";

const client = new Databuddy({
    clientId: process.env.NEXT_PUBLIC_DATABUDDY_CLIENT_ID ?? "OXmNQsViBT-FOS_wZCTHc",
    debug: process.env.NODE_ENV === "development",
});

export async function onRateDocs(
    url: string,
    feedback: Feedback
): Promise<ActionResponse> {
    try {
        await client.track({
            name: "docs_feedback",
            properties: {
                url,
                opinion: feedback.opinion,
                message: feedback.message,
            },
        });

        await client.flush();

        return { success: true };
    } catch (error) {
        console.error("Failed to capture docs feedback:", error);
        return { success: false };
    }
}

