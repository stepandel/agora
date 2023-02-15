import { Toucan, Options } from "toucan-js";
import { Env } from "./env";
import { RewriteFrames } from "@sentry/integrations";
import type { ExportedHandler, Response } from "@cloudflare/workers-types";

export type MakeOptionsParams = {
  env: Env;
  ctx: {
    waitUntil: (promise: Promise<any>) => void;
  };
};

export function makeToucanOptions({ env, ctx }: MakeOptionsParams): Options {
  return {
    dsn: env.SENTRY_DSN,
    environment: env.ENVIRONMENT,
    release: env.GITHUB_SHA,
    context: ctx,
    integrations: [new RewriteFrames({ root: "/" })],
  };
}

export async function runReportingException<T>(
  sentry: Toucan,
  fn: () => Promise<T>
): Promise<T> {
  try {
    return await fn();
  } catch (e) {
    sentry.captureException(e);
    throw e;
  }
}
export function wrapModuleSentry(
  makeOptions: (params: MakeOptionsParams) => Options,
  generateHandlers: (sentry: Toucan) => ExportedHandler<Env>
): ExportedHandler<Env> {
  return {
    async fetch(...args): Promise<Response> {
      const [request, env, ctx] = args;

      const sentry = new Toucan({
        ...makeOptions({ env, ctx }),
        // @ts-expect-error
        request: request,
      });

      sentry.setTags({
        deployment: env.DEPLOYMENT,
      });

      const handlers = generateHandlers(sentry);

      return await runReportingException(sentry, async () => {
        sentry.setTag("entrypoint", "fetch");
        return (
          handlers.fetch?.(...args) ??
          new Response("not found", { status: 404 })
        );
      });
    },
    async scheduled(...args) {
      const [event, env, ctx] = args;
      const sentry = new Toucan({
        ...makeOptions({ env, ctx }),
      });

      sentry.setTags({
        deployment: env.DEPLOYMENT,
      });

      const handlers = generateHandlers(sentry);
      const scheduleHandler = handlers.scheduled;

      if (!scheduleHandler) {
        return;
      }

      return await runReportingException(sentry, async () => {
        sentry.setTag("entrypoint", "scheduled");
        sentry.setExtras({
          event: {
            scheduledTime: event.scheduledTime,
            cron: event.cron,
          },
        });
        return scheduleHandler(...args);
      });
    },
  };
}
