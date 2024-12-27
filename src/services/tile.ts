/*
curl -X POST -H "Content-Type: application/json" \
     -H "x-api-key: 1fdf3ff1-c8fb-4b77-8022-fd7c6d954d60" \
     -d '{"text": "An autumn breeze blows,\nLeaves dance in the golden light,\nWhispers on the wind."}' \
     http://127.0.0.1:3030/haiku --output haiku.webp


     const text = 
*/
import { getEnvVar } from "../util/env.ts";
import { delay } from "@std/async/delay";
import { HaikuFeed } from "../types.ts";

export async function createTiles (haiku_feed: HaikuFeed) {

    const api_key = getEnvVar("KNK_CANVAS_API_KEY");

    for (const single_haiku of haiku_feed.haikus) {
        let text = '';
        for (const line in single_haiku.haiku)
            text += line + '\n';
        text = text.trim();


        const url = "https://referenz.io/haiku";
        const headers = {
            "Content-Type": "application/json",
            "x-api-key": api_key
        };

        await fetch(url, {
            method: "POST",
            headers: headers,
            body: JSON.stringify(text)
        });

        await delay(1500);

    }

}