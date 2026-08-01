#!/usr/bin/env node
/**
 * ONE-TIME SETUP — creates the Managed Agents environment + agent, then prints
 * the IDs to put in .env. Agents are persistent, versioned resources: never
 * call agents.create() from the request path.
 *
 *   node scripts/setup-fantasy-agent.mjs            # create (first run)
 *   node scripts/setup-fantasy-agent.mjs --update   # publish a new agent version
 *
 * Re-run with --update after editing src/lib/prompts/fantasy-football.ts.
 */
import Anthropic from "@anthropic-ai/sdk";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..");

// The prompt and config live in .ts files; pull the literals out rather than
// adding a TS build step just for a setup script.
function extractPrompt() {
  const src = readFileSync(join(root, "src/lib/prompts/fantasy-football.ts"), "utf8");
  const m = src.match(/FANTASY_FOOTBALL_SYSTEM = `([\s\S]*?)`;\n/);
  if (!m) throw new Error("Could not extract FANTASY_FOOTBALL_SYSTEM from the prompt file.");
  return m[1].replace(/\\`/g, "`").replace(/\\\$/g, "$");
}

/** Single source of truth, shared with src/lib/fantasy/config.ts. */
function loadConfig() {
  const cfg = JSON.parse(readFileSync(join(root, "src/lib/fantasy/agent.config.json"), "utf8"));
  return {
    ...cfg,
    model: process.env.FANTASY_MODEL ?? cfg.model,
    effort: process.env.FANTASY_EFFORT ?? cfg.effort,
  };
}

async function main() {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error(
      "ANTHROPIC_API_KEY is required.\n" +
        "Managed Agents runs on the Anthropic API only — an AWS_BEARER_TOKEN_BEDROCK will not work here."
    );
    process.exit(1);
  }

  const cfg = loadConfig();
  const system = extractPrompt();
  const client = new Anthropic();
  const update = process.argv.includes("--update");

  const tools = [
    { type: "agent_toolset_20260401", default_config: { enabled: true } },
    {
      type: "custom",
      name: cfg.toolName,
      description: cfg.toolDescription,
      input_schema: cfg.toolInputSchema,
    },
  ];

  if (update) {
    const agentId = process.env.FANTASY_AGENT_ID;
    if (!agentId) {
      console.error("FANTASY_AGENT_ID must be set in the environment to run --update.");
      process.exit(1);
    }
    const current = await client.beta.agents.retrieve(agentId);
    const updated = await client.beta.agents.update(agentId, {
      version: current.version,
      system,
      model: { id: cfg.model, effort: { type: cfg.effort } },
      tools,
    });
    console.log(`Updated agent ${updated.id} -> version ${updated.version}`);
    return;
  }

  const environment = await client.beta.environments.create({
    name: `genie-fantasy-football-${Date.now()}`,
    description: "Sandbox for the fantasy football strategist agent.",
    config: {
      type: "cloud",
      // The agent reaches the network through built-in web_search/web_fetch and
      // the host-side sports_search tool, so the sandbox itself needs very
      // little egress. Package managers stay on for ad-hoc analysis scripts.
      networking: {
        type: "limited",
        allow_package_managers: true,
        allow_mcp_servers: false,
        allowed_hosts: cfg.allowedHosts,
      },
    },
  });

  const agent = await client.beta.agents.create({
    name: "Elite Fantasy Football Strategist",
    description:
      "A premium, professional-grade fantasy football advisor with deep analytics, sports medicine, " +
      "coaching, betting/odds, and NFL history expertise — confident, verified, and up to date.",
    model: { id: cfg.model, effort: { type: cfg.effort } },
    system,
    tools,
  });

  console.log("\nCreated. Add these to your .env:\n");
  console.log(`FANTASY_AGENT_ID="${agent.id}"`);
  console.log(`FANTASY_ENVIRONMENT_ID="${environment.id}"`);
  console.log(`\nagent version: ${agent.version}   model: ${cfg.model} (effort: ${cfg.effort})`);
  console.log("Optional: TAVILY_API_KEY to enable the sports_search tool.\n");
}

main().catch((err) => {
  console.error("Setup failed:", err?.message ?? err);
  process.exit(1);
});
