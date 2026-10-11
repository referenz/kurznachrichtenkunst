import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { afterEach, beforeEach, describe, it, mock } from "node:test";
import { createHaikuFeed, setEnv } from "./fixtures.ts";

const create = mock.fn(
  async (_params: Record<string, unknown>): Promise<{ output_text?: string }> => ({}),
);
const clientOptions: unknown[] = [];

class FakeOpenAI {
  responses = { create };
  constructor(options: unknown) {
    clientOptions.push(options);
  }
}

mock.module("openai", { exports: { default: FakeOpenAI } });

const { generateResponse } = await import("../services/chatGPT.ts");

function respondWith(output_text: string | undefined) {
  create.mock.mockImplementation(async () => ({ output_text }));
}

describe("chatGPT.generateResponse", () => {
  let restoreEnv = () => {};

  beforeEach(() => {
    restoreEnv = setEnv({ OPENAI_API_KEY: "sk-test" });
    create.mock.resetCalls();
    clientOptions.length = 0;
  });
  afterEach(() => restoreEnv());

  it("schickt Prompt und Instruktion an die Responses-API", async () => {
    respondWith(JSON.stringify(createHaikuFeed()));
    await generateResponse("Schlagzeile");

    const instruction = await readFile(new URL("../util/instruction.md", import.meta.url), "utf-8");
    assert.deepEqual(clientOptions, [{ apiKey: "sk-test" }]);
    const params = create.mock.calls[0].arguments[0];
    assert.equal(params.instructions, instruction);
    assert.equal(params.input, "Schlagzeile");
  });

  it("gibt den validierten Feed zurück", async () => {
    respondWith(JSON.stringify(createHaikuFeed()));
    assert.deepEqual(await generateResponse("News"), createHaikuFeed());
  });

  it("entfernt Markdown-Codeblöcke um das JSON", async () => {
    respondWith("```json\n" + JSON.stringify(createHaikuFeed()) + "\n```\n");
    assert.deepEqual(await generateResponse("News"), createHaikuFeed());
  });

  for (const empty of [undefined, "", "  \n "]) {
    it(`wirft bei leerer Antwort (${JSON.stringify(empty)})`, async () => {
      respondWith(empty);
      await assert.rejects(generateResponse("News"), { message: "No response from OpenAI model" });
    });
  }

  it("wirft bei ungültigem JSON", async () => {
    respondWith("{ kaputt");
    await assert.rejects(generateResponse("News"), { message: "Failed to parse JSON." });
  });

  it("wirft, wenn das JSON nicht dem Schema entspricht", async () => {
    respondWith(JSON.stringify({ date: "2024-11-22", haikus: [] }));
    await assert.rejects(generateResponse("News"), {
      message: "Failed to parse JSON.",
      cause: "Erzeugter Feed ist nicht valide.",
    });
  });

  it("wirft ohne API-Key, bevor die API aufgerufen wird", async () => {
    restoreEnv();
    restoreEnv = setEnv({ OPENAI_API_KEY: undefined });
    await assert.rejects(generateResponse("News"), /OPENAI_API_KEY/);
    assert.equal(create.mock.callCount(), 0);
  });
});
