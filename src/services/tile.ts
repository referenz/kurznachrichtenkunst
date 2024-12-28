import { getEnvVar } from "../util/env.ts";
import { delay } from "@std/async/delay";
import { HaikuFeed } from "../types.ts";

export async function createTiles (haiku_feed: HaikuFeed) {

    const api_key = getEnvVar("KNK_CANVAS_API_KEY");

    for (const single_haiku of haiku_feed.haikus) {
        const text = Object.values(single_haiku.haiku).join("\n").trim();

        const url = "https://referenz.io/haiku";
        const headers = {
            "Content-Type": "application/json",
            "x-api-key": api_key
        };

        void await fetch(url, {
            method: "POST",
            headers: headers,
            body: JSON.stringify({text})
        });

        await delay(1500);
    }

}