import Parser from "rss-parser";

const feedUrls = [
  "https://www.spiegel.de/schlagzeilen/rss/0,5291,,00.xml",
  "https://www.tagesschau.de/infoservices/alle-meldungen-100~rss2.xml",
  "https://newsfeed.zeit.de/",
  "http://www.bild.de/rssfeeds/rss3-20745882,feed=alles.bild.html",
  "https://www.deutschlandfunk.de/nachrichten-100.rss",
];

async function fetchAndFilterFeed(url: string) {
  try {
    const parser = new Parser();
    const feed = await parser.parseURL(url);

    // Aktuelle Zeit in Millisekunden
    const now = new Date().getTime();

    // Nur Items behalten, die in den letzten 24 Stunden veröffentlicht wurden
    const filteredItems = feed.items.filter((item) => {
      if (!item.pubDate) return false;
      const pubDate = new Date(item.pubDate).getTime();
      const oneDay = 24 * 60 * 60 * 1000; // 24 Stunden in Millisekunden
      return now - pubDate <= oneDay;
    });

    // Aktualisiere den Feed mit den gefilterten Items
    feed.items = filteredItems;

    // console.log(`Gefilterter Feed (${filteredItems.length} Items):`);
    //filteredItems.forEach((item) => console.log(item.title));
    return JSON.stringify(feed); // Du kannst den Feed hier weiterverarbeiten
  } catch (error) {
    console.error("Fehler beim Abrufen oder Filtern des Feeds:", error);
  }
}

export async function getNews(): Promise<string[]> {
  const feedContents = await Promise.all(feedUrls.map(fetchAndFilterFeed));
  return feedContents.filter((content): content is string => content !== null);
}
