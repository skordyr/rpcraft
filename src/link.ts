import type { AnyCommand, Context, InferCommandOutput } from "./types";

export interface LinkOperation<TContext extends Context, TCommand extends AnyCommand = AnyCommand> {
  context: TContext;
  command: TCommand;
}

export interface LinkResult<
  TContext extends Context,
  TCommand extends AnyCommand = AnyCommand,
> extends AsyncIteratorObject<InferCommandOutput<TCommand>> {
  readonly $$context?: TContext;
}

export interface LinkNext<TContext extends Context, TCommand extends AnyCommand = AnyCommand> {
  (): LinkResult<TContext, TCommand>;
  <TOutContext extends Context>(context: TOutContext): LinkResult<TOutContext, TCommand>;
}

export interface Link<TInContext extends Context, TOutContext extends Context = TInContext> {
  <TCommand extends AnyCommand>(
    operation: LinkOperation<TInContext, TCommand>,
    next: LinkNext<TInContext, TCommand>,
  ): LinkResult<TOutContext, TCommand>;
}

export type AnyLink = Link<any, any>;

export type InferLinkInContext<TLink extends AnyLink> =
  TLink extends Link<infer TInContext, any> ? TInContext : never;

export type InferLinkOutContext<TLink extends AnyLink> =
  TLink extends Link<any, infer TOutContext> ? TOutContext : never;

export const EMPTY_LINK: Link<Context, Context> = (_, next) => {
  return next();
};

export function branch<TInContext extends Context, TOutContext extends Context>(
  factory: (operation: LinkOperation<TInContext>) => Link<TInContext, TOutContext>,
): Link<TInContext, TOutContext>;
export function branch<TInContext extends Context, TOutContext extends Context>(
  factory: (operation: LinkOperation<TInContext>) => Link<TInContext, TOutContext> | void,
): Link<TInContext, TInContext | TOutContext>;
export function branch(
  factory: (operation: LinkOperation<Context>) => Link<Context, Context> | void,
): Link<Context, Context> {
  return (operation, next) => {
    const link = factory(operation);

    if (link) {
      return link(operation, next);
    }

    return next();
  };
}

export function pipe<TInContext extends Context, TOutContext0 extends Context>(
  link0: Link<TInContext, TOutContext0>,
): Link<TInContext, TOutContext0>;
export function pipe<
  TInContext extends Context,
  TOutContext0 extends Context,
  TOutContext1 extends Context,
>(
  link0: Link<TInContext, TOutContext0>,
  link1: Link<TOutContext0, TOutContext1>,
): Link<TInContext, TOutContext1>;
export function pipe<
  TInContext extends Context,
  TOutContext0 extends Context,
  TOutContext1 extends Context,
  TOutContext2 extends Context,
>(
  link0: Link<TInContext, TOutContext0>,
  link1: Link<TOutContext0, TOutContext1>,
  link2: Link<TOutContext1, TOutContext2>,
): Link<TInContext, TOutContext2>;
export function pipe<
  TInContext extends Context,
  TOutContext0 extends Context,
  TOutContext1 extends Context,
  TOutContext2 extends Context,
  TOutContext3 extends Context,
>(
  link0: Link<TInContext, TOutContext0>,
  link1: Link<TOutContext0, TOutContext1>,
  link2: Link<TOutContext1, TOutContext2>,
  link3: Link<TOutContext2, TOutContext3>,
): Link<TInContext, TOutContext3>;
export function pipe<
  TInContext extends Context,
  TOutContext0 extends Context,
  TOutContext1 extends Context,
  TOutContext2 extends Context,
  TOutContext3 extends Context,
  TOutContext4 extends Context,
>(
  link0: Link<TInContext, TOutContext0>,
  link1: Link<TOutContext0, TOutContext1>,
  link2: Link<TOutContext1, TOutContext2>,
  link3: Link<TOutContext2, TOutContext3>,
  link4: Link<TOutContext3, TOutContext4>,
): Link<TInContext, TOutContext4>;
export function pipe<
  TInContext extends Context,
  TOutContext0 extends Context,
  TOutContext1 extends Context,
  TOutContext2 extends Context,
  TOutContext3 extends Context,
  TOutContext4 extends Context,
  TOutContext5 extends Context,
>(
  link0: Link<TInContext, TOutContext0>,
  link1: Link<TOutContext0, TOutContext1>,
  link2: Link<TOutContext1, TOutContext2>,
  link3: Link<TOutContext2, TOutContext3>,
  link4: Link<TOutContext3, TOutContext4>,
  link5: Link<TOutContext4, TOutContext5>,
): Link<TInContext, TOutContext5>;
export function pipe<
  TInContext extends Context,
  TOutContext0 extends Context,
  TOutContext1 extends Context,
  TOutContext2 extends Context,
  TOutContext3 extends Context,
  TOutContext4 extends Context,
  TOutContext5 extends Context,
  TOutContext6 extends Context,
>(
  link0: Link<TInContext, TOutContext0>,
  link1: Link<TOutContext0, TOutContext1>,
  link2: Link<TOutContext1, TOutContext2>,
  link3: Link<TOutContext2, TOutContext3>,
  link4: Link<TOutContext3, TOutContext4>,
  link5: Link<TOutContext4, TOutContext5>,
  link6: Link<TOutContext5, TOutContext6>,
): Link<TInContext, TOutContext6>;
export function pipe<
  TInContext extends Context,
  TOutContext0 extends Context,
  TOutContext1 extends Context,
  TOutContext2 extends Context,
  TOutContext3 extends Context,
  TOutContext4 extends Context,
  TOutContext5 extends Context,
  TOutContext6 extends Context,
  TOutContext7 extends Context,
>(
  link0: Link<TInContext, TOutContext0>,
  link1: Link<TOutContext0, TOutContext1>,
  link2: Link<TOutContext1, TOutContext2>,
  link3: Link<TOutContext2, TOutContext3>,
  link4: Link<TOutContext3, TOutContext4>,
  link5: Link<TOutContext4, TOutContext5>,
  link6: Link<TOutContext5, TOutContext6>,
  link7: Link<TOutContext6, TOutContext7>,
): Link<TInContext, TOutContext7>;
export function pipe<
  TInContext extends Context,
  TOutContext0 extends Context,
  TOutContext1 extends Context,
  TOutContext2 extends Context,
  TOutContext3 extends Context,
  TOutContext4 extends Context,
  TOutContext5 extends Context,
  TOutContext6 extends Context,
  TOutContext7 extends Context,
  TOutContext8 extends Context,
>(
  link0: Link<TInContext, TOutContext0>,
  link1: Link<TOutContext0, TOutContext1>,
  link2: Link<TOutContext1, TOutContext2>,
  link3: Link<TOutContext2, TOutContext3>,
  link4: Link<TOutContext3, TOutContext4>,
  link5: Link<TOutContext4, TOutContext5>,
  link6: Link<TOutContext5, TOutContext6>,
  link7: Link<TOutContext6, TOutContext7>,
  link8: Link<TOutContext7, TOutContext8>,
): Link<TInContext, TOutContext8>;
export function pipe<
  TInContext extends Context,
  TOutContext0 extends Context,
  TOutContext1 extends Context,
  TOutContext2 extends Context,
  TOutContext3 extends Context,
  TOutContext4 extends Context,
  TOutContext5 extends Context,
  TOutContext6 extends Context,
  TOutContext7 extends Context,
  TOutContext8 extends Context,
  TOutContext9 extends Context,
>(
  link0: Link<TInContext, TOutContext0>,
  link1: Link<TOutContext0, TOutContext1>,
  link2: Link<TOutContext1, TOutContext2>,
  link3: Link<TOutContext2, TOutContext3>,
  link4: Link<TOutContext3, TOutContext4>,
  link5: Link<TOutContext4, TOutContext5>,
  link6: Link<TOutContext5, TOutContext6>,
  link7: Link<TOutContext6, TOutContext7>,
  link8: Link<TOutContext7, TOutContext8>,
  link9: Link<TOutContext8, TOutContext9>,
): Link<TInContext, TOutContext9>;
export function pipe<
  TInContext extends Context,
  TOutContext0 extends Context,
  TOutContext1 extends Context,
  TOutContext2 extends Context,
  TOutContext3 extends Context,
  TOutContext4 extends Context,
  TOutContext5 extends Context,
  TOutContext6 extends Context,
  TOutContext7 extends Context,
  TOutContext8 extends Context,
  TOutContext9 extends Context,
  TOutContext10 extends Context,
>(
  link0: Link<TInContext, TOutContext0>,
  link1: Link<TOutContext0, TOutContext1>,
  link2: Link<TOutContext1, TOutContext2>,
  link3: Link<TOutContext2, TOutContext3>,
  link4: Link<TOutContext3, TOutContext4>,
  link5: Link<TOutContext4, TOutContext5>,
  link6: Link<TOutContext5, TOutContext6>,
  link7: Link<TOutContext6, TOutContext7>,
  link8: Link<TOutContext7, TOutContext8>,
  link9: Link<TOutContext8, TOutContext9>,
  link10: Link<TOutContext9, TOutContext10>,
): Link<TInContext, TOutContext10>;
export function pipe<
  TInContext extends Context,
  TOutContext0 extends Context,
  TOutContext1 extends Context,
  TOutContext2 extends Context,
  TOutContext3 extends Context,
  TOutContext4 extends Context,
  TOutContext5 extends Context,
  TOutContext6 extends Context,
  TOutContext7 extends Context,
  TOutContext8 extends Context,
  TOutContext9 extends Context,
  TOutContext10 extends Context,
  TOutContext11 extends Context,
>(
  link0: Link<TInContext, TOutContext0>,
  link1: Link<TOutContext0, TOutContext1>,
  link2: Link<TOutContext1, TOutContext2>,
  link3: Link<TOutContext2, TOutContext3>,
  link4: Link<TOutContext3, TOutContext4>,
  link5: Link<TOutContext4, TOutContext5>,
  link6: Link<TOutContext5, TOutContext6>,
  link7: Link<TOutContext6, TOutContext7>,
  link8: Link<TOutContext7, TOutContext8>,
  link9: Link<TOutContext8, TOutContext9>,
  link10: Link<TOutContext9, TOutContext10>,
  link11: Link<TOutContext10, TOutContext11>,
): Link<TInContext, TOutContext11>;
export function pipe<
  TInContext extends Context,
  TOutContext0 extends Context,
  TOutContext1 extends Context,
  TOutContext2 extends Context,
  TOutContext3 extends Context,
  TOutContext4 extends Context,
  TOutContext5 extends Context,
  TOutContext6 extends Context,
  TOutContext7 extends Context,
  TOutContext8 extends Context,
  TOutContext9 extends Context,
  TOutContext10 extends Context,
  TOutContext11 extends Context,
  TOutContext12 extends Context,
>(
  link0: Link<TInContext, TOutContext0>,
  link1: Link<TOutContext0, TOutContext1>,
  link2: Link<TOutContext1, TOutContext2>,
  link3: Link<TOutContext2, TOutContext3>,
  link4: Link<TOutContext3, TOutContext4>,
  link5: Link<TOutContext4, TOutContext5>,
  link6: Link<TOutContext5, TOutContext6>,
  link7: Link<TOutContext6, TOutContext7>,
  link8: Link<TOutContext7, TOutContext8>,
  link9: Link<TOutContext8, TOutContext9>,
  link10: Link<TOutContext9, TOutContext10>,
  link11: Link<TOutContext10, TOutContext11>,
  link12: Link<TOutContext11, TOutContext12>,
): Link<TInContext, TOutContext12>;
export function pipe<
  TInContext extends Context,
  TOutContext0 extends Context,
  TOutContext1 extends Context,
  TOutContext2 extends Context,
  TOutContext3 extends Context,
  TOutContext4 extends Context,
  TOutContext5 extends Context,
  TOutContext6 extends Context,
  TOutContext7 extends Context,
  TOutContext8 extends Context,
  TOutContext9 extends Context,
  TOutContext10 extends Context,
  TOutContext11 extends Context,
  TOutContext12 extends Context,
  TOutContext13 extends Context,
>(
  link0: Link<TInContext, TOutContext0>,
  link1: Link<TOutContext0, TOutContext1>,
  link2: Link<TOutContext1, TOutContext2>,
  link3: Link<TOutContext2, TOutContext3>,
  link4: Link<TOutContext3, TOutContext4>,
  link5: Link<TOutContext4, TOutContext5>,
  link6: Link<TOutContext5, TOutContext6>,
  link7: Link<TOutContext6, TOutContext7>,
  link8: Link<TOutContext7, TOutContext8>,
  link9: Link<TOutContext8, TOutContext9>,
  link10: Link<TOutContext9, TOutContext10>,
  link11: Link<TOutContext10, TOutContext11>,
  link12: Link<TOutContext11, TOutContext12>,
  link13: Link<TOutContext12, TOutContext13>,
): Link<TInContext, TOutContext13>;
export function pipe<
  TInContext extends Context,
  TOutContext0 extends Context,
  TOutContext1 extends Context,
  TOutContext2 extends Context,
  TOutContext3 extends Context,
  TOutContext4 extends Context,
  TOutContext5 extends Context,
  TOutContext6 extends Context,
  TOutContext7 extends Context,
  TOutContext8 extends Context,
  TOutContext9 extends Context,
  TOutContext10 extends Context,
  TOutContext11 extends Context,
  TOutContext12 extends Context,
  TOutContext13 extends Context,
  TOutContext14 extends Context,
>(
  link0: Link<TInContext, TOutContext0>,
  link1: Link<TOutContext0, TOutContext1>,
  link2: Link<TOutContext1, TOutContext2>,
  link3: Link<TOutContext2, TOutContext3>,
  link4: Link<TOutContext3, TOutContext4>,
  link5: Link<TOutContext4, TOutContext5>,
  link6: Link<TOutContext5, TOutContext6>,
  link7: Link<TOutContext6, TOutContext7>,
  link8: Link<TOutContext7, TOutContext8>,
  link9: Link<TOutContext8, TOutContext9>,
  link10: Link<TOutContext9, TOutContext10>,
  link11: Link<TOutContext10, TOutContext11>,
  link12: Link<TOutContext11, TOutContext12>,
  link13: Link<TOutContext12, TOutContext13>,
  link14: Link<TOutContext13, TOutContext14>,
): Link<TInContext, TOutContext14>;
export function pipe<
  TInContext extends Context,
  TOutContext0 extends Context,
  TOutContext1 extends Context,
  TOutContext2 extends Context,
  TOutContext3 extends Context,
  TOutContext4 extends Context,
  TOutContext5 extends Context,
  TOutContext6 extends Context,
  TOutContext7 extends Context,
  TOutContext8 extends Context,
  TOutContext9 extends Context,
  TOutContext10 extends Context,
  TOutContext11 extends Context,
  TOutContext12 extends Context,
  TOutContext13 extends Context,
  TOutContext14 extends Context,
  TOutContext15 extends Context,
>(
  link0: Link<TInContext, TOutContext0>,
  link1: Link<TOutContext0, TOutContext1>,
  link2: Link<TOutContext1, TOutContext2>,
  link3: Link<TOutContext2, TOutContext3>,
  link4: Link<TOutContext3, TOutContext4>,
  link5: Link<TOutContext4, TOutContext5>,
  link6: Link<TOutContext5, TOutContext6>,
  link7: Link<TOutContext6, TOutContext7>,
  link8: Link<TOutContext7, TOutContext8>,
  link9: Link<TOutContext8, TOutContext9>,
  link10: Link<TOutContext9, TOutContext10>,
  link11: Link<TOutContext10, TOutContext11>,
  link12: Link<TOutContext11, TOutContext12>,
  link13: Link<TOutContext12, TOutContext13>,
  link14: Link<TOutContext13, TOutContext14>,
  link15: Link<TOutContext14, TOutContext15>,
): Link<TInContext, TOutContext15>;
export function pipe<
  TInContext extends Context,
  TOutContext0 extends Context,
  TOutContext1 extends Context,
  TOutContext2 extends Context,
  TOutContext3 extends Context,
  TOutContext4 extends Context,
  TOutContext5 extends Context,
  TOutContext6 extends Context,
  TOutContext7 extends Context,
  TOutContext8 extends Context,
  TOutContext9 extends Context,
  TOutContext10 extends Context,
  TOutContext11 extends Context,
  TOutContext12 extends Context,
  TOutContext13 extends Context,
  TOutContext14 extends Context,
  TOutContext15 extends Context,
  TOutContext16 extends Context,
>(
  link0: Link<TInContext, TOutContext0>,
  link1: Link<TOutContext0, TOutContext1>,
  link2: Link<TOutContext1, TOutContext2>,
  link3: Link<TOutContext2, TOutContext3>,
  link4: Link<TOutContext3, TOutContext4>,
  link5: Link<TOutContext4, TOutContext5>,
  link6: Link<TOutContext5, TOutContext6>,
  link7: Link<TOutContext6, TOutContext7>,
  link8: Link<TOutContext7, TOutContext8>,
  link9: Link<TOutContext8, TOutContext9>,
  link10: Link<TOutContext9, TOutContext10>,
  link11: Link<TOutContext10, TOutContext11>,
  link12: Link<TOutContext11, TOutContext12>,
  link13: Link<TOutContext12, TOutContext13>,
  link14: Link<TOutContext13, TOutContext14>,
  link15: Link<TOutContext14, TOutContext15>,
  link16: Link<TOutContext15, TOutContext16>,
): Link<TInContext, TOutContext16>;
export function pipe<
  TInContext extends Context,
  TOutContext0 extends Context,
  TOutContext1 extends Context,
  TOutContext2 extends Context,
  TOutContext3 extends Context,
  TOutContext4 extends Context,
  TOutContext5 extends Context,
  TOutContext6 extends Context,
  TOutContext7 extends Context,
  TOutContext8 extends Context,
  TOutContext9 extends Context,
  TOutContext10 extends Context,
  TOutContext11 extends Context,
  TOutContext12 extends Context,
  TOutContext13 extends Context,
  TOutContext14 extends Context,
  TOutContext15 extends Context,
  TOutContext16 extends Context,
  TOutContext17 extends Context,
>(
  link0: Link<TInContext, TOutContext0>,
  link1: Link<TOutContext0, TOutContext1>,
  link2: Link<TOutContext1, TOutContext2>,
  link3: Link<TOutContext2, TOutContext3>,
  link4: Link<TOutContext3, TOutContext4>,
  link5: Link<TOutContext4, TOutContext5>,
  link6: Link<TOutContext5, TOutContext6>,
  link7: Link<TOutContext6, TOutContext7>,
  link8: Link<TOutContext7, TOutContext8>,
  link9: Link<TOutContext8, TOutContext9>,
  link10: Link<TOutContext9, TOutContext10>,
  link11: Link<TOutContext10, TOutContext11>,
  link12: Link<TOutContext11, TOutContext12>,
  link13: Link<TOutContext12, TOutContext13>,
  link14: Link<TOutContext13, TOutContext14>,
  link15: Link<TOutContext14, TOutContext15>,
  link16: Link<TOutContext15, TOutContext16>,
  link17: Link<TOutContext16, TOutContext17>,
): Link<TInContext, TOutContext17>;
export function pipe<
  TInContext extends Context,
  TOutContext0 extends Context,
  TOutContext1 extends Context,
  TOutContext2 extends Context,
  TOutContext3 extends Context,
  TOutContext4 extends Context,
  TOutContext5 extends Context,
  TOutContext6 extends Context,
  TOutContext7 extends Context,
  TOutContext8 extends Context,
  TOutContext9 extends Context,
  TOutContext10 extends Context,
  TOutContext11 extends Context,
  TOutContext12 extends Context,
  TOutContext13 extends Context,
  TOutContext14 extends Context,
  TOutContext15 extends Context,
  TOutContext16 extends Context,
  TOutContext17 extends Context,
  TOutContext18 extends Context,
>(
  link0: Link<TInContext, TOutContext0>,
  link1: Link<TOutContext0, TOutContext1>,
  link2: Link<TOutContext1, TOutContext2>,
  link3: Link<TOutContext2, TOutContext3>,
  link4: Link<TOutContext3, TOutContext4>,
  link5: Link<TOutContext4, TOutContext5>,
  link6: Link<TOutContext5, TOutContext6>,
  link7: Link<TOutContext6, TOutContext7>,
  link8: Link<TOutContext7, TOutContext8>,
  link9: Link<TOutContext8, TOutContext9>,
  link10: Link<TOutContext9, TOutContext10>,
  link11: Link<TOutContext10, TOutContext11>,
  link12: Link<TOutContext11, TOutContext12>,
  link13: Link<TOutContext12, TOutContext13>,
  link14: Link<TOutContext13, TOutContext14>,
  link15: Link<TOutContext14, TOutContext15>,
  link16: Link<TOutContext15, TOutContext16>,
  link17: Link<TOutContext16, TOutContext17>,
  link18: Link<TOutContext17, TOutContext18>,
): Link<TInContext, TOutContext18>;
export function pipe<
  TInContext extends Context,
  TOutContext0 extends Context,
  TOutContext1 extends Context,
  TOutContext2 extends Context,
  TOutContext3 extends Context,
  TOutContext4 extends Context,
  TOutContext5 extends Context,
  TOutContext6 extends Context,
  TOutContext7 extends Context,
  TOutContext8 extends Context,
  TOutContext9 extends Context,
  TOutContext10 extends Context,
  TOutContext11 extends Context,
  TOutContext12 extends Context,
  TOutContext13 extends Context,
  TOutContext14 extends Context,
  TOutContext15 extends Context,
  TOutContext16 extends Context,
  TOutContext17 extends Context,
  TOutContext18 extends Context,
  TOutContext19 extends Context,
>(
  link0: Link<TInContext, TOutContext0>,
  link1: Link<TOutContext0, TOutContext1>,
  link2: Link<TOutContext1, TOutContext2>,
  link3: Link<TOutContext2, TOutContext3>,
  link4: Link<TOutContext3, TOutContext4>,
  link5: Link<TOutContext4, TOutContext5>,
  link6: Link<TOutContext5, TOutContext6>,
  link7: Link<TOutContext6, TOutContext7>,
  link8: Link<TOutContext7, TOutContext8>,
  link9: Link<TOutContext8, TOutContext9>,
  link10: Link<TOutContext9, TOutContext10>,
  link11: Link<TOutContext10, TOutContext11>,
  link12: Link<TOutContext11, TOutContext12>,
  link13: Link<TOutContext12, TOutContext13>,
  link14: Link<TOutContext13, TOutContext14>,
  link15: Link<TOutContext14, TOutContext15>,
  link16: Link<TOutContext15, TOutContext16>,
  link17: Link<TOutContext16, TOutContext17>,
  link18: Link<TOutContext17, TOutContext18>,
  link19: Link<TOutContext18, TOutContext19>,
): Link<TInContext, TOutContext19>;
export function pipe<TInContext extends Context, TOutContext extends Context>(
  ...links: Link<TInContext, TOutContext>[]
): Link<TInContext, TOutContext>;
export function pipe(...links: AnyLink[]): AnyLink {
  if (links.length > 1) {
    return (operation, next) => {
      const execute = (index: number): LinkResult<Context> => {
        const link = links[index];

        if (link) {
          return link(operation, (context?: Context) => {
            if (context) {
              operation.context = context;
            }

            return execute(index + 1);
          });
        }

        return next();
      };

      return execute(0);
    };
  }

  if (links.length === 1) {
    return links[0];
  }

  return EMPTY_LINK;
}
