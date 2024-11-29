import { z } from "zod";

// Haiku-Schema
const HaikuSchema = z.object({
  haiku: z.object({
    line1: z.string(),
    line2: z.string(),
    line3: z.string(),
  }),
  hashtags: z
    .array(z.string().regex(/^#/))
    .length(3), // Genau 3 Hashtags
});

// Haiku-Feed-Schema mit genau 3 Haikus
const HaikuFeedSchema = z.object({
  date: z.string(),
  haikus: z.tuple([HaikuSchema, HaikuSchema, HaikuSchema]), // Genau 3 Haikus
});

// Typ ableiten
export type HaikuFeed = z.infer<typeof HaikuFeedSchema>;

// Validierungsfunktion
export function validateHaikuFeed(data: unknown): { success: boolean; data?: HaikuFeed; errors?: string[] } {
  const result = HaikuFeedSchema.safeParse(data);

  if (result.success) {
    return { success: true, data: result.data }; // Gültige Daten
  } else {
    // Fehler extrahieren und lesbarer machen
    const errors = result.error.errors.map(err => {
      const path = err.path.join(".");
      return `Error at "${path}": ${err.message}`;
    });

    return { success: false, errors }; // Validierungsfehler
  }
}
