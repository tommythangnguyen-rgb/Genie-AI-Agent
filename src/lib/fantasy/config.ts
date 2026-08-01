import "server-only";
import agentConfig from "./agent.config.json";

/**
 * Managed Agents runs on the Anthropic API only — it is not available on
 * Amazon Bedrock, so this feature deliberately bypasses the Bedrock-first
 * selection in src/lib/provider.ts and requires ANTHROPIC_API_KEY.
 *
 * Values shared with scripts/setup-fantasy-agent.mjs live in
 * agent.config.json so the running app and the agent published to Anthropic
 * can't drift apart.
 */
export const FANTASY_MODEL = process.env.FANTASY_MODEL ?? agentConfig.model;
export const FANTASY_EFFORT = process.env.FANTASY_EFFORT ?? agentConfig.effort;

export const FANTASY_AGENT_ID = process.env.FANTASY_AGENT_ID ?? "";
export const FANTASY_ENVIRONMENT_ID = process.env.FANTASY_ENVIRONMENT_ID ?? "";

export const SPORTS_SEARCH_TOOL = agentConfig.toolName;
export const ALLOWED_HOSTS = agentConfig.allowedHosts;

export const fantasyConfigured = (): boolean =>
  Boolean(process.env.ANTHROPIC_API_KEY && FANTASY_AGENT_ID && FANTASY_ENVIRONMENT_ID);
