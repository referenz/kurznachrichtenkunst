# kurznachrichtenkunst

Ein Bot, der aus den aktuellen Nachrichten des Tages drei Haikus macht und sie auf Mastodon und Bluesky veröffentlicht.

## Funktionsweise

1. **Nachrichten sammeln:** Aus den RSS-Feeds von Spiegel, Tagesschau, Zeit, Bild, Deutschlandfunk und FAZ werden alle Meldungen der letzten 24 Stunden geladen (Schlagzeile plus Teaser).
2. **Haikus erzeugen:** Die Meldungen gehen gesammelt an ein KI-Modell (Claude, Gemini oder ChatGPT). Die Anweisungen dafür stehen in [src/util/instruction.md](src/util/instruction.md): Das Modell wählt die drei relevantesten, voneinander unabhängigen Ereignisse aus und schreibt zu jedem ein deutsches Haiku mit drei Hashtags.
3. **Prüfen:** Die Antwort muss JSON sein und wird mit [zod](https://zod.dev/) gegen ein Schema geprüft (genau 3 Haikus mit je 3 Zeilen und 3 Hashtags). Ist sie ungültig, bricht der Lauf ab, ohne etwas zu posten.
4. **Posten:** Jedes Haiku wird mit Hashtags und Datum formatiert und gleichzeitig auf Mastodon und Bluesky gepostet. Zwischen den Posts liegen 3 Sekunden.

Ein Post sieht etwa so aus:

```text
Zeile eins des Haikus
Zeile zwei des Haikus
Zeile drei des Haikus


🏷️ #Hashtag1 #Hashtag2 #Hashtag3
📰 10. Oktober 2026
```

Jeder Aufruf erzeugt genau einen Durchgang. Für regelmäßige Posts muss der Bot von außen zeitgesteuert gestartet werden, z. B. per Cron.

## Voraussetzungen

- [Node.js](https://nodejs.org/) ab Version 22.18. Die TypeScript-Dateien werden direkt mit Node ausgeführt, ohne Build-Schritt.
- Ein API-Schlüssel für mindestens einen der KI-Anbieter
- Zugangsdaten für Mastodon und Bluesky

## Einrichtung

```bash
npm install
cp .env.example .env
```

Danach in `.env` die Zugangsdaten eintragen (siehe unten).

## Konfiguration

Die Umgebungsvariablen werden beim Start aus `.env` gelesen.

| Variable             | Beschreibung                                                                |
| -------------------- | --------------------------------------------------------------------------- |
| `AI_PROVIDER`        | KI-Anbieter: `claude` (Standard), `gemini` oder `chatgpt`                   |
| `ANTHROPIC_API_KEY`  | API-Schlüssel für Claude (nur bei `claude` nötig)                           |
| `GEMINI_API`         | API-Schlüssel für Gemini (nur bei `gemini` nötig)                           |
| `OPENAI_API_KEY`     | API-Schlüssel für ChatGPT (nur bei `chatgpt` nötig)                         |
| `MASTODON_INSTANCE`  | Hostname der Mastodon-Instanz **ohne** `https://`, z. B. `mastodon.social`  |
| `MASTODON_TOKEN`     | Zugriffstoken einer Mastodon-Anwendung mit Schreibrecht für Posts           |
| `BLUESKY_IDENTIFIER` | Bluesky-Handle, z. B. `name.bsky.social`                                    |
| `BLUESKY_PASSWORD`   | Bluesky-App-Passwort (nicht das Kontopasswort)                              |
| `KNK_CANVAS_API_KEY` | Derzeit nicht genutzt (gehört zur deaktivierten Bildkachel-Funktion, s. u.) |

Die verwendeten Modelle sind fest im Code eingetragen:

| Anbieter | Modell              | Datei                                              |
| -------- | ------------------- | -------------------------------------------------- |
| Claude   | `claude-sonnet-5-5` | [src/services/claude.ts](src/services/claude.ts)   |
| Gemini   | `gemini-3.8-flash`  | [src/services/gemini.ts](src/services/gemini.ts)   |
| ChatGPT  | `gpt-6.1-sol`       | [src/services/chatGPT.ts](src/services/chatGPT.ts) |

## Ausführen

```bash
npm start
```

Wenn beim Abruf der Feeds keine Meldungen zusammenkommen, endet der Lauf mit einer Fehlermeldung. Schlägt nur einer der beiden Dienste beim Posten fehl, wird auf dem anderen trotzdem gepostet.

### Testskripte

Diese Skripte rufen einzelne Teile auf, ohne etwas zu posten:

| Befehl                 | Zweck                                                   |
| ---------------------- | ------------------------------------------------------- |
| `npm run feeds-test`   | Lädt die Nachrichten aus den Feeds und gibt sie aus     |
| `npm run gemini-test`  | Erzeugt Haikus mit Gemini                               |
| `npm run chatgpt-test` | Erzeugt Haikus mit ChatGPT                              |
| `npm run ai-test`      | Führt die Tests für ChatGPT und Gemini nacheinander aus |

### Typprüfung

```bash
npm run check
```

Prüft alle Dateien in `src/` mit TypeScript, ohne etwas zu erzeugen. Die Einstellungen dafür stehen in [tsconfig.json](tsconfig.json).

## Projektstruktur

```text
src/
├── main.ts                  Einstiegspunkt: Feeds → KI → Posten
├── types.ts                 Typ HaikuFeed
├── services/
│   ├── feeds.ts             RSS-Feeds abrufen und auf 24 Stunden filtern
│   ├── ai.ts                Wählt den KI-Anbieter anhand von AI_PROVIDER
│   ├── claude.ts            Anbindung an Claude
│   ├── gemini.ts            Anbindung an Gemini
│   ├── chatGPT.ts           Anbindung an ChatGPT
│   ├── formatHaikus.ts      Formatiert die Haikus als Post-Text
│   ├── mastodon.ts          Postet auf Mastodon
│   ├── bluesky.ts           Postet auf Bluesky
│   └── tile.ts              Bildkacheln über referenz.io (derzeit deaktiviert)
├── util/
│   ├── instruction.md       Anweisungen an das KI-Modell
│   ├── validateHaikuFeed.ts zod-Schema und Validierung
│   ├── dateString.ts        Datum im deutschen Format
│   └── env.ts               Liest Umgebungsvariablen
└── test/                    Testskripte (siehe oben)
```

Die Bildkachel-Funktion in `tile.ts` schickt jedes Haiku an `https://referenz.io/haiku`. Ihr Aufruf in `main.ts` ist auskommentiert.
