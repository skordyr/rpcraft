import type { Link, LinkNext, LinkOperation, LinkResult } from "../link";
import type { Router, RouterEntry } from "../router";
import type { Thunkable } from "../shared/types";
import type { AnyCommand, Context, InferCommandOutput } from "../types";
import type { RPCMessageEvent, RPCMessagePort } from "./message-port";
import type {
  RPCDataResponseMessage,
  RPCErrorResponseMessage,
  RPCId,
  RPCStartedResponseMessage,
  RPCStoppedResponseMessage,
} from "./protocol";

import { isSubscriptionCommand } from "../builder";
import { CommandError, type CommandKnownErrorCode } from "../error";
import { iterator, promise } from "../iterator";
import { pipe } from "../link";
import {
  COMMAND_KNOWN_RPC_ERROR_DEFINITION,
  isRPCMutationRequestMessage,
  isRPCQueryRequestMessage,
  isRPCStopSubscriptionRequestMessage,
  isRPCSubscriptionRequestMessage,
} from "./protocol";

interface RPCServerResolver<TContext extends Context, TCommand extends AnyCommand = AnyCommand> {
  iterator: Required<AsyncIteratorObject<InferCommandOutput<TCommand>, void, void>>;
  operation: LinkOperation<TContext, TCommand>;
}

export interface RPCServerConnection<TContext extends Context> {
  port: RPCMessagePort;
  context: Thunkable<(operation: LinkOperation<Partial<TContext>>) => TContext>;
  close(): void;
}

export interface RPCServerOptions<TContext extends Context> {
  routers: Router<TContext, Context>[];
  link?: Link<TContext, TContext>;
  context?: Thunkable<(operation: LinkOperation<TContext>) => Partial<TContext> | void>;
  autoStart?: boolean;
}

export class RPCServer<TContext extends Context> {
  readonly routers: Router<TContext, Context>[];

  readonly connections: Map<RPCMessagePort, RPCServerConnection<TContext>> = new Map();

  private _active: boolean = false;

  private _resolve: <TCommand extends AnyCommand>(
    operation: LinkOperation<TContext>,
  ) => LinkResult<Context, TCommand>;

  constructor(options: RPCServerOptions<TContext>) {
    const { routers, link, context, autoStart = true } = options;

    this.routers = routers;

    const getGlobalContext = context && typeof context === "function" ? context : () => context;

    const resolveCache: Map<RouterEntry<TContext>, Link<TContext, Context>> = new Map();

    const notFound: LinkNext<TContext> = () => {
      return promise(() => {
        throw CommandError.from("NOT_FOUND", {
          message: "Request failed: no route matched for the request.",
        });
      });
    };

    this._resolve = (operation) => {
      const globalContext = getGlobalContext(operation);

      if (globalContext) {
        operation.context = {
          ...globalContext,
          ...operation.context,
        };
      }

      for (const router of routers) {
        const entry = router.match(operation) as RouterEntry<TContext> | null;

        if (entry) {
          let resolve;

          if (link) {
            resolve = resolveCache.get(entry);

            if (!resolve) {
              resolve = pipe(link, entry[1]);

              resolveCache.set(entry, resolve);
            }
          } else {
            resolve = entry[1];
          }

          return resolve(router.prepare(operation), notFound);
        }
      }

      if (link) {
        return link(operation, notFound);
      }

      return notFound();
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

    return this;
  }

  stop(): this {
    if (!this._active) {
      return this;
    }

    this._active = false;

    for (const connection of this.connections.values()) {
      connection.close();
    }

    return this;
  }

  close(port: RPCMessagePort): this {
    if (!this._active) {
      return this;
    }

    const connection = this.connections.get(port);

    if (!connection) {
      return this;
    }

    connection.close();

    return this;
  }

  upgrade(
    port: RPCMessagePort,
    context: Thunkable<(operation: LinkOperation<Partial<TContext>>) => TContext>,
  ): this {
    if (!this._active) {
      return this;
    }

    if (this.connections.has(port)) {
      return this;
    }

    const resolvers: Map<RPCId, RPCServerResolver<TContext>> = new Map();

    const createContext = typeof context === "function" ? context : () => context;

    const handle = async (event: RPCMessageEvent) => {
      const { data } = event;

      if (
        isRPCQueryRequestMessage(data) ||
        isRPCMutationRequestMessage(data) ||
        isRPCSubscriptionRequestMessage(data)
      ) {
        const {
          id,
          method,
          params: { path, input },
        } = data;

        const operation: LinkOperation<TContext> = {
          context: {} as TContext,
          command: {
            type: method,
            name: path,
            meta: {},
            input,
          },
        };

        operation.context = createContext(operation);

        try {
          const result = this._resolve(operation);

          const $iterator = (
            result.throw && result.return
              ? result
              : iterator(async function* () {
                  yield* result;
                })
          ) as Required<AsyncIteratorObject<any, void, void>>;

          const resolver: RPCServerResolver<TContext> = {
            iterator: $iterator,
            operation,
          };

          resolvers.set(id, resolver);

          const isSubscription = isSubscriptionCommand(operation.command);

          let onActive: (() => void) | undefined;

          if (isSubscription) {
            onActive = () => {
              onActive = undefined;

              const message: RPCStartedResponseMessage = {
                id,
                result: {
                  type: "started",
                },
              };

              port.postMessage(message);
            };
          }

          for await (const data of $iterator) {
            onActive?.();

            const message: RPCDataResponseMessage = {
              id,
              result: {
                type: "data",
                data,
              },
            };

            port.postMessage(message);
          }

          if (isSubscription) {
            const message: RPCStoppedResponseMessage = {
              id,
              result: {
                type: "stopped",
              },
            };

            port.postMessage(message);
          }
        } catch (error) {
          const $error = CommandError.from(error, {});

          const definition =
            COMMAND_KNOWN_RPC_ERROR_DEFINITION[$error.code as CommandKnownErrorCode] ||
            COMMAND_KNOWN_RPC_ERROR_DEFINITION["INTERNAL_SERVER_ERROR"];

          const message: RPCErrorResponseMessage = {
            id,
            error: {
              code: definition.code,
              message: definition.message,
              data: $error.data,
            },
          };

          port.postMessage(message);
        } finally {
          resolvers.delete(id);
        }

        return;
      }

      if (isRPCStopSubscriptionRequestMessage(data)) {
        const { id } = data;

        const resolver = resolvers.get(id);

        if (!resolver) {
          return;
        }

        const {
          iterator,
          operation: { command },
        } = resolver;

        if (!isSubscriptionCommand(command)) {
          iterator.throw(
            CommandError.from("BAD_REQUEST", {
              message:
                "Request failed: unexpected stop subscription request for non-subscription command.",
            }),
          );

          return;
        }

        iterator.return();

        return;
      }
    };

    port.addEventListener("message", handle);

    const connection: RPCServerConnection<TContext> = {
      port,
      context,
      close: () => {
        this.connections.delete(port);

        port.removeEventListener("message", handle);

        for (const resolver of resolvers.values()) {
          const { iterator } = resolver;

          iterator.throw(
            CommandError.from("SERVICE_UNAVAILABLE", {
              message: "Request failed: connection is closed.",
            }),
          );
        }
      },
    };

    this.connections.set(port, connection);

    return this;
  }
}
