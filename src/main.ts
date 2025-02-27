import { executeMainLogic } from "./mainLogic.ts";
// import { isDenoDeploy } from "./util/isDenoDeploy.ts";


Deno.cron("taegliche Posts", "45 18 * * *", () => {
  executeMainLogic();
});


/*

if (isDenoDeploy()) {
  Deno.cron("taegliche Posts", "45 18 * * *", () => {
    executeMainLogic();
  });

  Deno.serve((_req: Request) => new Response(""));
} else executeMainLogic();
*/