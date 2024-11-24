export function dateString() {
  const today = new Date();
  const options = { day: "numeric", month: "long", year: "numeric" } satisfies Intl.DateTimeFormatOptions;
  const formattedDate = new Intl.DateTimeFormat("de-DE", options).format(today);

  return formattedDate; // Beispielausgabe: "22. November 2024"
}
