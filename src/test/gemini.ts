import { getNews } from "../services/feeds.ts";
import { generateResponse } from "../services/gemini.ts";
import type { HaikuFeed } from "../types.ts";

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
  } catch (err: unknown) {
    console.error("Fehler aufgetreten: ", err);
  }
}

await executeMainLogic();