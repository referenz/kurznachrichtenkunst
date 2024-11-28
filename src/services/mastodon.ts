import { getEnvVar } from "../util/env.ts";

interface MastodonConfig {
  instance: string;
  token: string;
}

function getMastodonConfig(): MastodonConfig {
  return {
    instance: getEnvVar("MASTODON_INSTANCE"),
    token: getEnvVar("MASTODON_TOKEN"),
  };
}

export async function postToMastodon(message: string) {
  const { instance, token } = getMastodonConfig();
  const apiUrl = `https://${instance}/api/v1/statuses`;
  const response = await fetch(apiUrl, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ 
      status: message,
      language: 'de',
     }),
  });

  if (!response.ok) {
    console.error(`Failed to post toot: ${response.status} - ${response.statusText}`);
    return;
  } else console.log(`Toot successfully posted: ${message}`);

  //const _data = await response.json();
  //console.log(data);
}
