import type { HaikuFeed } from "../types.ts";
import { dateString } from "../util/dateString.ts";

export function getFormattedHaikus(haikuFeed: HaikuFeed): string[] {
  const date = `📰 ${dateString()}\n\n`; // Datum nur einmal abrufen
  return haikuFeed.haikus.map(({ haiku, hashtags }) =>
    `${date}${haiku.line1}\n${haiku.line2}\n${haiku.line3}\n\n🏷️ ${hashtags.join(" ")}`
  );
}
