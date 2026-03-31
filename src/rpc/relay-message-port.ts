import type { RPCMessageEvent, RPCMessagePort } from "./message-port";

export interface RelayMessagePortOptions {
  postMessage(message: unknown): void;
  onMessage(listener: (event: RPCMessageEvent) => void): () => void;
  autoStart?: boolean;
}

export class RelayMessagePort implements RPCMessagePort {
  private _postMessage: (message: unknown) => void;

  private _onMessage: (listener: (event: RPCMessageEvent) => void) => () => void;

  private _active: boolean = false;

  private _listeners: Set<(event: RPCMessageEvent) => void> = new Set();

  private _dispose?: () => void;

  constructor(options: RelayMessagePortOptions) {
    const { postMessage, onMessage, autoStart = true } = options;

    this._postMessage = postMessage;
    this._onMessage = onMessage;

    if (autoStart) {
      this.start();
    }
  }

  get active(): boolean {
    return this._active;
  }

  start(): void {
    if (this._active) {
      return;
    }

    this._active = true;

    const disposeMessage = this._onMessage((event) => {
      for (const listener of this._listeners) {
        listener(event);
      }
    });

    this._dispose = () => {
      this._dispose = undefined;

      disposeMessage();
    };
  }

  close(): void {
    if (!this._active) {
      return;
    }

    this._active = false;

    this._dispose?.();
  }

  postMessage(message: unknown): void {
    this._postMessage(message);
  }

  addEventListener(event: "message", listener: (event: RPCMessageEvent) => void): void {
    if (event !== "message") {
      return;
    }

    this._listeners.add(listener);
  }

  removeEventListener(event: "message", listener: (event: RPCMessageEvent) => void): void {
    if (event !== "message") {
      return;
    }

    this._listeners.delete(listener);
  }
}

export class RelayMessageChannel {
  readonly port1: RelayMessagePort;

  readonly port2: RelayMessagePort;

  constructor() {
    let listener1: ((event: RPCMessageEvent) => void) | undefined;
    let listener2: ((event: RPCMessageEvent) => void) | undefined;

    this.port1 = new RelayMessagePort({
      postMessage(message) {
        if (!listener2) {
          return;
        }

        listener2({ data: message });
      },
      onMessage(listener) {
        listener1 = listener;

        return () => {
          listener1 = undefined;
        };
      },
    });

    this.port2 = new RelayMessagePort({
      postMessage(message) {
        if (!listener1) {
          return;
        }

        listener1({ data: message });
      },
      onMessage(listener) {
        listener2 = listener;

        return () => {
          listener2 = undefined;
        };
      },
    });
  }
}
