import {
  EnvelopError,
  handleStreamOrSingleExecutionResult,
  Plugin,
} from "@graphql-yoga/common";
import {
  GraphQLError,
  Kind,
  OperationDefinitionNode,
  print,
  responsePathAsArray,
} from "graphql";
import { Toucan } from "toucan-js";

import { AgoraContextType } from "../schema/context";
import { withSentryScope } from "../sentry";

import { captureException } from "./sentry";

export function useSentry(sentry: Toucan): Plugin<AgoraContextType> {
  return {
    onResolverCalled({ info, context }) {
      return ({ result }) => {
        if (!(result instanceof Error) || skipError(result)) {
          return;
        }

        const { opName, operationType } = (context as any)[
          sentryTracingSymbol
        ] as SentryTracingContext;
        const path = responsePathAsArray(info.path);
        sentry.withScope((scope) => {
          scope.setFingerprint([
            "graphql",
            stringifyPath(path),
            operationType,
            opName ?? "defaultOperationName",
          ]);

          captureException(sentry, result);
        });
      };
    },

    onExecute({ args, extendContext }) {
      const rootOperation = args.document.definitions.find(
        (o) => o.kind === Kind.OPERATION_DEFINITION
      ) as OperationDefinitionNode;

      const opName = args.operationName || rootOperation.name?.value;

      const operationType = rootOperation.operation;
      const document = print(args.document);

      const sentryContext: SentryTracingContext = {
        opName,
        operationType,
      };

      const rootSpan =
        args.contextValue.tracingContext.rootSpan.startChildSpan("graphql");
      rootSpan.addData({
        graphql: {
          operationName: opName,
          operation: operationType,
          variables: args.variableValues,
        },
      });

      extendContext({
        [sentryTracingSymbol]: sentryContext,
        tracingContext: { ...args.contextValue.tracingContext, rootSpan },
      } as any);

      return {
        onExecuteDone(payload) {
          rootSpan.finish();

          return handleStreamOrSingleExecutionResult(
            payload,
            ({ result, setResult }) => {
              if (!result.errors?.length) {
                return;
              }

              const errors = result.errors.map((error) => {
                const errorPathWithIndex = stringifyPath(error.path ?? []);

                const eventId = withSentryScope(sentry, (scope) => {
                  scope.setTag("operation", operationType);

                  if (opName) {
                    scope.setTag("operationName", opName);
                  }

                  scope.setExtra("document", document);
                  scope.setExtra("variables", args.variableValues);
                  scope.setExtra("path", error.path);

                  scope.setFingerprint([
                    "graphql",
                    errorPathWithIndex,
                    opName ?? "Anonymous Operation",
                    operationType,
                  ]);

                  return captureException(sentry, error);
                });

                return addEventId(error, eventId);
              });

              setResult({
                ...result,
                errors,
              });
            }
          );
        },
      };
    },
  };
}

function skipError(error: Error): boolean {
  return error instanceof EnvelopError;
}

const sentryTracingSymbol = Symbol("sentryTracing");

type SentryTracingContext = {
  operationType: string;
  opName?: string;
};

function stringifyPath(path: ReadonlyArray<string | number>): string {
  return path.map((v) => (typeof v === "number" ? "$index" : v)).join(" > ");
}

function addEventId(err: GraphQLError, eventId: string): GraphQLError {
  return new GraphQLError(
    err.message,
    err.nodes,
    err.source,
    err.positions,
    err.path,
    undefined,
    {
      ...err.extensions,
      sentryEventId: eventId,
    }
  );
}
