import type { Emitter } from "../iterator";
import type { LinkOperation, LinkResult } from "../link";
import type { AnyCommand, Context, InferCommandOutput } from "../types";
import type { RPCMessageEvent, RPCMessagePort } from "./message-port";
import type {
  RPCId,
  RPCKnownErrorCode,
  RPCMutationRequestMessage,
  RPCQueryRequestMessage,
  RPCStopSubscriptionRequestMessage,
  RPCSubscriptionRequestMessage,
} from "./protocol";

import { isSubscriptionCommand } from "../builder";
import { CommandError } from "../error";
import { emittable } from "../iterator";
import { randomString } from "../shared/utils";
import {
  isRPCDataResponseMessage,
  isRPCErrorResponseMessage,
  isRPCStartedResponseMessage,
  isRPCStoppedResponseMessage,
  RPC_KNOWN_ERROR_DEFINITION,
  RPCIdGenerator,
} from "./protocol";

interface RPCClientResolver<TContext extends Context, TCommand extends AnyCommand = AnyCommand> {
  hasClientError: boolean;
  emitter: Emitter<InferCommandOutput<TCommand>>;
  operation: LinkOperation<TContext, TCommand>;
  onActive?(): void;
}

export type RPCClientContext = {
  timeout?: number;
  signal?: AbortSignal;
};

export interface RPCClientOptions {
  port: RPCMessagePort;
  autoStart?: boolean;
}

export class RPCClient<TContext extends Context> {
  readonly port: RPCMessagePort;

  private _active: boolean = false;

  private _idGenerator: RPCIdGenerator = new RPCIdGenerator(randomString(7));

  private _resolvers: Map<RPCId, RPCClientResolver<TContext>> = new Map();

  private _handle: (event: RPCMessageEvent) => void;

  constructor(options: RPCClientOptions) {
    const { port, autoStart = true } = options;

    this.port = port;

    this._handle = (event) => {
      const { data } = event;

      if (!data) {
        return;
      }

      if (isRPCDataResponseMessage(data)) {
        const { id } = data;

        const resolver = this._resolvers.get(id);

        if (!resolver) {
          return;
        }

        const {
          result: { data: $data },
        } = data;

        const {
          emitter,
          operation: { command },
          onActive,
        } = resolver;

        onActive?.();

        emitter.next($data);

        if (!isSubscriptionCommand(command)) {
          emitter.return();
        }

        return;
      }

      if (isRPCStartedResponseMessage(data)) {
        const { id } = data;

        const resolver = this._resolvers.get(id);

        if (!resolver) {
          return;
        }

        const {
          emitter,
          operation: { context, command },
          onActive,
        } = resolver;

        onActive?.();

        if (!isSubscriptionCommand(command)) {
          emitter.throw(
            CommandError.from("INTERNAL_SERVER_ERROR", {
              message:
                "Received an unexpected 'started' response for the non-subscription command.",
              context,
              command,
            }),
          );

          return;
        }

        return;
      }

      if (isRPCStoppedResponseMessage(data)) {
        const { id } = data;

        const resolver = this._resolvers.get(id);

        if (!resolver) {
          return;
        }

        const {
          emitter,
          operation: { context, command },
          onActive,
        } = resolver;

        onActive?.();

        if (!isSubscriptionCommand(command)) {
          resolver.hasClientError = true;

          emitter.throw(
            CommandError.from("INTERNAL_SERVER_ERROR", {
              message:
                "Received an unexpected 'stopped' response for the non-subscription command.",
              context,
              command,
            }),
          );

          return;
        }

        emitter.return();

        return;
      }

      if (isRPCErrorResponseMessage(data)) {
        const { id } = data;

        if (!id) {
          return;
        }

        const resolver = this._resolvers.get(id);

        if (!resolver) {
          return;
        }

        const {
          error: { code, message, data: $data },
        } = data;

        const {
          emitter,
          operation: { context, command },
          onActive,
        } = resolver;

        onActive?.();

        const definition =
          RPC_KNOWN_ERROR_DEFINITION[code as RPCKnownErrorCode] ||
          RPC_KNOWN_ERROR_DEFINITION[-32500];

        emitter.throw(
          CommandError.from(message, {
            code: definition.code,
            message: definition.message,
            context,
            command,
            data: $data,
          }),
        );

        return;
      }
    };

    if (autoStart) {
      this.start();
    }
  }

  get active(): boolean {
    return this._active;
  }

  start(): this {
    if (this._active) {
      return this;
    }

    this._active = true;

    this.port.addEventListener("message", this._handle);

    return this;
  }

  stop(): this {
    if (!this._active) {
      return this;
    }

    this._active = false;

    this.port.removeEventListener("message", this._handle);

    for (const resolver of this._resolvers.values()) {
      const {
        emitter,
        operation: { context, command },
      } = resolver;

      emitter.throw(
        CommandError.from("SERVICE_UNAVAILABLE", {
          message: "The client has been stopped.",
          context,
          command,
        }),
      );
    }

    return this;
  }

  resolve<TCommand extends AnyCommand>(
    operation: LinkOperation<RPCClientContext & TContext, TCommand>,
  ): LinkResult<RPCClientContext & TContext, TCommand> {
    return emittable((emitter) => {
      const {
        command: { type, name, input },
        context: { timeout = 0, signal },
      } = operation;

      const resolver: RPCClientResolver<TContext, TCommand> = {
        hasClientError: false,
        emitter,
        operation,
      };

      let disposeSignal: (() => void) | undefined;
      let disposeTimeout: (() => void) | undefined;

      if (timeout > 0) {
        const id = setTimeout(() => {
          if (emitter.closed) {
            return;
          }

          const { context, command } = operation;

          resolver.hasClientError = true;

          emitter.throw(
            CommandError.from("TIMEOUT", {
              message: `The operation timeout occurred after ${timeout}ms.`,
              context,
              command,
            }),
          );
        }, timeout);

        disposeTimeout = () => {
          disposeTimeout = undefined;

          clearTimeout(id);
        };
      }

      if (signal) {
        const handle = () => {
          if (emitter.closed) {
            return;
          }

          const { context, command } = operation;

          resolver.hasClientError = true;

          emitter.throw(
            CommandError.from("CLIENT_CLOSED_REQUEST", {
              message: "The operation was aborted by the signal.",
              context,
              command,
            }),
          );
        };

        signal.addEventListener("abort", handle);

        disposeSignal = () => {
          disposeSignal = undefined;

          signal.removeEventListener("abort", handle);
        };
      }

      if (disposeTimeout) {
        resolver.onActive = () => {
          resolver.onActive = undefined;

          disposeTimeout?.();
        };
      }

      const id = this._idGenerator.next();

      this._resolvers.set(id, resolver);

      const message:
        | RPCQueryRequestMessage
        | RPCMutationRequestMessage
        | RPCSubscriptionRequestMessage = {
        id,
        method: type,
        params: {
          path: name,
          input,
        },
      };

      this.port.postMessage(message);

      return () => {
        this._resolvers.delete(id);

        disposeTimeout?.();
        disposeSignal?.();

        if (!isSubscriptionCommand(operation.command)) {
          return;
        }

        if (!resolver.hasClientError && emitter.closed) {
          return;
        }

        const message: RPCStopSubscriptionRequestMessage = {
          id,
          method: "subscription.stop",
        };

        this.port.postMessage(message);
      };
    });
  }
}
