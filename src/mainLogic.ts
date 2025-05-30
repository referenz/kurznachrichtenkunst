import { delay } from "@std/async/delay";
import { getNews } from "./services/feeds.ts";
import { generateResponse } from "./services/gemini.ts";
import { getFormattedHaikus } from "./services/formatHaikus.ts";
import { postToMastodon } from "./services/mastodon.ts";
import type { HaikuFeed } from "./types.ts";
import { postToBluesky } from "./services/bluesky.ts";
import { createTiles } from "./services/tile.ts";

async function postHaikus(haikus: string[]) {
  for (const haiku of haikus) {
    // Parallel auf Mastodon und Bluesky posten
    await Promise.allSettled([
      postToMastodon(haiku),
      postToBluesky(haiku),
    ]);

    // Warte 3 Sekunden
    await delay(3000);
  }
}

export async function executeMainLogic() {
  const news = await getNews();
  if (!news || news.length === 0) {
    console.error("Keine Nachrichten verfügbar. Abbruch.");
    return;
  }

  let response: HaikuFeed;
  try {
    response = (await generateResponse(news.join("\n"))) as HaikuFeed;
    console.log("[INFO] Generierte Haikus:", response);
    const formattedHaikus = getFormattedHaikus(response);
    await postHaikus(formattedHaikus);
    console.log("[INFO] Erfolgreich gepostet.");
    createTiles(response);
  } catch (err: unknown) {
    console.error("Fehler aufgetreten: ", err);
  }
}
