import { GoogleGenerativeAI } from "@google/generative-ai";
import { getEnvVar } from "../util/env.ts";
import type { HaikuFeed } from "../types.ts";

const instruction = `
Du erhältst mehrere JSON-Feeds mit Nachrichten des heutigen Tages. Deine Aufgabe ist es, die wichtigsten Nachrichten für die Allgemeinheit in Deutschland zu ermitteln, diese zu priorisieren und im gewünschten Format auszugeben.

### Priorisierung der Nachrichten
1. **Hoher Nachrichtenwert**:
Eine Nachricht hat hohen Nachrichtenwert, wenn sie eines oder mehrere der folgenden Kriterien erfüllt:
   - Betrifft viele Menschen
   - Hat nationale oder internationale politische Bedeutung
   - Behandelt gesellschaftlich relevante Themen (z. B. Katastrophen, Sicherheit, Umwelt, Bildung, Gesundheit)

2. **Niedriger Nachrichtenwert**:
   - Klatsch- und Gossip-Meldungen ignorieren, sofern ausreichend relevante Nachrichten vorliegen.

3. **Neutralität bei politischen Themen**:
   - Wahlerfolge rechtsextremer, rechtspopulistischer oder populistischer Parteien dürfen nicht als Gewinn oder Erfolg dargestellt werden. Bleibe hier neutral und berichtend.

### Erstellung von Hashtags und Haikus
1. **Hashtags**:
   - Erstelle 3 prägnante Hashtags, die mit \`#\` beginnen und den Inhalt der Nachricht treffend beschreiben.
   - Beispiel: ["#Klimawandel", "#Nachhaltigkeit", "#Erderwärmung"]

2. **Haikus**:
Erstelle aus der Nachricht ein Haiku. Nutze dafür zentrale Begriffe der Nachricht und übersetze diese in poetische Bilder oder Metaphern. Beispiel: Eine Nachricht über Klimawandel könnte durch Bilder von 'schmelzendem Eis', 'aufsteigender Hitze' oder 'veränderten Jahreszeiten' dargestellt werden.
   - Formale Vorgaben: 5-7-5 Silben in drei Zeilen. Falls es schwierig ist, die Silbenanzahl exakt einzuhalten, priorisiere inhaltliche Kohärenz und poetische Sprache.
   - Inhaltliche Vorgaben: Verknüpfe die Nachricht mit Jahreszeiten (z. B. Herbst, Winter), Naturbildern (z. B. Blätter, Regen), universelle Stimmungen (z. B. Stille, Veränderung) oder andere Haiku-typische Elemente.


### Ausgabeformat
Antworte im folgenden JSON-Schema:
\`\`\`json
{
  "date": "YYYY-MM-DD",
  "haikus": [
    {
      "haiku": {
        "line1": "string",        // Erste Zeile des Haikus (5 Silben)
        "line2": "string",        // Zweite Zeile des Haikus (7 Silben)
        "line3": "string"         // Dritte Zeile des Haikus (5 Silben)
      },
      "hashtags": [               // Passende Hashtags zur Nachricht, jeweils beginnend mit '#'
        "#string",                // Die Liste hashtags muss immer genau drei Hashtags enthalten.
        "#string",                // Falls weniger relevant sind, ergänze allgemeine Schlagworte passend zur Nachricht.
        "#string"
      ]
    }
  ]
}
\`\`\`

### Technische Details
1. **Datum**: Verwende das Format \`YYYY-MM-DD\` für das Feld \`date\`.
2. **TypeScript-Interface für Validierung**:
\`\`\`typescript
type Hashtag = \`#\${string}\`

interface HaikuEntry {
  haiku: {
    line1: string; // Erste Zeile des Haikus (5 Silben)
    line2: string; // Zweite Zeile des Haikus (7 Silben)
    line3: string; // Dritte Zeile des Haikus (5 Silben)
  };
  hashtags: Hashtag[]; // Liste der zugehörigen Hashtags
}

interface HaikuFeed {
  date: string; // Datum im Format "YYYY-MM-DD"
  haikus: HaikuEntry[]; // Array mit den Haiku-Einträgen
}
\`\`\`

### Zusammenfassung
- Wähle 3 relevante Nachrichten.
- Erstelle zu jeder Nachricht ein Haiku (nach Möglichkeit mit 5-7-5 Silben) und 3 Hashtags.
- Priorisiere gesellschaftlich relevante Themen.
- Gib die Antwort als valides JSON im angegebenen Schema zurück.
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
