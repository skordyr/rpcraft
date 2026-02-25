export async function toPromise<TResult>(iterator: AsyncIteratorObject<TResult>): Promise<TResult> {
  let result: TResult | undefined;
  let hasResult = false;

  for await (const value of iterator) {
    hasResult = true;
    result = value;
  }

  if (!hasResult) {
    throw new Error("Cannot resolve iterator result: no values were yielded.");
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
  (): TResult | Promise<TResult>;
}

export async function* promise<TResult>(factory: PromiseFactory<TResult>): AsyncGenerator<TResult> {
  yield await factory();
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
          deferred.reject(new Error("Cannot emit: generator has returned."));
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
            deferred.reject(new Error("Cannot emit: generator has been terminated."));
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
