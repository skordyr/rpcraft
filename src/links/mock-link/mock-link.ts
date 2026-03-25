import type { Link, LinkOperation } from "../../link";
import type { Router } from "../../router";
import type { Simplify, Thunkable } from "../../shared/types";
import type { Context } from "../../types";

import { EMPTY_LINK } from "../../link";

export const MOCK_LINK_CONTEXT: unique symbol = /* @__PURE__ */ Symbol("MockLinkContext");

export type MockLinkOutContext = {
  [MOCK_LINK_CONTEXT]?: {
    mocked?: boolean;
  };
};

export type MockLinkOptions<TContext extends Context> = Thunkable<
  (
    operation: LinkOperation<TContext>,
  ) =>
    | Router<Simplify<MockLinkOutContext & TContext>, Simplify<MockLinkOutContext & TContext>>
    | Router<Simplify<MockLinkOutContext & TContext>, Simplify<MockLinkOutContext & TContext>>[]
    | false
    | void
>;

export function MockLink<TContext extends Context>(
  options?: MockLinkOptions<TContext>,
): Link<TContext, Simplify<MockLinkOutContext & TContext>> {
  if (!options) {
    // @ts-expect-error EMPTY_LINK is type-compatible here, and runtime behavior is unchanged.
    return EMPTY_LINK as Link<TContext, Simplify<MockLinkOutContext & TContext>>;
  }

  const getRouter = typeof options === "function" ? options : () => options;

  return (operation, next) => {
    const $operation = operation as LinkOperation<MockLinkOutContext & TContext>;

    if ($operation.context[MOCK_LINK_CONTEXT]?.mocked) {
      return next();
    }

    const router = getRouter($operation);

    if (!router) {
      return next();
    }

    const routers = Array.isArray(router) ? router : [router];

    for (const router of routers) {
      const entry = router.match($operation);

      if (entry) {
        const [factory] = entry;

        if (factory.definition.meta === $operation.command.meta) {
          $operation.context[MOCK_LINK_CONTEXT] = { mocked: true };

          return router.resolve($operation, next);
        }
      }
    }

    return next();
  };
}
