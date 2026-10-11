import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it, mock } from "node:test";
import type { HaikuFeed } from "../types.ts";
import { createHaikuFeed } from "./fixtures.ts";

function moduleUrl(path: string) {
  return new URL(path, import.meta.url).href;
}

const getNews = mock.fn(async (): Promise<string[]> => []);
const generateResponse = mock.fn(async (_prompt: string): Promise<HaikuFeed> => createHaikuFeed());
const postToMastodon = mock.fn(async (_message: string) => {});
const postToBluesky = mock.fn(async (_message: string) => {});
const sleep = mock.fn(async (_ms: number) => {});

mock.module(moduleUrl("../services/feeds.ts"), { exports: { getNews } });
mock.module(moduleUrl("../services/ai.ts"), { exports: { generateResponse } });
mock.module(moduleUrl("../services/mastodon.ts"), { exports: { postToMastodon } });
mock.module(moduleUrl("../services/bluesky.ts"), { exports: { postToBluesky } });
mock.module("node:timers/promises", { exports: { setTimeout: sleep } });

// main.ts führt executeMainLogic() beim Import aus. Der erste Lauf findet mit
// leeren Nachrichten statt; danach wird die exportierte Funktion direkt getestet.
mock.method(console, "error", () => {});
const { executeMainLogic } = (await import(moduleUrl("../main.ts"))) as {
  executeMainLogic: () => Promise<void>;
};

describe("executeMainLogic", () => {
  let consoleError: ReturnType<typeof mock.method>;

  beforeEach(() => {
    for (const fn of [getNews, generateResponse, postToMastodon, postToBluesky, sleep]) {
      fn.mock.resetCalls();
      fn.mock.restore();
    }
    consoleError = mock.method(console, "error", () => {});
    mock.method(console, "log", () => {});
    mock.method(console, "debug", () => {});
    mock.timers.enable({ apis: ["Date"], now: new Date(2024, 10, 22, 12) });
  });
  afterEach(() => {
    mock.restoreAll();
    mock.timers.reset();
  });

  it("bricht ab, wenn keine Nachrichten vorhanden sind", async () => {
    getNews.mock.mockImplementation(async () => []);
    await executeMainLogic();

    assert.equal(generateResponse.mock.callCount(), 0);
    assert.equal(postToMastodon.mock.callCount(), 0);
    assert.match(String(consoleError.mock.calls[0].arguments[0]), /Keine Nachrichten/);
  });

  it("übergibt die Nachrichten zeilenweise an die KI", async () => {
    getNews.mock.mockImplementation(async () => ["Meldung 1\nTeaser", "Meldung 2"]);
    await executeMainLogic();

    assert.deepEqual(generateResponse.mock.calls[0].arguments, ["Meldung 1\nTeaser\nMeldung 2"]);
  });

  it("postet jedes Haiku auf Mastodon und Bluesky und wartet dazwischen", async () => {
    getNews.mock.mockImplementation(async () => ["Meldung"]);
    await executeMainLogic();

    assert.equal(postToMastodon.mock.callCount(), 3);
    assert.equal(postToBluesky.mock.callCount(), 3);
    const mastodonPosts = postToMastodon.mock.calls.map((c) => c.arguments[0]);
    const blueskyPosts = postToBluesky.mock.calls.map((c) => c.arguments[0]);
    assert.deepEqual(mastodonPosts, blueskyPosts);
    assert.ok(mastodonPosts[0].startsWith("Zeile eins A\n"));
    assert.ok(mastodonPosts[2].endsWith("📰 22. November 2024"));
    assert.deepEqual(
      sleep.mock.calls.map((c) => c.arguments[0]),
      [3000, 3000, 3000],
    );
  });

  it("postet weiter, wenn eine Plattform fehlschlägt", async () => {
    getNews.mock.mockImplementation(async () => ["Meldung"]);
    postToBluesky.mock.mockImplementation(async () => {
      throw new Error("Bluesky down");
    });
    await executeMainLogic();

    assert.equal(postToMastodon.mock.callCount(), 3);
    assert.equal(postToBluesky.mock.callCount(), 3);
    assert.equal(consoleError.mock.callCount(), 0);
  });

  it("protokolliert KI-Fehler, ohne zu posten oder zu werfen", async () => {
    getNews.mock.mockImplementation(async () => ["Meldung"]);
    const failure = new Error("Failed to parse JSON.");
    generateResponse.mock.mockImplementation(async () => {
      throw failure;
    });

    await executeMainLogic();

    assert.equal(postToMastodon.mock.callCount(), 0);
    assert.equal(postToBluesky.mock.callCount(), 0);
    assert.equal(consoleError.mock.calls[0].arguments[1], failure);
  });
});
