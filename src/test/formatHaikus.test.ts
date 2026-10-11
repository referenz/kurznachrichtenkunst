import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it, mock } from "node:test";
import { getFormattedHaikus } from "../services/formatHaikus.ts";
import { createHaikuFeed } from "./fixtures.ts";

describe("getFormattedHaikus", () => {
  beforeEach(() => mock.timers.enable({ apis: ["Date"], now: new Date(2024, 10, 22, 12) }));
  afterEach(() => mock.timers.reset());

  it("liefert einen Post pro Haiku in der ursprünglichen Reihenfolge", () => {
    const posts = getFormattedHaikus(createHaikuFeed());
    assert.equal(posts.length, 3);
    assert.ok(posts[0].startsWith("Zeile eins A"));
    assert.ok(posts[1].startsWith("Zeile eins B"));
    assert.ok(posts[2].startsWith("Zeile eins C"));
  });

  it("formatiert Zeilen, Hashtags und Datum", () => {
    const [first] = getFormattedHaikus(createHaikuFeed());
    assert.equal(
      first,
      "Zeile eins A\nZeile zwei A\nZeile drei A\n\n\n🏷️ #Politik #Berlin #News\n📰 22. November 2024",
    );
  });

  it("verwendet das aktuelle Datum, nicht das Datum aus dem Feed", () => {
    const feed = { ...createHaikuFeed(), date: "1999-01-01" };
    for (const post of getFormattedHaikus(feed)) {
      assert.ok(post.endsWith("📰 22. November 2024"));
    }
  });

  it("hält die Posts unter dem Bluesky-Limit von 300 Zeichen", () => {
    for (const post of getFormattedHaikus(createHaikuFeed())) {
      assert.ok(post.length <= 300);
    }
  });
});
