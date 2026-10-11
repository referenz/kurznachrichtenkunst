import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it, mock } from "node:test";
import { createHaikuFeed, setEnv } from "./fixtures.ts";

const sleep = mock.fn(async (_ms: number) => {});
mock.module("node:timers/promises", { exports: { setTimeout: sleep } });

const { createTiles } = await import("../services/tile.ts");

describe("createTiles", () => {
  let restoreEnv = () => {};

  beforeEach(() => {
    restoreEnv = setEnv({ KNK_CANVAS_API_KEY: "tile-key" });
    sleep.mock.resetCalls();
  });
  afterEach(() => {
    restoreEnv();
    mock.restoreAll();
  });

  it("sendet für jedes Haiku den Text mit API-Key und wartet dazwischen", async () => {
    const fetchMock = mock.method(globalThis, "fetch", async () => new Response("{}"));
    await createTiles(createHaikuFeed());

    assert.equal(fetchMock.mock.callCount(), 3);
    const [url, init] = fetchMock.mock.calls[0].arguments;
    assert.equal(url, "https://referenz.io/haiku");
    assert.equal(init?.method, "POST");
    assert.deepEqual(init?.headers, {
      "Content-Type": "application/json",
      "x-api-key": "tile-key",
    });
    assert.deepEqual(JSON.parse(init?.body as string), {
      text: "Zeile eins A\nZeile zwei A\nZeile drei A",
    });

    assert.equal(sleep.mock.callCount(), 3);
    assert.deepEqual(sleep.mock.calls[0].arguments, [1500]);
  });

  it("wirft ohne API-Key", async () => {
    restoreEnv();
    restoreEnv = setEnv({ KNK_CANVAS_API_KEY: undefined });
    const fetchMock = mock.method(globalThis, "fetch", async () => new Response("{}"));

    await assert.rejects(createTiles(createHaikuFeed()), /KNK_CANVAS_API_KEY/);
    assert.equal(fetchMock.mock.callCount(), 0);
  });
});
