import type { HaikuFeed } from "../types.ts";
import { dateString } from "../util/dateString.ts";

export function getFormattedHaikus(haikuFeed: HaikuFeed): string[] {
  const date = `📰 ${dateString()}`;
  return haikuFeed.haikus.map(
    ({ haiku, hashtags }) =>
      `${haiku.line1}\n${haiku.line2}\n${haiku.line3}\n\n\n🏷️ ${hashtags.join(" ")}\n${date}`,
  );
}
