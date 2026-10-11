import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { validateHaikuFeed } from "../util/validateHaikuFeed.ts";
import { createHaikuFeed } from "./fixtures.ts";

function assertInvalid(data: unknown, expectedPath: string) {
  const result = validateHaikuFeed(data);
  assert.equal(result.success, false);
  if (result.success) return;
  assert.ok(
    result.errors.some((e) => e.startsWith(`Error at "${expectedPath}"`)),
    `Erwarteter Fehler bei "${expectedPath}", erhalten: ${result.errors.join(", ")}`,
  );
}

describe("validateHaikuFeed", () => {
  it("akzeptiert einen gültigen Feed und gibt die Daten zurück", () => {
    const feed = createHaikuFeed();
    const result = validateHaikuFeed(feed);
    assert.deepEqual(result, { success: true, data: feed });
  });

  it("entfernt unbekannte Felder", () => {
    const feed = { ...createHaikuFeed(), extra: "egal" };
    const result = validateHaikuFeed(feed);
    assert.equal(result.success, true);
    if (result.success) assert.equal("extra" in result.data, false);
  });

  for (const value of [null, undefined, "text", 42, []]) {
    it(`lehnt Nicht-Objekt ${JSON.stringify(value)} ab`, () => {
      assert.equal(validateHaikuFeed(value).success, false);
    });
  }

  it("verlangt ein Datum als String", () => {
    const feed = { ...createHaikuFeed(), date: 20241122 };
    assertInvalid(feed, "date");
  });

  it("lehnt weniger als drei Haikus ab", () => {
    const feed = createHaikuFeed();
    assertInvalid({ ...feed, haikus: feed.haikus.slice(0, 2) }, "haikus");
  });

  it("lehnt mehr als drei Haikus ab", () => {
    const feed = createHaikuFeed();
    assertInvalid({ ...feed, haikus: [...feed.haikus, feed.haikus[0]] }, "haikus");
  });

  it("verlangt alle drei Zeilen", () => {
    const feed = createHaikuFeed();
    const { line3: _, ...twoLines } = feed.haikus[1].haiku;
    const haikus = [feed.haikus[0], { ...feed.haikus[1], haiku: twoLines }, feed.haikus[2]];
    assertInvalid({ ...feed, haikus }, "haikus.1.haiku.line3");
  });

  it("verlangt genau drei Hashtags", () => {
    const feed = createHaikuFeed();
    const haikus = [{ ...feed.haikus[0], hashtags: ["#a", "#b"] }, feed.haikus[1], feed.haikus[2]];
    assertInvalid({ ...feed, haikus }, "haikus.0.hashtags");
  });

  it("verlangt, dass Hashtags mit # beginnen", () => {
    const feed = createHaikuFeed();
    const haikus = [
      feed.haikus[0],
      feed.haikus[1],
      { ...feed.haikus[2], hashtags: ["#a", "b", "#c"] },
    ];
    assertInvalid({ ...feed, haikus }, "haikus.2.hashtags.1");
  });

  it("meldet mehrere Fehler gleichzeitig", () => {
    const result = validateHaikuFeed({ date: 1, haikus: "keine" });
    assert.equal(result.success, false);
    if (!result.success) assert.equal(result.errors.length, 2);
  });
});
