import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { afterEach, beforeEach, describe, it, mock } from "node:test";
import { createHaikuFeed, setEnv } from "./fixtures.ts";

interface FakeMessage {
  stop_reason: string;
  usage: { output_tokens: number };
  content: Array<{ type: string; text?: string; thinking?: string }>;
}

const create = mock.fn(async (_params: Record<string, unknown>): Promise<FakeMessage> => reply(""));
const clientOptions: unknown[] = [];

class FakeAnthropic {
  messages = { create };
  constructor(options: unknown) {
    clientOptions.push(options);
  }
}

mock.module("@anthropic-ai/sdk", { exports: { default: FakeAnthropic } });

const { generateResponse } = await import("../services/claude.ts");

function reply(text: string, stop_reason = "end_turn"): FakeMessage {
  return {
    stop_reason,
    usage: { output_tokens: 123 },
    content: [
      { type: "thinking", thinking: "Ich überlege…" },
      { type: "text", text },
    ],
  };
}

function respondWith(message: FakeMessage) {
  create.mock.mockImplementation(async () => message);
}

describe("claude.generateResponse", () => {
  let restoreEnv = () => {};

  beforeEach(() => {
    restoreEnv = setEnv({ ANTHROPIC_API_KEY: "sk-ant-test" });
    create.mock.resetCalls();
    clientOptions.length = 0;
  });
  afterEach(() => restoreEnv());

  it("schickt die Nachrichten mit der Instruktion als System-Prompt", async () => {
    respondWith(reply(JSON.stringify(createHaikuFeed())));
    await generateResponse("Schlagzeile 1\nSchlagzeile 2");

    const instruction = await readFile(new URL("../util/instruction.md", import.meta.url), "utf-8");
    assert.deepEqual(clientOptions, [{ apiKey: "sk-ant-test" }]);
    const params = create.mock.calls[0].arguments[0];
    assert.equal(params.system, instruction);
    assert.deepEqual(params.messages, [{ role: "user", content: "Schlagzeile 1\nSchlagzeile 2" }]);
    assert.match(String(params.model), /^claude-/);
  });

  it("gibt den validierten Feed zurück und ignoriert Thinking-Blöcke", async () => {
    respondWith(reply(JSON.stringify(createHaikuFeed())));
    assert.deepEqual(await generateResponse("News"), createHaikuFeed());
  });

  it("entfernt Markdown-Codeblöcke um das JSON", async () => {
    respondWith(reply("```json\n" + JSON.stringify(createHaikuFeed(), null, 2) + "\n```"));
    assert.deepEqual(await generateResponse("News"), createHaikuFeed());
  });

  it("wirft, wenn die Antwort bei max_tokens abgeschnitten wurde", async () => {
    respondWith(reply('{"date": "2024', "max_tokens"));
    await assert.rejects(
      generateResponse("News"),
      /max_tokens abgeschnitten \(123 Output-Tokens\)/,
    );
  });

  it("wirft bei leerer Antwort", async () => {
    respondWith(reply("   "));
    await assert.rejects(generateResponse("News"), { message: "No response from Claude model" });
  });

  it("wirft bei ungültigem JSON", async () => {
    respondWith(reply("Hier sind deine Haikus!"));
    await assert.rejects(generateResponse("News"), (err: Error) => {
      assert.equal(err.message, "Failed to parse JSON.");
      assert.match(String(err.cause), /JSON/);
      return true;
    });
  });

  it("wirft, wenn das JSON nicht dem Schema entspricht", async () => {
    const feed = createHaikuFeed();
    respondWith(reply(JSON.stringify({ ...feed, haikus: feed.haikus.slice(0, 2) })));
    await assert.rejects(generateResponse("News"), {
      message: "Failed to parse JSON.",
      cause: "Erzeugter Feed ist nicht valide.",
    });
  });

  it("reicht API-Fehler durch", async () => {
    create.mock.mockImplementation(async () => {
      throw new Error("overloaded_error");
    });
    await assert.rejects(generateResponse("News"), /overloaded_error/);
  });

  it("wirft ohne API-Key, bevor die API aufgerufen wird", async () => {
    restoreEnv();
    restoreEnv = setEnv({ ANTHROPIC_API_KEY: undefined });
    await assert.rejects(generateResponse("News"), /ANTHROPIC_API_KEY/);
    assert.equal(create.mock.callCount(), 0);
  });
});
