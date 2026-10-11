import type { HaikuFeed } from "../types.ts";
import { getOptionalEnvVar } from "../util/env.ts";
import { generateResponse as generateChatGPTResponse } from "./chatGPT.ts";
import { generateResponse as generateClaudeResponse } from "./claude.ts";
import { generateResponse as generateGeminiResponse } from "./gemini.ts";

const AI_PROVIDERS = ["claude", "gemini", "chatgpt"] as const;
type AiProvider = (typeof AI_PROVIDERS)[number];

function getAiProvider(): AiProvider {
  const provider = getOptionalEnvVar("AI_PROVIDER")?.trim().toLowerCase();
  if (!provider) return "claude";

  if ((AI_PROVIDERS as readonly string[]).includes(provider)) {
    return provider as AiProvider;
  }
  throw new Error(`Ungültiger AI_PROVIDER '${provider}'. Erlaubt: ${AI_PROVIDERS.join(", ")}.`);
}

const generators: Record<AiProvider, (prompt: string) => Promise<HaikuFeed>> = {
  claude: generateClaudeResponse,
  gemini: generateGeminiResponse,
  chatgpt: generateChatGPTResponse,
};

export async function generateResponse(prompt: string): Promise<HaikuFeed> {
  return generators[getAiProvider()](prompt);
}
