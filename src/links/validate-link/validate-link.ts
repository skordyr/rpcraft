import type { Link, LinkOperation } from "../../link";
import type { Simplify, Thunkable } from "../../shared/types";
import type { Context } from "../../types";

import { CommandError, isCommandError } from "../../error";
import { iterator } from "../../iterator";
import { EMPTY_LINK } from "../../link";
import { EMPTY_OBJECT } from "../../shared/utils";

export const VALIDATE_LINK_CONTEXT: unique symbol = /* @__PURE__ */ Symbol("ValidateLinkContext");

export type ValidateOutLinkContext = {
  [VALIDATE_LINK_CONTEXT]?: {
    validated: boolean;
  };
};

export interface ValidateLinkEnabled {
  input?: boolean;
  output?: boolean;
  error?: boolean;
}

export type ValidateLinkOptions<TContext extends Context> = Thunkable<
  (operation: LinkOperation<TContext>) => ValidateLinkEnabled | false | void
>;

export function ValidateLink<TContext extends Context>(
  options: ValidateLinkOptions<TContext> = EMPTY_OBJECT,
): Link<TContext, Simplify<ValidateOutLinkContext & TContext>> {
  if (!options) {
    // @ts-expect-error EMPTY_LINK is type-compatible here, and runtime behavior is unchanged.
    return EMPTY_LINK as Link<TContext, Simplify<ValidateOutLinkContext & TContext>>;
  }

  const getEnabled = typeof options === "function" ? options : () => options;

  return (operation, next) => {
    const $operation = operation as LinkOperation<ValidateOutLinkContext & TContext>;

    if (!$operation.command.schema || $operation.context[VALIDATE_LINK_CONTEXT]?.validated) {
      return next();
    }

    const enabled = getEnabled($operation);

    if (!enabled) {
      return next();
    }

    $operation.context[VALIDATE_LINK_CONTEXT] = { validated: true };

    return iterator(async function* () {
      const {
        input: inputEnabled = true,
        output: outputEnabled = true,
        error: errorEnabled = true,
      } = enabled;

      const { command } = $operation;

      if (inputEnabled && command.schema?.input) {
        const result = await command.schema.input["~standard"].validate(command.input);

        if (result.issues) {
          const { issues } = result;

          throw CommandError.from("BAD_REQUEST", {
            message: "The command input is invalid.",
            cause: {
              issues,
            },
          });
        }

        command.input = result.value;
      }

      try {
        if (outputEnabled && command.schema?.output) {
          for await (const value of next()) {
            const result = await command.schema.output["~standard"].validate(value);

            if (result.issues) {
              const { issues } = result;

              throw CommandError.from("INTERNAL_SERVER_ERROR", {
                message: "The command output is invalid.",
                cause: {
                  issues,
                },
              });
            }

            yield result.value;
          }

          return;
        }

        yield* next();
      } catch (error) {
        if (errorEnabled && command.schema?.error && isCommandError(error) && error.data) {
          const result = await command.schema.error["~standard"].validate(error.data);

          if (result.issues) {
            const { issues } = result;

            throw CommandError.from("INTERNAL_SERVER_ERROR", {
              message: "The command error is invalid.",
              cause: {
                error,
                issues,
              },
            });
          }

          error.data = result.value;

          throw error;
        }

        throw error;
      }
    });
  };
}
