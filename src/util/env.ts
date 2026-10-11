export function getEnvVar(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Die Umgebungsvariable '${name}' ist nicht gesetzt.`);
  return value;
}

export function getOptionalEnvVar(name: string): string | undefined {
  try {
    return getEnvVar(name);
  } catch {
    return undefined;
  }
}
