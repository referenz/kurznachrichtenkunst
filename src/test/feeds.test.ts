import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it, mock } from "node:test";
import { getNews } from "../services/feeds.ts";

const NOW = new Date("2024-11-22T12:00:00Z");
const HOUR = 60 * 60 * 1000;

interface Item {
  title?: string;
  description?: string;
  pubDate?: string;
}

function rss(items: Item[]): string {
  const xmlItems = items
    .map(
      ({ title, description, pubDate }) =>
        "<item>" +
        (title !== undefined ? `<title>${title}</title>` : "") +
        (description !== undefined ? `<description><![CDATA[${description}]]></description>` : "") +
        (pubDate !== undefined ? `<pubDate>${pubDate}</pubDate>` : "") +
        "</item>",
    )
    .join("");
  return `<?xml version="1.0"?><rss version="2.0"><channel><title>Test</title>${xmlItems}</channel></rss>`;
}

function hoursAgo(hours: number): string {
  return new Date(NOW.getTime() - hours * HOUR).toUTCString();
}

/** Beantwortet nur den ersten Feed mit Inhalt, alle anderen mit einem leeren Feed. */
function mockFetch(firstFeed: string | Response) {
  let first = true;
  return mock.method(globalThis, "fetch", async () => {
    if (first) {
      first = false;
      return typeof firstFeed === "string" ? new Response(firstFeed) : firstFeed;
    }
    return new Response(rss([]));
  });
}

describe("getNews", () => {
  beforeEach(() => {
    mock.timers.enable({ apis: ["Date"], now: NOW });
    mock.method(console, "error", () => {});
  });
  afterEach(() => {
    mock.timers.reset();
    mock.restoreAll();
  });

  it("ruft alle Feeds mit passenden Headern ab", async () => {
    const fetchMock = mock.method(globalThis, "fetch", async () => new Response(rss([])));
    await getNews();

    assert.equal(fetchMock.mock.callCount(), 6);
    for (const call of fetchMock.mock.calls) {
      const [url, init] = call.arguments;
      assert.match(url as string, /^https?:\/\//);
      const headers = init?.headers as Record<string, string>;
      assert.equal(headers["User-Agent"], "kurznachrichtenkunst");
      assert.match(headers.Accept, /application\/rss\+xml/);
      assert.ok(init?.signal instanceof AbortSignal);
    }
  });

  it("kombiniert Titel und Teaser", async () => {
    mockFetch(rss([{ title: "Schlagzeile", description: "Der Teaser.", pubDate: hoursAgo(1) }]));
    assert.deepEqual(await getNews(), ["Schlagzeile\nDer Teaser."]);
  });

  it("liefert nur den Titel, wenn kein Teaser vorhanden ist", async () => {
    mockFetch(rss([{ title: "Nur Titel", pubDate: hoursAgo(1) }]));
    assert.deepEqual(await getNews(), ["Nur Titel"]);
  });

  it("entfernt HTML und normalisiert Whitespace im Teaser", async () => {
    mockFetch(
      rss([
        {
          title: "  Titel  ",
          description: '<p>Erster <b>Satz</b>.</p>\n\n  <img src="x.jpg"/>Zweiter Satz.',
          pubDate: hoursAgo(1),
        },
      ]),
    );
    assert.deepEqual(await getNews(), ["Titel\nErster Satz . Zweiter Satz."]);
  });

  it("filtert Meldungen, die älter als 24 Stunden sind", async () => {
    mockFetch(
      rss([
        { title: "Frisch", pubDate: hoursAgo(1) },
        { title: "Knapp", pubDate: hoursAgo(23.9) },
        { title: "Alt", pubDate: hoursAgo(25) },
      ]),
    );
    assert.deepEqual(await getNews(), ["Frisch", "Knapp"]);
  });

  it("verwirft Meldungen ohne oder mit ungültigem Datum", async () => {
    mockFetch(
      rss([
        { title: "Ohne Datum" },
        { title: "Kaputtes Datum", pubDate: "kein Datum" },
        { title: "Gültig", pubDate: hoursAgo(2) },
      ]),
    );
    assert.deepEqual(await getNews(), ["Gültig"]);
  });

  it("verwirft Meldungen ohne Titel", async () => {
    mockFetch(
      rss([
        { description: "Teaser ohne Titel", pubDate: hoursAgo(1) },
        { title: "   ", pubDate: hoursAgo(1) },
        { title: "Mit Titel", pubDate: hoursAgo(1) },
      ]),
    );
    assert.deepEqual(await getNews(), ["Mit Titel"]);
  });

  it("versteht die Zeitzonen-Kürzel CET und CEST", async () => {
    // Jetzt ist 12:00 UTC. 12:30 UTC am Vortag liegt knapp innerhalb, 11:30 UTC knapp außerhalb von 24 h.
    mockFetch(
      rss([
        { title: "CET knapp", pubDate: "Thu, 21 Nov 2024 13:30:00 CET" },
        { title: "CET zu alt", pubDate: "Thu, 21 Nov 2024 12:30:00 CET" },
        { title: "CEST knapp", pubDate: "Thu, 21 Nov 2024 14:30:00 CEST" },
        { title: "CEST zu alt", pubDate: "Thu, 21 Nov 2024 13:30:00 CEST" },
      ]),
    );
    assert.deepEqual(await getNews(), ["CET knapp", "CEST knapp"]);
  });

  it("ignoriert Feeds mit HTTP-Fehlerstatus", async () => {
    mockFetch(new Response("nope", { status: 503 }));
    assert.deepEqual(await getNews(), []);
    assert.equal((console.error as unknown as ReturnType<typeof mock.fn>).mock.callCount(), 1);
  });

  it("ignoriert Netzwerkfehler und ungültiges XML einzelner Feeds", async () => {
    let call = 0;
    mock.method(globalThis, "fetch", async () => {
      call++;
      if (call === 1) throw new TypeError("fetch failed");
      if (call === 2) return new Response("<<<kein xml");
      return new Response(rss([{ title: `Feed ${call}`, pubDate: hoursAgo(1) }]));
    });

    const news = await getNews();
    assert.deepEqual(news.sort(), ["Feed 3", "Feed 4", "Feed 5", "Feed 6"]);
  });
});
