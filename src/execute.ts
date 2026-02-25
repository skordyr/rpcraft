import type { Link, LinkOperation } from "./link";
import type { Thunkable } from "./shared/types";
import type { AnyCommand, Context, InferCommandOutput, InferCommandType } from "./types";

import { isSubscriptionCommand } from "./builder";
import { CommandError } from "./error";
import { promise, toPromise } from "./iterator";

export type ExecuteStreamResult<TCommand extends AnyCommand> = AsyncIteratorObject<
  InferCommandOutput<TCommand>
>;

export type ExecuteResult<TCommand extends AnyCommand> =
  InferCommandType<TCommand> extends "subscription"
    ? ExecuteStreamResult<TCommand>
    : Promise<InferCommandOutput<TCommand>>;

export type Execute<TContext extends Context> = Context extends TContext
  ? {
      <TCommand extends AnyCommand>(command: TCommand, context?: TContext): ExecuteResult<TCommand>;
      stream<TCommand extends AnyCommand>(
        command: TCommand,
        context?: TContext,
      ): ExecuteStreamResult<TCommand>;
    }
  : {
      <TCommand extends AnyCommand>(command: TCommand, context: TContext): ExecuteResult<TCommand>;
      stream<TCommand extends AnyCommand>(
        command: TCommand,
        context: TContext,
      ): ExecuteStreamResult<TCommand>;
    };

export interface ExecuteOptions<TContext extends Context> {
  link: Link<TContext, Context>;
  context?: Thunkable<(operation: LinkOperation<Partial<TContext>>) => Partial<TContext> | void>;
}

export function createExecute<TContext extends Context>(
  options: ExecuteOptions<TContext>,
): Execute<TContext> {
  const { link, context } = options;

  const getContext = context && typeof context === "function" ? context : () => context;

  async function* stream(command: AnyCommand, context: Context = {}) {
    const operation: LinkOperation<any> = {
      context,
      command,
    };

    try {
      const $context = getContext(operation);

      if ($context) {
        operation.context = {
          ...$context,
          ...operation.context,
        };
      }

      yield* link(operation, () => {
        return promise(() => {
          throw CommandError.from("INTERNAL_SERVER_ERROR", {
            message: "Cannot execute command: no link handled the operation.",
          });
        });
      });
    } catch (error) {
      const { context, command } = operation;

      throw CommandError.from(error, {
        code: "INTERNAL_SERVER_ERROR",
        context,
        command,
      });
    }
  }

  function execute(command: AnyCommand, context: Context = {}) {
    const result = stream(command, context);

    if (!isSubscriptionCommand(command)) {
      return toPromise(result);
    }

    return result;
  }

  execute.stream = stream;

  return execute as Execute<TContext>;
}
