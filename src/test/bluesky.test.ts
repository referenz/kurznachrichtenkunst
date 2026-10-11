import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it, mock } from "node:test";
import { setEnv } from "./fixtures.ts";

const login = mock.fn(async (_credentials: { identifier: string; password: string }) => {});
const post = mock.fn(async (_record: Record<string, unknown>) => {});
const agentOptions: unknown[] = [];

class FakeAtpAgent {
  login = login;
  post = post;
  constructor(options: unknown) {
    agentOptions.push(options);
  }
}

const facets = [{ index: { byteStart: 0, byteEnd: 6 }, features: [] }];
const detectFacets = mock.fn(async (_agent: unknown) => {});

class FakeRichText {
  text: string;
  facets: unknown;
  constructor({ text }: { text: string }) {
    this.text = text;
  }
  async detectFacets(agent: unknown) {
    await detectFacets(agent);
    this.facets = facets;
  }
}

mock.module("@atproto/api", { exports: { AtpAgent: FakeAtpAgent, RichText: FakeRichText } });

const { postToBluesky } = await import("../services/bluesky.ts");

describe("postToBluesky", () => {
  let restoreEnv = () => {};

  beforeEach(() => {
    restoreEnv = setEnv({ BLUESKY_IDENTIFIER: "knk.bsky.social", BLUESKY_PASSWORD: "app-pw" });
    login.mock.resetCalls();
    post.mock.resetCalls();
    detectFacets.mock.resetCalls();
    agentOptions.length = 0;
  });
  afterEach(() => {
    restoreEnv();
    mock.timers.reset();
  });

  it("meldet sich an und postet den Text mit erkannten Facets", async () => {
    mock.timers.enable({ apis: ["Date"], now: new Date("2024-11-22T12:00:00Z") });
    await postToBluesky("#Haiku Text");

    assert.deepEqual(agentOptions, [{ service: "https://bsky.social" }]);
    assert.deepEqual(login.mock.calls[0].arguments, [
      { identifier: "knk.bsky.social", password: "app-pw" },
    ]);
    assert.equal(detectFacets.mock.callCount(), 1);
    assert.ok(detectFacets.mock.calls[0].arguments[0] instanceof FakeAtpAgent);
    assert.deepEqual(post.mock.calls[0].arguments, [
      { text: "#Haiku Text", facets, createdAt: "2024-11-22T12:00:00.000Z" },
    ]);
  });

  it("postet nicht, wenn der Login fehlschlägt", async () => {
    login.mock.mockImplementationOnce(async () => {
      throw new Error("Invalid identifier or password");
    });

    await assert.rejects(postToBluesky("Text"), /Invalid identifier/);
    assert.equal(post.mock.callCount(), 0);
  });

  it("wirft ohne Zugangsdaten", async () => {
    restoreEnv();
    restoreEnv = setEnv({ BLUESKY_IDENTIFIER: undefined, BLUESKY_PASSWORD: undefined });

    await assert.rejects(postToBluesky("Text"), /BLUESKY_IDENTIFIER/);
    assert.equal(login.mock.callCount(), 0);
  });
});
