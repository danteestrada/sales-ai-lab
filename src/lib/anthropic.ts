import Anthropic from "@anthropic-ai/sdk";

// The API key lives only in Vercel's Environment Variables (ANTHROPIC_API_KEY).
// It is read on the server and never sent to the browser.

export const MODELS = {
  smart: "claude-sonnet-5-5", // research and reasoning
  fast: "claude-haiku-5-5", // quick, cheap checks
} as const;

let client: Anthropic | null = null;

export function getClient(): Anthropic {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new MissingKeyError();
  }
  if (!client) client = new Anthropic();
  return client;
}

export class MissingKeyError extends Error {
  constructor() {
    super("ANTHROPIC_API_KEY is not set");
  }
}
