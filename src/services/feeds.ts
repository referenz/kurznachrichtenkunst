import { parseFeed } from "@rowanmanning/feed-parser";

const feedUrls = [
  "https://www.spiegel.de/schlagzeilen/rss/0,5291,,00.xml",
  "https://www.tagesschau.de/infoservices/alle-meldungen-100~rss2.xml",
  "https://newsfeed.zeit.de/",
  "http://www.bild.de/rssfeeds/rss3-20745882,feed=alles.bild.html",
  "https://www.deutschlandfunk.de/nachrichten-100.rss",
  "https://www.faz.net/rss/aktuell/",
];

const oneDay = 24 * 60 * 60 * 1000;

type FeedItem = ReturnType<typeof parseFeed>["items"][number];

// Manche Feeds (z. B. Bild) nutzen Zeitzonen-Kürzel wie "CEST", die Date nicht versteht.
const timezoneOffsets: Record<string, string> = { CET: "+0100", CEST: "+0200" };

function getPublished(item: FeedItem): Date | null {
  if (item.published) return item.published;

  const raw = item.element.findElementWithName("pubdate")?.textContentNormalized;
  if (!raw) return null;

  const date = new Date(raw.replace(/\b(CEST|CET)$/, (tz) => timezoneOffsets[tz]));
  return Number.isNaN(date.getTime()) ? null : date;
}

function stripHtml(text: string): string {
  return text
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

async function fetchAndFilterFeed(url: string): Promise<string[]> {
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "kurznachrichtenkunst",
        Accept: "application/rss+xml, application/atom+xml, application/xml;q=0.9, */*;q=0.8",
      },
      signal: AbortSignal.timeout(30000),
    });
    if (!response.ok) throw new Error(`Status ${response.status}`);

    const feed = parseFeed(await response.text());
    const now = Date.now();

    return feed.items
      .filter((item) => {
        const published = getPublished(item);
        return published !== null && now - published.getTime() <= oneDay;
      })
      .map((item) => {
        const title = item.title?.trim();
        const teaser = stripHtml(item.description || item.content || "");
        if (!title) return null;
        return teaser ? `${title}\n${teaser}` : title;
      })
      .filter((line): line is string => Boolean(line));
  } catch (error) {
    console.error(`Fehler beim Abrufen des Feeds (${url}): `, error);
    return [];
  }
}

export async function getNews(): Promise<string[]> {
  const results = await Promise.allSettled(feedUrls.map(fetchAndFilterFeed));

  return results
    .filter((r): r is PromiseFulfilledResult<string[]> => r.status === "fulfilled")
    .flatMap((r) => r.value);
}
