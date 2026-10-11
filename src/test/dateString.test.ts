import assert from "node:assert/strict";
import { afterEach, describe, it, mock } from "node:test";
import { dateString } from "../util/dateString.ts";

describe("dateString", () => {
  afterEach(() => mock.timers.reset());

  it("formatiert das heutige Datum deutsch mit ausgeschriebenem Monat", () => {
    mock.timers.enable({ apis: ["Date"], now: new Date(2024, 10, 22, 12) });
    assert.equal(dateString(), "22. November 2024");
  });

  it("verwendet Umlaute in Monatsnamen und keine führende Null", () => {
    mock.timers.enable({ apis: ["Date"], now: new Date(2025, 2, 3, 12) });
    assert.equal(dateString(), "3. März 2025");
  });
});
