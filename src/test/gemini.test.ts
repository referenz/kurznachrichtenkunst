import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { afterEach, beforeEach, describe, it, mock } from "node:test";
import { createHaikuFeed, setEnv } from "./fixtures.ts";

const generateContent = mock.fn(
  async (_params: Record<string, unknown>): Promise<{ text?: string }> => ({}),
);
const clientOptions: unknown[] = [];

class FakeGoogleGenAI {
  models = { generateContent };
  constructor(options: unknown) {
    clientOptions.push(options);
  }
}

mock.module("@google/genai", { exports: { GoogleGenAI: FakeGoogleGenAI } });

const { generateResponse } = await import("../services/gemini.ts");

function respondWith(text: string | undefined) {
  generateContent.mock.mockImplementation(async () => ({ text }));
}

describe("gemini.generateResponse", () => {
  let restoreEnv = () => {};

  beforeEach(() => {
    restoreEnv = setEnv({ GEMINI_API: "gemini-key" });
    generateContent.mock.resetCalls();
    clientOptions.length = 0;
  });
  afterEach(() => restoreEnv());

  it("fordert JSON mit der Instruktion als System-Prompt an", async () => {
    respondWith(JSON.stringify(createHaikuFeed()));
    await generateResponse("Schlagzeile");

    const instruction = await readFile(new URL("../util/instruction.md", import.meta.url), "utf-8");
    assert.deepEqual(clientOptions, [{ apiKey: "gemini-key" }]);
    const params = generateContent.mock.calls[0].arguments[0];
    assert.equal(params.contents, "Schlagzeile");
    assert.deepEqual(params.config, {
      systemInstruction: instruction,
      responseMimeType: "application/json",
    });
  });

  it("gibt den validierten Feed zurück", async () => {
    respondWith(`  ${JSON.stringify(createHaikuFeed())}\n`);
    assert.deepEqual(await generateResponse("News"), createHaikuFeed());
  });

  it("wirft bei leerer Antwort", async () => {
    respondWith(undefined);
    await assert.rejects(generateResponse("News"), { message: "No response from AI model" });
  });

  it("wirft bei ungültigem JSON und hängt den Parserfehler an", async () => {
    respondWith("{ kaputt");
    await assert.rejects(generateResponse("News"), (err: Error) => {
      assert.equal(err.message, "Failed to parse JSON.");
      assert.ok(err.cause instanceof SyntaxError);
      return true;
    });
  });

  it("wirft, wenn das JSON nicht dem Schema entspricht", async () => {
    const feed = createHaikuFeed();
    const haikus = [
      { ...feed.haikus[0], hashtags: ["ohneRaute", "#b", "#c"] },
      feed.haikus[1],
      feed.haikus[2],
    ];
    respondWith(JSON.stringify({ ...feed, haikus }));
    await assert.rejects(generateResponse("News"), { message: "Erzeugter Feed ist nicht valide." });
  });

  it("wirft ohne API-Key, bevor die API aufgerufen wird", async () => {
    restoreEnv();
    restoreEnv = setEnv({ GEMINI_API: undefined });
    await assert.rejects(generateResponse("News"), /GEMINI_API/);
    assert.equal(generateContent.mock.callCount(), 0);
  });
});
