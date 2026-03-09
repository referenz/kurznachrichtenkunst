# kurznachrichtenkunst

Ein Bot, der KI-generierte Haikus zu aktuellen Nachrichten auf Mastodon und Bluesky postet.

## Funktionsweise

1. Aktuelle Nachrichten werden aus RSS-Feeds geladen
2. Die Schlagzeilen werden an ein KI-Modell übergeben
3. Das Modell generiert Haikus zu den Nachrichten
4. Die Haikus werden auf Mastodon und Bluesky gepostet

## Voraussetzungen

- [Deno](https://deno.com/) (v2+)

## Einrichtung

```bash
cp .env.example .env
```

Anschließend `.env` mit den eigenen API-Schlüsseln befüllen (siehe unten).

## Konfiguration

| Variable             | Beschreibung                                              |
|----------------------|-----------------------------------------------------------|
| `AI_PROVIDER`        | KI-Anbieter: `claude` (Standard), `gemini` oder `chatgpt` |
| `ANTHROPIC_API_KEY`  | API-Schlüssel für Claude (Anthropic)                      |
| `OPENAI_API_KEY`     | API-Schlüssel für ChatGPT (OpenAI)                        |
| `GEMINI_API`         | API-Schlüssel für Gemini (Google)                         |
| `MASTODON_TOKEN`     | Zugriffstoken für Mastodon                                |
| `MASTODON_INSTANCE`  | URL der Mastodon-Instanz (z. B. `https://mastodon.social`) |
| `BLUESKY_IDENTIFIER` | Bluesky-Handle (z. B. `name.bsky.social`)                 |
| `BLUESKY_PASSWORD`   | Bluesky App-Passwort                                      |

## Ausführen

```bash
deno task run
```
