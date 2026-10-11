import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it, mock } from "node:test";
import { postToMastodon } from "../services/mastodon.ts";
import { setEnv } from "./fixtures.ts";

describe("postToMastodon", () => {
  let restoreEnv = () => {};

  beforeEach(() => {
    restoreEnv = setEnv({ MASTODON_INSTANCE: "mastodon.example", MASTODON_TOKEN: "geheim" });
  });
  afterEach(() => {
    restoreEnv();
    mock.restoreAll();
  });

  it("sendet den Status per POST an die Instanz", async () => {
    const fetchMock = mock.method(globalThis, "fetch", async () => new Response("{}"));
    await postToMastodon("Hallo\nWelt");

    assert.equal(fetchMock.mock.callCount(), 1);
    const [url, init] = fetchMock.mock.calls[0].arguments;
    assert.equal(url, "https://mastodon.example/api/v1/statuses");
    assert.equal(init?.method, "POST");
    assert.deepEqual(init?.headers, {
      Authorization: "Bearer geheim",
      "Content-Type": "application/json",
    });
    assert.deepEqual(JSON.parse(init?.body as string), { status: "Hallo\nWelt", language: "de" });
  });

  it("protokolliert HTTP-Fehler, ohne zu werfen", async () => {
    mock.method(
      globalThis,
      "fetch",
      async () => new Response("", { status: 422, statusText: "Unprocessable Entity" }),
    );
    const errorMock = mock.method(console, "error", () => {});

    await postToMastodon("Text");

    assert.equal(errorMock.mock.callCount(), 1);
    assert.match(String(errorMock.mock.calls[0].arguments[0]), /422 - Unprocessable Entity/);
  });

  it("wirft ohne Konfiguration, bevor ein Request abgesetzt wird", async () => {
    restoreEnv();
    restoreEnv = setEnv({ MASTODON_INSTANCE: undefined, MASTODON_TOKEN: undefined });
    const fetchMock = mock.method(globalThis, "fetch", async () => new Response("{}"));

    await assert.rejects(postToMastodon("Text"), /MASTODON_INSTANCE/);
    assert.equal(fetchMock.mock.callCount(), 0);
  });
});
