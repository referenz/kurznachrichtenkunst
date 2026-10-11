import type { HaikuFeed } from "../types.ts";

export function createHaikuFeed(): HaikuFeed {
  return {
    date: "2024-11-22",
    haikus: [
      {
        haiku: { line1: "Zeile eins A", line2: "Zeile zwei A", line3: "Zeile drei A" },
        hashtags: ["#Politik", "#Berlin", "#News"],
      },
      {
        haiku: { line1: "Zeile eins B", line2: "Zeile zwei B", line3: "Zeile drei B" },
        hashtags: ["#Sport", "#Fussball", "#Bundesliga"],
      },
      {
        haiku: { line1: "Zeile eins C", line2: "Zeile zwei C", line3: "Zeile drei C" },
        hashtags: ["#Wetter", "#Herbst", "#Regen"],
      },
    ],
  };
}

/** Setzt Umgebungsvariablen und liefert eine Funktion, die den alten Zustand wiederherstellt. */
export function setEnv(vars: Record<string, string | undefined>): () => void {
  const previous = Object.fromEntries(Object.keys(vars).map((key) => [key, process.env[key]]));
  apply(vars);
  return () => apply(previous);
}

function apply(vars: Record<string, string | undefined>) {
  for (const [key, value] of Object.entries(vars)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
}
