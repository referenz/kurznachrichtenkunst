import { readFile } from "node:fs/promises";
import { GoogleGenAI } from "@google/genai";
import type { HaikuFeed } from "../types.ts";
import { getEnvVar } from "../util/env.ts";
import { validateHaikuFeed } from "../util/validateHaikuFeed.ts";

const GEMINI_MODEL = "gemini-3.8-flash";

export async function generateResponse(prompt: string): Promise<HaikuFeed> {
  const instruction = await readFile(new URL("../util/instruction.md", import.meta.url), "utf-8");

  const ai = new GoogleGenAI({ apiKey: getEnvVar("GEMINI_API") });
  const response = await ai.models.generateContent({
    model: GEMINI_MODEL,
    contents: prompt,
    config: {
      systemInstruction: instruction,
      responseMimeType: "application/json",
    },
  });

  const resultText = response.text?.trim();
  if (!resultText) {
    throw new Error("No response from AI model");
  }

  let jsonData: unknown;
  try {
    jsonData = JSON.parse(resultText);
  } catch (err: unknown) {
    throw new Error("Failed to parse JSON.", { cause: err });
  }

  const validationResult = validateHaikuFeed(jsonData);
  if (!validationResult.success) {
    throw new Error("Erzeugter Feed ist nicht valide.");
  }
  return validationResult.data as HaikuFeed;
}
