import { GoogleGenerativeAI } from "@google/generative-ai";
import { getEnvVar } from "../util/env.ts";
import type { HaikuFeed } from "../types.ts";

const instruction = `Du erhältst mehrere JSON-Feeds mit Nachrichten des heutigen Tages.
  Ermittle aus diesen Feeds selbstständig die die Nachrichten mit dem größten Nachrichtenwert für die Allgemeinheit in Deutschland.
  Bitte die Nachrichten der Klatsch- und Gossip-Meldungen nicht so hochpriorisieren. Stattdessen auf Politik und Weltgeschehen fokussieren.
  Erstelle zu diesen drei Nachrichten jeweils drei passende Hashtags und jeweils ein poetisches Haiku.
  Bitte achte darauf, dass auch die inhaltlichen Merkmale eines Haikus berücksichtigt werden und nach Möglichkeit auch die formalen Vorgaben.
  Versuche, die Themen der Nachrichten mit Naturanspielungen oder anderen typischen Haiku-Elementen zu verknüpfen. 
  Wahlerfolge oder das Erstarken extrem rechter, rechtspopulistischer oder populistischer Parteien soll nicht in einen positiven
  Kontext gesetzt werden.

  Antworte ebenfalls in einem JSON-Feed. Dieser soll folgendes Schema haben:

  {
    "date": "YYYY-MM-DD",
    "haikus": [
      {
        "haiku": {
          "line1": "string",        // Erste Zeile des Haikus (5 Silben)
          "line2": "string",        // Zweite Zeile des Haikus (7 Silben)
          "line3": "string"         // Dritte Zeile des Haikus (5 Silben)
        },
        "hashtags": [               // Passende Hashtags zur Nachricht
          "string",
          "string",
          "string"
        ],
      }
    ]
  }

  Die Antwort muss also diesem TypeScript-Interface entsprechen:

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
  `;

export async function generateResponse(prompt: string): Promise<HaikuFeed> {
  const genAI = new GoogleGenerativeAI(getEnvVar("GEMINI_API"));
  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
    systemInstruction: instruction,
  });

  const result = await model.generateContent(prompt);

  if (!result || !result.response) {
    console.error("No response from AI model");
    return { date: new Date().toISOString().split("T")[0], haikus: [] };
  }

  let resultText = result.response.text();
  resultText = resultText
    .trim() // Entfernt zusätzliche Leerzeichen
    .replace(/^```json/, "") // Entfernt den Start-Tag
    .replace(/```$/, ""); // Entfernt den End-Tag

  const parsedResponse = JSON.parse(resultText) satisfies HaikuFeed;
  return parsedResponse;
}
