import type { StandardSchemaV1 } from "@standard-schema/spec";

import type { Simplify } from "./shared/types";

export type Context = {
  [key: PropertyKey]: unknown;
};

export type Meta = {
  [key: string]: unknown;
};

export type CommandType = "query" | "mutation" | "subscription";

export type CommandName = string;

export type CommandSchema<TInput, TOutput, TError> = Simplify<{
  input?: StandardSchemaV1<unknown, TInput>;
  output?: StandardSchemaV1<unknown, TOutput>;
  error?: StandardSchemaV1<unknown, TError>;
}>;

export type Command<
  TType extends CommandType,
  TName extends CommandName,
  TMeta extends Meta,
  TInput,
  TOutput,
  TError,
> = Simplify<
  {
    type: TType;
    name: TName;
    meta: TMeta;
    schema?: CommandSchema<TInput, TOutput, TError>;
  } & ({ input: TInput } extends { input: never }
    ? { input?: never }
    : Extract<TInput, undefined> extends never
      ? { input: TInput }
      : { input?: TInput })
>;

export type CommandFactory<
  TType extends CommandType,
  TName extends CommandName,
  TMeta extends Meta,
  TInput,
  TOutput,
  TError,
> = Simplify<{
  readonly definition: {
    readonly type: TType;
    readonly name: TName;
    readonly meta: TMeta;
    readonly schema?: CommandSchema<TInput, TOutput, TError>;
  };
  create: { input: TInput } extends { input: never }
    ? () => Command<TType, TName, TMeta, TInput, TOutput, TError>
    : Extract<TInput, undefined> extends never
      ? (input: TInput) => Command<TType, TName, TMeta, TInput, TOutput, TError>
      : (input?: TInput) => Command<TType, TName, TMeta, TInput, TOutput, TError>;
}>;

export type AnyCommand = Command<any, any, any, any, any, any>;

export type AnyCommandFactory = CommandFactory<any, any, any, any, any, any>;

export type InferCommandType<TShape extends AnyCommand | AnyCommandFactory> =
  TShape extends Command<infer TType, any, any, any, any, any>
    ? TType
    : TShape extends CommandFactory<infer TType, any, any, any, any, any>
      ? TType
      : never;

export type InferCommandName<TShape extends AnyCommand | AnyCommandFactory> =
  TShape extends Command<any, infer TName, any, any, any, any>
    ? TName
    : TShape extends CommandFactory<any, infer TName, any, any, any, any>
      ? TName
      : never;

export type InferCommandMeta<TShape extends AnyCommand | AnyCommandFactory> =
  TShape extends Command<any, any, infer TMeta, any, any, any>
    ? TMeta
    : TShape extends CommandFactory<any, any, infer TMeta, any, any, any>
      ? TMeta
      : never;

export type InferCommandInput<TShape extends AnyCommand | AnyCommandFactory> =
  TShape extends Command<any, any, any, infer TInput, any, any>
    ? TInput
    : TShape extends CommandFactory<any, any, any, infer TInput, any, any>
      ? TInput
      : never;

export type InferCommandOutput<TShape extends AnyCommand | AnyCommandFactory> =
  TShape extends Command<any, any, any, any, infer TOutput, any>
    ? TOutput
    : TShape extends CommandFactory<any, any, any, any, infer TOutput, any>
      ? TOutput
      : never;

export type InferCommandError<TShape extends AnyCommand | AnyCommandFactory> =
  TShape extends Command<any, any, any, any, any, infer TError>
    ? TError
    : TShape extends CommandFactory<any, any, any, any, any, infer TError>
      ? TError
      : never;
