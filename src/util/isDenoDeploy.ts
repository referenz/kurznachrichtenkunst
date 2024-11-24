export function isDenoDeploy() {
  return Boolean(Deno.env.get("DENO_DEPLOYMENT_ID"));
}
