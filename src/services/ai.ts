import type { HaikuFeed } from "../types.ts";
import { generateResponse as generateClaudeResponse } from "./claude.ts";
import { generateResponse as generateGeminiResponse } from "./gemini.ts";
import { generateResponse as generateChatGPTResponse } from "./chatGPT.ts";

type AiProvider = "claude" | "gemini" | "chatgpt";

function getAiProvider(): AiProvider {
  const provider = (Deno.env.get("AI_PROVIDER") || "claude").toLowerCase();
  if (provider === "claude" || provider === "gemini" || provider === "chatgpt") {
    return provider;
  }

  throw new Error(
    `Ungültiger AI_PROVIDER '${provider}'. Erlaubt: claude, gemini, chatgpt.`,
  );
}

export async function generateResponse(prompt: string): Promise<HaikuFeed> {
  const provider = getAiProvider();

  switch (provider) {
    case "claude":
      return await generateClaudeResponse(prompt);
    case "gemini":
      return await generateGeminiResponse(prompt);
    case "chatgpt":
      return await generateChatGPTResponse(prompt);
  }
}
