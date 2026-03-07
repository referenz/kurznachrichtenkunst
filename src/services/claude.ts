import Anthropic from "@anthropic-ai/sdk";
import type { HaikuFeed } from "../types.ts";
import { getEnvVar } from "../util/env.ts";
import { validateHaikuFeed } from "../util/validateHaikuFeed.ts";

const CLAUDE_MODEL = "claude-sonnet-4-6";

export async function generateResponse(prompt: string): Promise<HaikuFeed> {
  const __dirname = new URL(".", import.meta.url).pathname;
  const instruction = await Deno.readTextFile(
    `${__dirname}/../util/instruction.md`,
  );

  const anthropic = new Anthropic({
    apiKey: getEnvVar("ANTHROPIC_API_KEY"),
  });

  const response = await anthropic.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 2000,
    system: instruction,
    messages: [{ role: "user", content: prompt }],
  });

  const textBlocks = response.content.filter((block) => block.type === "text");
  const resultTextRaw = textBlocks
    .map((block) => block.text)
    .join("\n")
    .trim();

  if (!resultTextRaw) {
    throw new Error("No response from Claude model");
  }

  const resultText = resultTextRaw
    .replace(/^```json/, "")
    .replace(/```$/, "")
    .trim();

  try {
    const jsonData = JSON.parse(resultText);

    const validationResult = validateHaikuFeed(jsonData);
    if (!validationResult.success) {
      throw new Error("Erzeugter Feed ist nicht valide.");
    }

    return validationResult.data as HaikuFeed;
  } catch (err: unknown) {
    throw new Error("Failed to parse JSON.", {
      cause: err instanceof Error ? err.message : String(err),
    });
  }
}
