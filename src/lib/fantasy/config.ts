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
/** "fast" roughly doubles output tokens/sec at 2x the token price ($10/$50). */
export const FANTASY_SPEED = process.env.FANTASY_SPEED ?? agentConfig.speed;

/** Anthropic caps image input at 5 per request; keep the payload well under 32 MB. */
export const MAX_IMAGES_PER_MESSAGE = 4;
export const MAX_IMAGE_BYTES = 4 * 1024 * 1024;
export const ALLOWED_IMAGE_TYPES = ["image/png", "image/jpeg", "image/gif", "image/webp"];

export const FANTASY_AGENT_ID = process.env.FANTASY_AGENT_ID ?? "";
export const FANTASY_ENVIRONMENT_ID = process.env.FANTASY_ENVIRONMENT_ID ?? "";

export const SPORTS_SEARCH_TOOL = agentConfig.toolName;
export const ALLOWED_HOSTS = agentConfig.allowedHosts;

export const fantasyConfigured = (): boolean =>
  Boolean(process.env.ANTHROPIC_API_KEY && FANTASY_AGENT_ID && FANTASY_ENVIRONMENT_ID);
