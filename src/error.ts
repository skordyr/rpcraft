import type { AnyCommand, AnyCommandFactory, Context, InferCommandError } from "./types";

import { EMPTY_OBJECT, isErrorLike } from "./shared/utils";

export const COMMAND_KNOWN_ERROR_DEFINITION = {
  BAD_REQUEST: {
    status: 400,
    message: "Bad Request" as string,
  },
  UNAUTHORIZED: {
    status: 401,
    message: "Unauthorized" as string,
  },
  FORBIDDEN: {
    status: 403,
    message: "Forbidden" as string,
  },
  NOT_FOUND: {
    status: 404,
    message: "Not Found" as string,
  },
  METHOD_NOT_SUPPORTED: {
    status: 405,
    message: "Method Not Supported" as string,
  },
  NOT_ACCEPTABLE: {
    status: 406,
    message: "Not Acceptable" as string,
  },
  TIMEOUT: {
    status: 408,
    message: "Request Timeout" as string,
  },
  CONFLICT: {
    status: 409,
    message: "Conflict" as string,
  },
  PRECONDITION_FAILED: {
    status: 412,
    message: "Precondition Failed" as string,
  },
  PAYLOAD_TOO_LARGE: {
    status: 413,
    message: "Payload Too Large" as string,
  },
  UNSUPPORTED_MEDIA_TYPE: {
    status: 415,
    message: "Unsupported Media Type" as string,
  },
  UNPROCESSABLE_CONTENT: {
    status: 422,
    message: "Unprocessable Content" as string,
  },
  TOO_MANY_REQUESTS: {
    status: 429,
    message: "Too Many Requests" as string,
  },
  CLIENT_CLOSED_REQUEST: {
    status: 499,
    message: "Client Closed Request" as string,
  },

  INTERNAL_SERVER_ERROR: {
    status: 500,
    message: "Internal Server Error" as string,
  },
  NOT_IMPLEMENTED: {
    status: 501,
    message: "Not Implemented" as string,
  },
  BAD_GATEWAY: {
    status: 502,
    message: "Bad Gateway" as string,
  },
  SERVICE_UNAVAILABLE: {
    status: 503,
    message: "Service Unavailable" as string,
  },
  GATEWAY_TIMEOUT: {
    status: 504,
    message: "Gateway Timeout" as string,
  },
} as const;

export type CommandKnownErrorCode = keyof typeof COMMAND_KNOWN_ERROR_DEFINITION;

export type CommandErrorCode = CommandKnownErrorCode | (string & {});

export interface CommandErrorOptions<TData> {
  code?: CommandErrorCode;
  message?: string;
  data?: TData;
  context?: Context;
  command?: AnyCommand;
  cause?: unknown;
}

export class CommandError<TData> extends Error {
  readonly name = "CommandError";

  readonly code: CommandErrorCode;

  context?: Context;

  command?: AnyCommand;

  data?: TData;

  static from<TData>(
    code: CommandKnownErrorCode,
    options?: Omit<CommandErrorOptions<TData>, "code">,
  ): CommandError<TData>;
  static from<TData>(
    cause?: unknown,
    options?: Partial<CommandErrorOptions<TData>>,
  ): CommandError<TData>;
  static from<TData>(
    maybeCode: unknown,
    options: Partial<CommandErrorOptions<TData>> = EMPTY_OBJECT,
  ) {
    if (isCommandKnownErrorCode(maybeCode)) {
      const code = maybeCode;

      return new CommandError({
        ...options,
        code,
      });
    }

    const cause = maybeCode;

    if (typeof cause === "string") {
      return new CommandError({
        ...options,
        message: cause || options.message,
      });
    }

    if (isCommandError(cause)) {
      const { context, command } = options;

      if (context) {
        cause.context = context;
      }

      if (command) {
        cause.command = command;
      }

      return cause;
    }

    if (isErrorLike(cause)) {
      return new CommandError({
        ...options,
        message: cause.message || options.message,
        cause,
      });
    }

    return new CommandError(options);
  }

  constructor(options: CommandErrorOptions<TData> = EMPTY_OBJECT) {
    const {
      code = "INTERNAL_SERVER_ERROR",
      message = COMMAND_KNOWN_ERROR_DEFINITION[code as CommandKnownErrorCode]?.message,
      data,
      context,
      command,
      cause,
    } = options;

    if (cause === undefined) {
      super(message);
    } else {
      super(message, { cause });
    }

    this.code = code;
    this.data = data;
    this.context = context;
    this.command = command;
  }
}

export function isCommandKnownErrorCode(target: unknown): target is CommandKnownErrorCode {
  const candidate = target as CommandKnownErrorCode;

  return Boolean(candidate && COMMAND_KNOWN_ERROR_DEFINITION[candidate]);
}

export function isCommandError(target: unknown): target is CommandError<unknown>;
export function isCommandError<TShape extends AnyCommand | AnyCommandFactory>(
  target: unknown,
  shape: TShape,
): target is CommandError<InferCommandError<TShape>>;
export function isCommandError(target: unknown) {
  if (target instanceof CommandError) {
    return true;
  }

  const candidate = target as CommandError<unknown>;

  return Boolean(
    candidate &&
    candidate.code &&
    candidate.name === "CommandError" &&
    typeof candidate.code === "string",
  );
}
