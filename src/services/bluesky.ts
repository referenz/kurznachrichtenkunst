import { AtpAgent } from "@atproto/api";
import { getEnvVar } from "../util/env.ts";

interface BlueskyConfig {
  identifier: string;
  password: string;
}

function getBlueskyConfig(): BlueskyConfig {
  return {
    identifier: getEnvVar("BLUESKY_IDENTIFIER"),
    password: getEnvVar("BLUESKY_PASSWORD"),
  };
}

function generateFacetsFromHashtags(text: string) {
  const hashtagRegex = /#[\p{L}\p{N}_]+/gu;
  const encoder = new TextEncoder();
  const facets = [];
  let match;

  while ((match = hashtagRegex.exec(text)) !== null) {
    const hashtag = match[0]; // Gefundener Hashtag

    // UTF-8-Byte-Länge vor dem Hashtag berechnen
    const byteStart = encoder.encode(text.slice(0, match.index)).length;
    const byteEnd = byteStart + encoder.encode(hashtag).length;

    facets.push({
      index: {
        byteStart,
        byteEnd,
      },
      features: [
        {
          $type: "app.bsky.richtext.facet#tag",
          tag: hashtag.slice(1), // Entferne das '#' für die API
        },
      ],
    });
  }

  return facets;
}



export async function postToBluesky(message: string) {
  const agent = new AtpAgent({
    service: "https://bsky.social",
  });
  
  const { identifier, password } = getBlueskyConfig();
  await agent.login({
    identifier,
    password,
  });

  await agent.post({
    text: message,
    facets: generateFacetsFromHashtags(message),
    createdAt: new Date().toISOString(),
  });
}
