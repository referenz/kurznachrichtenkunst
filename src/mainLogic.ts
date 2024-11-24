import { delay } from "@std/async/delay";
import { getNews } from "./services/feeds.ts";
import { generateResponse } from "./services/gemini.ts";
import { getFormattedHaikus } from "./services/formatHaikus.ts";
import { postToMastodon } from "./services/mastodon.ts";
import { HaikuFeed } from "./types.ts";

async function postHaikus(haikus: string[]) {
  for (const haiku of haikus) {
    await postToMastodon(haiku); // Dein Post-Aufruf
    await delay(3000); // Warte 3 Sekunden
  }
}

export async function executeMainLogic() {
  const news = await getNews();

  const response = (await generateResponse(news.join("\n"))) as HaikuFeed;
  const formattedHaikus = getFormattedHaikus(response);
  await postHaikus(formattedHaikus).then(() => console.log("Erfolgreich gepostet."));
}
