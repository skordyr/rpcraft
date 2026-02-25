import type { Link, LinkOperation } from "../../link";
import type { Simplify, Thunkable } from "../../shared/types";
import type { Context } from "../../types";

import { iterator } from "../../iterator";
import { EMPTY_LINK } from "../../link";

export const LOG_LINK_CONTEXT: unique symbol = /* @__PURE__ */ Symbol("LogLinkContext");

export interface LogLinkTiming {
  start?: number;
  next?: number;
  error?: number;
  complete?: number;
  dispose?: number;
}

export type LogLinkOutContext = {
  [LOG_LINK_CONTEXT]?: {
    timing: LogLinkTiming;
  };
};

export interface LogLinkHandler<TContext extends Context> {
  start?(operation: LinkOperation<Simplify<LogLinkOutContext & TContext>>): void;
  next?(
    operation: LinkOperation<Simplify<LogLinkOutContext & TContext>>,
    duration: number,
    value: unknown,
  ): void;
  error?(
    operation: LinkOperation<Simplify<LogLinkOutContext & TContext>>,
    duration: number,
    reason: unknown,
  ): void;
  complete?(
    operation: LinkOperation<Simplify<LogLinkOutContext & TContext>>,
    duration: number,
  ): void;
  dispose?(
    operation: LinkOperation<Simplify<LogLinkOutContext & TContext>>,
    duration: number,
  ): void;
}

export type LogLinkOptions<TContext extends Context> = Thunkable<
  (operation: LinkOperation<TContext>) => LogLinkHandler<TContext> | false | void
>;

export function LogLink<TContext extends Context>(
  options?: LogLinkOptions<TContext>,
): Link<TContext, Simplify<LogLinkOutContext & TContext>> {
  if (!options) {
    // @ts-expect-error EMPTY_LINK is type-compatible here, and runtime behavior is unchanged.
    return EMPTY_LINK;
  }

  const getHandler = typeof options === "function" ? options : () => options;

  return (operation, next) => {
    const $operation = operation as LinkOperation<LogLinkOutContext & TContext>;

    if ($operation.context[LOG_LINK_CONTEXT]) {
      return next();
    }

    const handler = getHandler($operation);

    if (!handler) {
      return next();
    }

    const timing: LogLinkTiming = {};

    $operation.context[LOG_LINK_CONTEXT] = { timing };

    return iterator(async function* () {
      try {
        timing.start = performance.now();

        handler.start?.($operation);

        for await (const value of next()) {
          const last = timing.next || timing.start;

          timing.next = performance.now();

          handler.next?.($operation, duration(last, timing.next), value);

          yield value;
        }

        timing.complete = performance.now();

        handler.complete?.($operation, duration(timing.start, timing.complete));
      } catch (error) {
        timing.error = performance.now();

        handler.error?.($operation, duration(timing.start, timing.error), error);

        throw error;
      } finally {
        if (!timing.complete && !timing.error) {
          timing.dispose = performance.now();

          handler.dispose?.($operation, duration(timing.start, timing.dispose));
        }
      }
    });
  };
}

function duration(start?: number, stop?: number) {
  if (start && stop) {
    return stop - start;
  }

  return 0;
}
