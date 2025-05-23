//ungetestet, wurde von Copilot generiert
import { getEnvVar } from "../util/env.ts";
import type { HaikuFeed } from "../types.ts";
import { validateHaikuFeed } from "../util/validateHaikuFeed.ts";

const OPENAI_API_URL = "https://api.openai.com/v1/responses";
const OPENAI_MODEL = "gpt-4o";

export async function generateResponse(prompt: string): Promise<HaikuFeed> {
  const instructionUrl = new URL("../util/instruction.md", import.meta.url);
  const systemInstruction = await Deno.readTextFile(instructionUrl);

  const apiKey = getEnvVar("OPENAI_API_KEY");

const body = {
    model: OPENAI_MODEL,
    instructions: systemInstruction,
    input: prompt,
    temperature: 1.0,
};

  const response = await fetch(OPENAI_API_URL, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  //const message = data.choices?.[0]?.message?.content?.trim();
  const message = data.output?.[0]?.content?.[0]?.text?.trim();
  if (!message) {
    throw new Error("No response from OpenAI model");
  }

  const resultText = message
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
