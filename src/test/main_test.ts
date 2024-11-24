import { getNews } from "./services/feeds.ts";
import { generate_response } from "./services/gemini.ts";
import { date_string } from "./util/date_string.ts";

interface HaikuEntry {
  haiku: {
    line1: string; // Erste Zeile des Haikus (5 Silben)
    line2: string; // Zweite Zeile des Haikus (7 Silben)
    line3: string; // Dritte Zeile des Haikus (5 Silben)
  };
  hashtags: string[]; // Liste der zugehörigen Hashtags
}

interface HaikuFeed {
  date: string; // Datum im Format "YYYY-MM-DD"
  haikus: HaikuEntry[]; // Array mit den Haiku-Einträgen
}

// Ergebnis von _f2()
const response_json: HaikuFeed = {
  "date": "2024-11-23",
  "haikus": [
    {
      "haiku": {
        "line1": "Brand in Flüchtlingsheim,",
        "line2": "Schnee fällt, rettet müde Hand,",
        "line3": "Zwanzig Herzen weinen.",
      },
      "hashtags": [
        "#FlüchtlingsheimBrand",
        "#Vogelsang",
        "#Notfallhilfe",
      ],
    },
    {
      "haiku": {
        "line1": "Kanzlerfrage stockt,",
        "line2": "Juso-Wut, ein Sturm der Worte,",
        "line3": "SPD sucht neuen Weg.",
      },
      "hashtags": [
        "#Kanzlerkandidat",
        "#SPD",
        "#JusoKongress",
      ],
    },
    {
      "haiku": {
        "line1": "Baku's Klima-Gipfel,",
        "line2": "Saudi-Blockade, Hoffnung schwindet,",
        "line3": "Zukunft im Schatten.",
      },
      "hashtags": [
        "#COP29",
        "#Klimakrise",
        "#Baku",
      ],
    },
  ],
};

function _f1() {
  let haikus = response.split("\n\n");
  const prefix = ["1️⃣", "2️⃣", "3️⃣"];
  haikus = haikus.map((part) => prefix.shift() + "\n" + part + "\n\n");

  console.log(haikus[0] + haikus[1]);
}

async function _f2() {
  const news = await getNews();
  const response = await generate_response(news.join());

  console.log(response);
}

function getFormattedHaikus(haikuFeed: HaikuFeed): string[] {
  const date = `📰 ${date_string()}\n\n`; // Datum nur einmal abrufen
  return haikuFeed.haikus.map(({ haiku, hashtags }) =>
    `${date}${haiku.line1}\n${haiku.line2}\n${haiku.line3}\n\n🏷️ ${hashtags.join(" ")}`
  );
}

console.log(getFormattedHaikus(response_json));

// Ergebnis von _f1()
const response = `Winterlandschaft still,
Schnee bedeckt die dunklen Tannen,
Kälte in der Luft.

Brandenburg zerbricht,
Ministerin fällt, Vogel folgt,
Regierung im Sturm.

Netanjahu gebannt,
Haftbefehl, ein Schatten fällt,
Recht sucht seinen Weg.`;
