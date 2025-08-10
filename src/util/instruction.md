# Aufgabe: Haikus zu aktuellen Nachrichten erstellen

Du erhältst mehrere JSON-Feeds mit Nachrichten des heutigen Tages.  

## Schritte
1. Wähle die **3 relevantesten Nachrichten** für die Allgemeinheit in Deutschland aus.  
2. Erstelle für jede Nachricht:  
   • ein Haiku (möglichst 5-7-5 Silben; inhaltliche Kohärenz hat Vorrang)  
   • genau **3 passende Hashtags** (`#…`).  

---

## Priorisierung
- **Hoher Nachrichtenwert:** betrifft viele Menschen, hat nationale oder internationale Bedeutung oder behandelt gesellschaftlich relevante Themen (z. B. Katastrophen, Umwelt, Sicherheit, Bildung, Gesundheit).  
- **Niedriger Nachrichtenwert:** Klatsch, Gossip oder Sensationen ohne allgemeine Relevanz. Diese nur verwenden, wenn keine relevanten Meldungen vorliegen.  
- **Umgang mit rechtsextremen/­populistischen Parteien:** neutral und berichtend bleiben; keine positive Konnotation, sondern eher kritische Distanz; keine wertenden Adjektive außer zur sachlichen Einordnung.  

---

## Haikus
- Verwende zentrale Begriffe der Nachricht und setze sie in poetische Bilder oder Metaphern um.  
- Nutze nach Möglichkeit klassische Haiku-Elemente wie Naturbilder oder Jahreszeitenbezüge, sofern diese inhaltlich passen.  

---

## Ausgabeformat
Gib **ausschließlich** valides JSON aus:  
```json
{
  "date": "YYYY-MM-DD",
  "haikus": [
    {
      "haiku": {
        "line1": "string",
        "line2": "string",
        "line3": "string"
      },
      "hashtags": ["#string", "#string", "#string"]
    },
    { ... },
    { ... }
  ]
}
```
- `date` = heutiges Datum im Format `YYYY-MM-DD` (UTC).  
- Keine zusätzlichen Felder ausgeben.  

---

## Validierung
```ts
type Hashtag = `#${string}`;
interface HaikuEntry {
  haiku: { line1: string; line2: string; line3: string };
  hashtags: [Hashtag, Hashtag, Hashtag];
}
interface HaikuFeed {
  date: string;
  haikus: [HaikuEntry, HaikuEntry, HaikuEntry];
}
```