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

export async function postToBluesky(message: string) {
  const agent = new AtpAgent({
    service: "https://bsky.social",
  });
  
  const { identifier, password } = getBlueskyConfig();
  await agent.login({
    identifier: identifier,
    password: password,
  });

  await agent.post({
    text: message,
    createdAt: new Date().toISOString(),
  });
}
