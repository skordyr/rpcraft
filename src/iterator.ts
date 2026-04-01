import { run } from "./shared/utils";

export async function toPromise<TResult>(iterator: AsyncIteratorObject<TResult>): Promise<TResult> {
  let result: TResult | undefined;
  let hasResult = false;

  for await (const value of iterator) {
    hasResult = true;
    result = value;
  }

  if (!hasResult) {
    throw new Error("No values were yielded. The iterator needs to yield at least one value.");
  }

  return result as TResult;
}

export async function* fromPromise<TResult>(promise: Promise<TResult>): AsyncGenerator<TResult> {
  yield await promise;
}

export function toStream<TResult>(iterator: AsyncIteratorObject<TResult>): ReadableStream<TResult> {
  return new ReadableStream({
    async pull(controller) {
      try {
        const { done, value } = await iterator.next();

        if (done) {
          controller.close();

          return;
        }

        controller.enqueue(value);
      } catch (error) {
        controller.error(error);
      }
    },
    async cancel() {
      await iterator.return?.();
    },
  });
}

export async function* fromStream<TResult>(
  stream: ReadableStream<TResult>,
): AsyncGenerator<TResult> {
  const reader = stream.getReader();

  try {
    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        return;
      }

      yield value;
    }
  } finally {
    reader.cancel().catch(() => {});
  }
}

export interface IteratorFactory<TResult> {
  (): AsyncIteratorObject<TResult>;
}

export function iterator<TResult>(factory: IteratorFactory<TResult>): AsyncIteratorObject<TResult> {
  return factory();
}

export interface PromiseFactory<TResult> {
  (onExit: (dispose: (closed: boolean) => void) => void): TResult | Promise<TResult>;
}

export async function* promise<TResult>(factory: PromiseFactory<TResult>): AsyncGenerator<TResult> {
  const disposes: Array<(closed: boolean) => void> = [];

  let $closed = false;

  const onExit = (dispose: (closed: boolean) => void) => {
    if ($closed) {
      dispose(true);

      return;
    }

    disposes.push(dispose);
  };

  try {
    yield await factory(onExit);

    $closed = true;
  } catch (error) {
    $closed = true;

    throw error;
  } finally {
    try {
      for (let index = disposes.length - 1; index >= 0; index -= 1) {
        const dispose = disposes[index];

        dispose($closed);
      }
    } finally {
      if (!$closed) {
        $closed = true;
      }
    }
  }
}

interface Deferred<TResult> {
  resolve(value: TResult): void;
  reject(error: unknown): void;
}

export interface Emitter<TResult> {
  get closed(): boolean;
  next(value: TResult): void;
  throw(error: unknown): void;
  return(): void;
}

export interface EmittableFactory<TResult> {
  (emitter: Emitter<TResult>): (() => void) | Promise<() => void> | Promise<void> | void;
}

export async function* emittable<TResult>(
  factory: EmittableFactory<TResult>,
): AsyncGenerator<TResult> {
  const buffer: TResult[] = [];
  const pending: Deferred<TResult>[] = [];

  let $closed = false;
  let $hasError = false;
  let $error: unknown | undefined;
  let $dispose: (() => void) | undefined | void;

  const emitter: Emitter<TResult> = {
    get closed() {
      return $closed;
    },
    next(value) {
      if ($closed) {
        return;
      }

      if (pending.length > 0) {
        const deferred = pending.shift()!;

        deferred.resolve(value);

        return;
      }

      buffer.push(value);
    },
    throw(error) {
      if ($closed) {
        return;
      }

      $closed = true;
      $hasError = true;
      $error = error;

      if (pending.length > 0) {
        for (const deferred of pending) {
          deferred.reject(error);
        }

        pending.length = 0;
      }
    },
    return() {
      if ($closed) {
        return;
      }

      $closed = true;

      if (pending.length > 0) {
        for (const deferred of pending) {
          deferred.reject(new Error("The generator has already returned."));
        }

        pending.length = 0;
      }
    },
  };

  try {
    $dispose = await factory(emitter);
  } catch (error) {
    emitter.throw(error);
  }

  try {
    while (true) {
      if (buffer.length > 0) {
        const value = buffer.shift()!;

        yield value;
      } else {
        if ($hasError) {
          throw $error;
        }

        if ($closed) {
          return;
        }

        const promise = new Promise<TResult>((resolve, reject) => {
          pending.push({ resolve, reject });
        });

        yield await promise;
      }
    }
  } finally {
    try {
      $dispose?.();
    } finally {
      if (!$closed) {
        $closed = true;

        if (pending.length > 0) {
          for (const deferred of pending) {
            deferred.reject(new Error("The generator has been terminated."));
          }

          pending.length = 0;
        }
      }

      if (buffer.length > 0) {
        buffer.length = 0;
      }
    }
  }
}

export interface Event<TResult> extends Emitter<TResult> {
  get subscribers(): number;
  stream(): AsyncIteratorObject<TResult, void, void>;
}

export interface EventActivity {
  activate(): void;
  deactivate(): void;
}

export interface EventFactory<TResult> {
  (emitter: Emitter<TResult>): EventActivity;
}

class Event$<TResult> implements Event<TResult> {
  private _closed = false;

  private _emitters: Set<Emitter<TResult>> = new Set();

  private _activity?: EventActivity;

  constructor(factory?: EventFactory<TResult>) {
    this._activity = factory?.(this);
  }

  get closed(): boolean {
    return this._closed;
  }

  get subscribers(): number {
    return this._emitters.size;
  }

  next(value: TResult): void {
    if (this._closed) {
      return;
    }

    for (const emitter of this._emitters) {
      emitter.next(value);
    }
  }

  throw(error: unknown): void {
    if (this._closed) {
      return;
    }

    this._closed = true;

    for (const emitter of this._emitters) {
      emitter.throw(error);
    }
  }

  return(): void {
    if (this._closed) {
      return;
    }

    this._closed = true;

    for (const emitter of this._emitters) {
      emitter.return();
    }
  }

  stream(): AsyncIteratorObject<TResult, void, void> {
    if (this._closed) {
      return promise(() => {
        throw new Error("The event has already been closed.");
      });
    }

    return emittable((emitter) => {
      this._emitters.add(emitter);

      if (this._activity && this._emitters.size === 1) {
        this._activity.activate();
      }

      return () => {
        this._emitters.delete(emitter);

        if (this._activity && this._emitters.size === 0) {
          this._activity.deactivate();
        }
      };
    });
  }
}

export function event<TResult>(factory?: EventFactory<TResult>): Event<TResult> {
  return new Event$(factory);
}

export interface State<TResult> extends Event<TResult> {
  get current(): TResult;
}

export interface StateActivity<TResult> extends EventActivity {
  get(): TResult;
  set(value: TResult): void;
}

export interface StateFactory<TResult> {
  (emitter: Emitter<TResult>): StateActivity<TResult>;
}

class State$<TResult> implements State<TResult> {
  private _event$: Event<TResult>;

  private _activity: StateActivity<TResult>;

  constructor(value: TResult);
  constructor(factory: StateFactory<TResult>);
  constructor(maybeValue: TResult | StateFactory<TResult>) {
    let activity: StateActivity<TResult>;

    this._event$ = new Event$((emitter) => {
      let factory: StateFactory<TResult>;

      if (typeof maybeValue === "function") {
        // @ts-expect-error maybeValue is StateFactory when it is a function
        factory = maybeValue;
      } else {
        factory = () => {
          let $value = maybeValue;

          return {
            get() {
              return $value;
            },
            set(value) {
              $value = value;

              emitter.next($value);
            },
            activate() {},
            deactivate() {},
          };
        };
      }

      activity = factory(emitter);

      return activity;
    });

    // @ts-expect-error activity is assigned in the Event$.constructor before use.
    this._activity = activity;
  }

  get closed(): boolean {
    return this._event$.closed;
  }

  get subscribers(): number {
    return this._event$.subscribers;
  }

  get current(): TResult {
    return this._activity.get();
  }

  next(value: TResult): void {
    this._activity.set(value);
  }

  throw(error: unknown): void {
    this._event$.throw(error);
  }

  return(): void {
    this._event$.return();
  }

  async *stream(): AsyncIteratorObject<TResult, void, void> {
    yield this._activity.get();

    yield* this._event$.stream();
  }
}

export function state<TResult>(factory: StateFactory<TResult>): State<TResult>;
export function state<TResult>(value: TResult): State<TResult>;
export function state<TResult>(factory?: StateFactory<TResult>): State<TResult | undefined>;
export function state<TResult>(value?: TResult): State<TResult | undefined>;
export function state<TResult>(
  maybeValue?: TResult | StateFactory<TResult | undefined>,
): State<TResult | undefined> {
  return new State$(maybeValue) as State<TResult | undefined>;
}

export interface Subscriber<TResult> {
  start?(): void;
  dispose?(closed: boolean): void;
  next?(value: TResult): void;
  error?(error: unknown): void;
  complete?(): void;
}

export function subscribe<TResult>(
  iterator: AsyncIteratorObject<TResult>,
  subscriber: Subscriber<TResult>,
): () => void {
  let closed = false;

  run(async () => {
    try {
      subscriber.start?.();

      for await (const value of iterator) {
        if (closed) {
          return;
        }

        subscriber.next?.(value);
      }

      if (closed) {
        return;
      }

      closed = true;

      subscriber.complete?.();
    } catch (error) {
      if (closed) {
        return;
      }

      closed = true;

      if (!subscriber.error) {
        throw error;
      }

      subscriber.error(error);
    } finally {
      subscriber.dispose?.(closed);

      if (!closed) {
        closed = true;
      }
    }
  });

  return () => {
    subscriber.dispose?.(closed);

    if (closed) {
      return;
    }

    closed = true;

    iterator.return?.();
  };
}
