export function getEnvVar(name: string): string {
  const value = Deno.env.get(name);
  if (!value) throw new Error(`Die Umgebungsvariable '${name}' ist nicht gesetzt.`);
  return value;
}
