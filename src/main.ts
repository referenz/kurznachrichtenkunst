import { executeMainLogic } from "./mainLogic.ts";
import { isDenoDeploy } from "./util/isDenoDeploy.ts";

if (isDenoDeploy()) {
  Deno.cron("taegliche Posts", "45 18 * * *", () => {
    executeMainLogic();
  });

  Deno.serve((_req: Request) => new Response(""));
} else executeMainLogic();
