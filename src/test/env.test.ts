import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import { getEnvVar } from "../util/env.ts";
import { setEnv } from "./fixtures.ts";

describe("getEnvVar", () => {
  let restore = () => {};
  afterEach(() => restore());

  it("liefert den Wert einer gesetzten Variable", () => {
    restore = setEnv({ KNK_TEST_VAR: "wert" });
    assert.equal(getEnvVar("KNK_TEST_VAR"), "wert");
  });

  it("wirft, wenn die Variable fehlt", () => {
    restore = setEnv({ KNK_TEST_VAR: undefined });
    assert.throws(() => getEnvVar("KNK_TEST_VAR"), {
      message: "Die Umgebungsvariable 'KNK_TEST_VAR' ist nicht gesetzt.",
    });
  });

  it("wirft, wenn die Variable leer ist", () => {
    restore = setEnv({ KNK_TEST_VAR: "" });
    assert.throws(() => getEnvVar("KNK_TEST_VAR"), /KNK_TEST_VAR/);
  });
});
