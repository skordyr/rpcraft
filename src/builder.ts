import type {
  AnyCommand,
  Command,
  CommandFactory,
  Meta,
  CommandSchema,
  CommandType,
  CommandName,
} from "./types";

import { EMPTY_OBJECT } from "./shared/utils";

export interface Builder$Build<
  TType extends CommandType,
  TName extends CommandName,
  TMeta extends Meta,
  TInput,
  TOutput,
  TError,
> {
  build(): CommandFactory<TType, TName, TMeta, TInput, TOutput, TError>;
}

export interface Builder$Schema<
  TType extends CommandType,
  TName extends CommandName,
  TMeta extends Meta,
> {
  schema<TInput$Schema = never, TOutput$Schema = unknown, TError$Schema = unknown>(
    schema?: CommandSchema<TInput$Schema, TOutput$Schema, TError$Schema>,
  ): Builder$Build<TType, TName, TMeta, TInput$Schema, TOutput$Schema, TError$Schema>;
}

export interface Builder$Type<TType extends CommandType, TMeta extends Meta> {
  <TName$Type extends CommandName, TMeta$Type extends TMeta>(
    name: TName$Type,
    meta: TMeta$Type,
  ): Builder$Schema<TType, TName$Type, TMeta$Type>;
}

export interface Builder$Create {
  <TMeta$Create extends Meta>(): Builder<TMeta$Create>;
}

export interface Builder<TMeta extends Meta> {
  create: Builder$Create;
  query: Builder$Type<"query", TMeta>;
  mutation: Builder$Type<"mutation", TMeta>;
  subscription: Builder$Type<"subscription", TMeta>;
}

class Builder$Factory<
  TType extends CommandType,
  TName extends CommandName,
  TMeta extends Meta,
  TInput,
  TOutput,
  TError,
> implements CommandFactory<TType, TName, TMeta, TInput, TOutput, TError> {
  readonly definition: CommandFactory<TType, TName, TMeta, TInput, TOutput, TError>["definition"];

  constructor(
    definition: CommandFactory<TType, TName, TMeta, TInput, TOutput, TError>["definition"],
  ) {
    this.definition = definition;
  }

  create(input?: any): Command<TType, TName, TMeta, TInput, TOutput, TError> {
    const { type, name, meta, schema } = this.definition;

    return {
      type,
      name,
      meta,
      schema,
      input,
    } as Command<TType, TName, TMeta, TInput, TOutput, TError>;
  }
}

const create: Builder$Create = () => {
  let $definition: Partial<Pick<AnyCommand, "type" | "name" | "meta" | "schema">> = EMPTY_OBJECT;

  const $build: Builder$Build<any, any, any, any, any, any> = {
    build() {
      const { type, name, meta } = $definition;

      if (type === undefined) {
        throw new Error(
          "Cannot build command: missing type. Start with query(...), mutation(...), or subscription(...).",
        );
      }

      if (name === undefined) {
        throw new Error(
          "Cannot build command: missing name. Pass name as the first argument to query(...), mutation(...), or subscription(...), then call build().",
        );
      }

      if (meta === undefined) {
        throw new Error(
          "Cannot build command: missing meta. Pass meta as the second argument to query(...), mutation(...), or subscription(...), then call build().",
        );
      }

      const factory = new Builder$Factory(
        $definition as CommandFactory<any, any, any, any, any, any>["definition"],
      );

      $definition = EMPTY_OBJECT;

      return factory;
    },
  };

  const $schema: Builder$Schema<any, any, any> = {
    schema(schema) {
      if ($definition === EMPTY_OBJECT) {
        throw new Error(
          "Cannot set schema: no active chain. Start with query(...), mutation(...), or subscription(...) first.",
        );
      }

      $definition.schema = schema;

      return $build;
    },
  };

  const $type: (type: CommandType) => Builder$Type<any, any> = (type) => (name, meta) => {
    if ($definition !== EMPTY_OBJECT) {
      throw new Error(
        "Cannot start a new chain: the current chain is not finished. Call build() or schema(...).build() first.",
      );
    }

    $definition = {
      type,
      name,
      meta,
    };

    return $schema;
  };

  return {
    create,
    query: $type("query"),
    mutation: $type("mutation"),
    subscription: $type("subscription"),
  };
};

export const builder: Builder<Meta> = /* @__PURE__ */ create<Meta>();

export function isQueryCommand(
  target: unknown,
): target is Command<"query", any, any, any, any, any> {
  const candidate = target as Command<"query", any, any, any, any, any>;

  return Boolean(candidate && candidate.type === "query");
}

export function isMutationCommand(
  target: unknown,
): target is Command<"mutation", any, any, any, any, any> {
  const candidate = target as Command<"mutation", any, any, any, any, any>;

  return Boolean(candidate && candidate.type === "mutation");
}

export function isSubscriptionCommand(
  target: unknown,
): target is Command<"subscription", any, any, any, any, any> {
  const candidate = target as Command<"subscription", any, any, any, any, any>;

  return Boolean(candidate && candidate.type === "subscription");
}
