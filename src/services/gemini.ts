import { GoogleGenerativeAI } from "@google/generative-ai";
import { getEnvVar } from "../util/env.ts";
import type { HaikuFeed } from "../types.ts";
import { validateHaikuFeed } from "../util/validateHaikuFeed.ts";

export async function generateResponse(prompt: string): Promise<HaikuFeed> {
  const __dirname = new URL(".", import.meta.url).pathname;
  const instruction = await Deno.readTextFile(`${__dirname}/../util/instruction.md`);

  const genAI = new GoogleGenerativeAI(getEnvVar("GEMINI_API"));
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-pro-exp-03-25",
    systemInstruction: instruction,
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

  try {
    const jsonData = JSON.parse(resultText);

    const validationResult = validateHaikuFeed(jsonData);
    if (!validationResult.success) throw new Error("Erzeugter Feed ist nicht valide.");

    return validationResult.data as HaikuFeed;;
  } catch (err: unknown) {
    throw new Error("Failed to parse JSON.", {
        cause: err instanceof Error ? err.message : String(err),
    });
}
}
