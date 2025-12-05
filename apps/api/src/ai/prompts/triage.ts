import type { AppContext } from "../config/context";
import { formatContextForLLM } from "../config/context";

/**
 * Agent capabilities for routing decisions.
 * Add new agents here when extending the system.
 */
const AGENT_CAPABILITIES = `<agent-capabilities>
analytics: Website traffic analysis, page views, visitors, performance metrics, traffic sources, geographic data, device breakdown, error tracking, custom events, SQL queries
funnels: Funnel creation, management, and analytics. Conversion funnels, step-by-step analysis, drop-off points, referrer breakdowns, funnel performance metrics
</agent-capabilities>`;

/**
 * Routing rules for the triage agent.
 */
const ROUTING_RULES = `<routing-rules>
- Route funnel-related requests to the funnels agent: creating funnels, viewing funnels, analyzing conversion funnels, funnel analytics, funnel performance, drop-off analysis
- Route ALL analytics and website data questions to the analytics agent
- The analytics agent can handle: traffic, visitors, page views, performance, sources, referrers, errors, events, geographic data, device data
- If unsure, route to analytics agent
</routing-rules>`;

/**
 * Builds the instruction prompt for the triage agent.
 */
export function buildTriageInstructions(ctx: AppContext): string {
	return `Route user requests to the appropriate specialist.

<background-data>
${formatContextForLLM(ctx)}

${AGENT_CAPABILITIES}
</background-data>

${ROUTING_RULES}`;
}
