import Parser from "rss-parser";

const feedUrls = [
  "https://www.spiegel.de/schlagzeilen/rss/0,5291,,00.xml",
  "https://www.tagesschau.de/infoservices/alle-meldungen-100~rss2.xml",
  "https://newsfeed.zeit.de/",
  "http://www.bild.de/rssfeeds/rss3-20745882,feed=alles.bild.html",
  "https://www.deutschlandfunk.de/nachrichten-100.rss",
  "https://www.faz.net/rss/aktuell/",
];

async function fetchAndFilterFeed(url: string): Promise<string[]> {
  try {
    const parser = new Parser();
    const feed = await parser.parseURL(url);
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;

    return feed.items
      .filter((item) => {
        if (!item.pubDate) return false;
        return now - new Date(item.pubDate).getTime() <= oneDay;
      })
      .map((item) => {
        const title = item.title?.trim();
        const teaser = item.contentSnippet?.trim() || item.content?.trim();
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
