import { readFile } from "node:fs/promises";
import OpenAI from "openai";
import type { HaikuFeed } from "../types.ts";
import { getEnvVar } from "../util/env.ts";
import { validateHaikuFeed } from "../util/validateHaikuFeed.ts";

const OPENAI_MODEL = "gpt-6.1-sol";

export async function generateResponse(prompt: string): Promise<HaikuFeed> {
  const instruction = await readFile(new URL("../util/instruction.md", import.meta.url), "utf-8");

  const openai = new OpenAI({
    apiKey: getEnvVar("OPENAI_API_KEY"),
  });

  const response = await openai.responses.create({
    model: OPENAI_MODEL,
    instructions: instruction,
    input: prompt,
    reasoning: { effort: "low" },
  });

  const resultTextRaw = response.output_text?.trim() || "";
  if (!resultTextRaw) {
    throw new Error("No response from OpenAI model");
  }

  const resultText = resultTextRaw
    .replace(/^```json/, "")
    .replace(/```$/, "")
    .trim();

  try {
    const jsonData = JSON.parse(resultText);

    const validationResult = validateHaikuFeed(jsonData);
    if (!validationResult.success) throw new Error("Erzeugter Feed ist nicht valide.");

    return validationResult.data;
  } catch (err: unknown) {
    throw new Error("Failed to parse JSON.", {
      cause: err instanceof Error ? err.message : String(err),
    });
  }
}
