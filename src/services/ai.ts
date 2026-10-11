import type { HaikuFeed } from "../types.ts";
import { getOptionalEnvVar } from "../util/env.ts";

function loadProvider(provider: string) {
  switch (provider) {
    case "claude":
      return import("./claude.ts");
    case "gemini":
      return import("./gemini.ts");
    case "chatgpt":
      return import("./chatGPT.ts");
    default:
      throw new Error(`Ungültiger AI_PROVIDER '${provider}'. Erlaubt: claude, gemini, chatgpt.`);
  }
}

export async function generateResponse(prompt: string): Promise<HaikuFeed> {
  const provider = getOptionalEnvVar("AI_PROVIDER")?.trim().toLowerCase() || "claude";
  const module = await loadProvider(provider);
  return module.generateResponse(prompt);
}
