import type { AnyLink, Link, LinkNext, LinkOperation, LinkResult } from "./link";
import type {
  AnyCommand,
  AnyCommandFactory,
  Command,
  CommandFactory,
  CommandName,
  CommandType,
  Context,
  InferCommandError,
  InferCommandInput,
  InferCommandMeta,
  InferCommandName,
  InferCommandOutput,
  InferCommandType,
} from "./types";

import { pipe } from "./link";

export interface RouterHandler<TContext extends Context, TCommand extends AnyCommand> {
  (operation: LinkOperation<TContext, TCommand>): LinkResult<TContext, TCommand>;
}

export type RouterEntry<
  TContext extends Context = Context,
  TCommand extends AnyCommand = AnyCommand,
> = [
  factory: CommandFactory<
    InferCommandType<TCommand>,
    InferCommandName<TCommand>,
    InferCommandMeta<TCommand>,
    InferCommandInput<TCommand>,
    InferCommandOutput<TCommand>,
    InferCommandError<TCommand>
  >,
  link: Link<TContext, Context>,
];

export interface RouterRegistry {
  readonly entries: RouterEntry[];
  readonly query: Map<CommandName, RouterEntry>;
  readonly mutation: Map<CommandName, RouterEntry>;
  readonly subscription: Map<CommandName, RouterEntry>;
}

export interface Router<TInContext extends Context, TOutContext extends Context = TInContext> {
  readonly registry: RouterRegistry;

  create<
    TInContext$Create extends Context,
    TOutContext$Create extends Context = TInContext$Create,
  >(): Router<TInContext$Create, TOutContext$Create>;

  use<TOutContext$Use extends Context>(
    link: Link<TOutContext, TOutContext$Use>,
  ): Router<TInContext, TOutContext$Use>;

  handle<TFactory extends AnyCommandFactory>(
    factory: TFactory,
    handler: RouterHandler<
      TOutContext,
      Command<
        InferCommandType<TFactory>,
        InferCommandName<TFactory>,
        InferCommandMeta<TFactory>,
        InferCommandInput<TFactory>,
        InferCommandOutput<TFactory>,
        InferCommandError<TFactory>
      >
    >,
  ): this;

  match<TCommand extends AnyCommand>(
    operation: LinkOperation<TInContext, TCommand>,
  ): RouterEntry<TInContext, TCommand> | null;

  prepare<TCommand extends AnyCommand>(
    operation: LinkOperation<TInContext, TCommand>,
    entry?: RouterEntry<TInContext, TCommand> | null,
  ): LinkOperation<TInContext, TCommand>;

  resolve<TCommand extends AnyCommand>(
    operation: LinkOperation<TInContext, TCommand>,
    next: LinkNext<TInContext, TCommand>,
  ): LinkResult<TOutContext, TCommand>;
}

class Router$Router<
  TInContext extends Context,
  TOutContext extends Context = TInContext,
> implements Router<TInContext, TOutContext> {
  readonly registry: RouterRegistry;

  private _links: AnyLink[] = [];

  constructor(
    registry: RouterRegistry = {
      entries: [],
      query: new Map(),
      mutation: new Map(),
      subscription: new Map(),
    },
    links: AnyLink[] = [],
  ) {
    this.registry = registry;
    this._links = links;
  }

  create<
    TInContext$Create extends Context,
    TOutContext$Create extends Context = TInContext$Create,
  >(): Router<TInContext$Create, TOutContext$Create> {
    return new Router$Router<TInContext$Create, TOutContext$Create>();
  }

  use<TOutContext$Use extends Context>(
    link: Link<TOutContext, TOutContext$Use>,
  ): Router<TInContext, TOutContext$Use> {
    const links = [...this._links, link as AnyLink];

    return new Router$Router<TInContext, TOutContext$Use>(this.registry, links);
  }

  handle<TFactory extends AnyCommandFactory>(
    factory: TFactory,
    handler: RouterHandler<
      TOutContext,
      Command<
        InferCommandType<TFactory>,
        InferCommandName<TFactory>,
        InferCommandMeta<TFactory>,
        InferCommandInput<TFactory>,
        InferCommandOutput<TFactory>,
        InferCommandError<TFactory>
      >
    >,
  ): this {
    const type = factory.definition.type as CommandType;
    const name = factory.definition.name as CommandName;

    if (this.registry[type].has(name)) {
      throw new Error(`The command "${type}:${name}" is already handled.`);
    }

    const link = pipe(...this._links, handler as AnyLink);
    const entry = [factory, link] as RouterEntry;

    this.registry[type].set(name, entry);
    this.registry.entries.push(entry);

    return this;
  }

  match<TCommand extends AnyCommand>(
    operation: LinkOperation<TInContext, TCommand>,
  ): RouterEntry<TInContext, TCommand> | null {
    const type = operation.command.type as CommandType;
    const name = operation.command.name as CommandName;

    const entry = this.registry[type].get(name) as RouterEntry<TInContext, TCommand> | undefined;

    return entry || null;
  }

  prepare<TCommand extends AnyCommand>(
    operation: LinkOperation<TInContext, TCommand>,
    entry: RouterEntry<TInContext, TCommand> | null = this.match(operation),
  ): LinkOperation<TInContext, TCommand> {
    if (!entry) {
      return operation;
    }

    const [factory] = entry;

    if (operation.command.meta !== factory.definition.meta) {
      operation.command.meta = {
        ...operation.command.meta,
        ...factory.definition.meta,
      };
    }

    if (factory.definition.schema && operation.command.schema !== factory.definition.schema) {
      operation.command.schema = {
        ...operation.command.schema,
        ...factory.definition.schema,
      };
    }

    return operation;
  }

  resolve<TCommand extends AnyCommand>(
    operation: LinkOperation<TInContext, TCommand>,
    next: LinkNext<TInContext, TCommand>,
  ): LinkResult<TOutContext, TCommand> {
    const entry = this.match(operation);

    if (!entry) {
      // @ts-expect-error next() is type-compatible here, and runtime behavior is unchanged.
      return next() as LinkResult<TOutContext, TCommand>;
    }

    const [, link] = entry;

    return link(this.prepare(operation, entry), next) as LinkResult<TOutContext, TCommand>;
  }
}

export const router: Router<Context, Context> = /* @__PURE__ */ new Router$Router();
