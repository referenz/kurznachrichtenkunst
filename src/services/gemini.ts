import { GoogleGenerativeAI } from "@google/generative-ai";
import { getEnvVar } from "../util/env.ts";
import type { HaikuFeed } from "../types.ts";
import { validateHaikuFeed } from "../util/validateHaikuFeed.ts";

export async function generateResponse(prompt: string): Promise<HaikuFeed> {
  const genAI = new GoogleGenerativeAI(getEnvVar("GEMINI_API"));
  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
    systemInstruction: await Deno.readTextFile('../util/instruction.md'),
  });

  const result = await model.generateContent(prompt);
  if (!result || !result.response || result.response.text().trim() === "") {
    throw new Error("No response from AI model");
  }

  let resultText = result.response.text();
  resultText = resultText
    .trim() // Entfernt zusätzliche Leerzeichen
    .replace(/^```json/, "") // Entfernt den Start-Tag
    .replace(/```$/, ""); // Entfernt den End-Tag

  let parsedResponse: HaikuFeed;
  try {
    const jsonData = JSON.parse(resultText);
    const validationResult = validateHaikuFeed(jsonData);
    if (!validationResult.success) {
      throw new Error("Erzeugter Feed ist nicht valide.");
    }
    parsedResponse = validationResult.data as HaikuFeed;
    // deno-lint-ignore no-explicit-any
  } catch (err: any) {
    throw new Error("Failed to parse JSON." , { cause: err?.message });
  }
  return parsedResponse;
}
