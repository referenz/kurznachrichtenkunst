import { delay } from "@std/async/delay";
import { getNews } from "./services/feeds.ts";
import { generateResponse } from "./services/gemini.ts";
import { getFormattedHaikus } from "./services/formatHaikus.ts";
import { postToMastodon } from "./services/mastodon.ts";
import type { HaikuFeed } from "./types.ts";
import { postToBluesky } from "./services/bluesky.ts";

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

  const response = (await generateResponse(news.join("\n"))) as HaikuFeed;
  const formattedHaikus = getFormattedHaikus(response);
  await postHaikus(formattedHaikus).then(() => console.log("Erfolgreich gepostet."));
}
