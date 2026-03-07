import OpenAI from "openai";
import { getEnvVar } from "../util/env.ts";
import type { HaikuFeed } from "../types.ts";
import { validateHaikuFeed } from "../util/validateHaikuFeed.ts";

const OPENAI_MODEL = "gpt-4o";

export async function generateResponse(prompt: string): Promise<HaikuFeed> {
  const __dirname = new URL(".", import.meta.url).pathname;
  const instruction = await Deno.readTextFile(
    `${__dirname}/../util/instruction.md`,
  );

  const openai = new OpenAI({
    apiKey: getEnvVar("OPENAI_API_KEY"),
  });

  const response = await openai.responses.create({
    model: OPENAI_MODEL,
    instructions: instruction,
    input: prompt,
    temperature: 1.0,
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

    return validationResult.data as HaikuFeed;
  } catch (err: unknown) {
    throw new Error("Failed to parse JSON.", {
      cause: err instanceof Error ? err.message : String(err),
    });
  }
}
