import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it, mock } from "node:test";
import type { HaikuFeed } from "../types.ts";
import { createHaikuFeed, setEnv } from "./fixtures.ts";

function providerMock(name: string) {
  const fn = mock.fn(async (_prompt: string): Promise<HaikuFeed> => ({
    ...createHaikuFeed(),
    date: name,
  }));
  mock.module(new URL(`../services/${name}.ts`, import.meta.url).href, {
    exports: { generateResponse: fn },
  });
  return fn;
}

const claude = providerMock("claude");
const gemini = providerMock("gemini");
const chatGPT = providerMock("chatGPT");

const { generateResponse } = await import("../services/ai.ts");

describe("ai.generateResponse", () => {
  let restoreEnv = () => {};

  beforeEach(() => {
    for (const fn of [claude, gemini, chatGPT]) fn.mock.resetCalls();
  });
  afterEach(() => restoreEnv());

  it("verwendet standardmäßig Claude", async () => {
    restoreEnv = setEnv({ AI_PROVIDER: undefined });
    const result = await generateResponse("News");

    assert.equal(result.date, "claude");
    assert.deepEqual(claude.mock.calls[0].arguments, ["News"]);
    assert.equal(gemini.mock.callCount() + chatGPT.mock.callCount(), 0);
  });

  it("behandelt einen leeren AI_PROVIDER wie den Standard", async () => {
    restoreEnv = setEnv({ AI_PROVIDER: "" });
    assert.equal((await generateResponse("News")).date, "claude");
  });

  const cases = [
    ["claude", claude, "claude"],
    ["gemini", gemini, "gemini"],
    ["chatgpt", chatGPT, "chatGPT"],
    ["ChatGPT", chatGPT, "chatGPT"],
    ["GEMINI", gemini, "gemini"],
  ] as const;

  for (const [provider, fn, expected] of cases) {
    it(`leitet AI_PROVIDER=${provider} an ${expected} weiter`, async () => {
      restoreEnv = setEnv({ AI_PROVIDER: provider });
      const result = await generateResponse("Prompt");

      assert.equal(result.date, expected);
      assert.equal(fn.mock.callCount(), 1);
      assert.equal(claude.mock.callCount() + gemini.mock.callCount() + chatGPT.mock.callCount(), 1);
    });
  }

  it("wirft bei unbekanntem Provider", async () => {
    restoreEnv = setEnv({ AI_PROVIDER: "Llama" });
    await assert.rejects(generateResponse("News"), {
      message: "Ungültiger AI_PROVIDER 'llama'. Erlaubt: claude, gemini, chatgpt.",
    });
    assert.equal(claude.mock.callCount() + gemini.mock.callCount() + chatGPT.mock.callCount(), 0);
  });

  it("reicht Fehler des Providers durch", async () => {
    restoreEnv = setEnv({ AI_PROVIDER: "gemini" });
    gemini.mock.mockImplementationOnce(async () => {
      throw new Error("Quota exceeded");
    });
    await assert.rejects(generateResponse("News"), /Quota exceeded/);
  });
});
