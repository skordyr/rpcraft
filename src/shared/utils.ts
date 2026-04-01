export const EMPTY_OBJECT = {} as const;

export function IDENTITY<TValue>(value: TValue): TValue {
  return value;
}

export function run<TResult>(fn: () => TResult): TResult {
  return fn();
}

export function isErrorLike(target: unknown): target is Pick<Error, "message"> {
  const candidate = target as Error;

  return Boolean(candidate && candidate.message && typeof candidate.message === "string");
}

export function isPlainObject(target: any): boolean {
  if (
    target &&
    (target.constructor === Object ||
      target.constructor === null ||
      (typeof target === "object" && Object.getPrototypeOf(target) === null))
  ) {
    return true;
  }

  return false;
}

const $hasOwnProperty = Object.prototype.hasOwnProperty;

export function hasOwnProperty(target: any, key: PropertyKey): boolean {
  if (target === null) {
    return false;
  }

  return $hasOwnProperty.call(target, key);
}

export function get<TValue>(target: any, path: string[]): TValue {
  let current = target;

  for (const key of path) {
    if (!hasOwnProperty(current, key)) {
      return undefined as TValue;
    }

    current = current[key];
  }

  return current;
}

export function* matchAll(text: string, regexp: RegExp): Generator<RegExpExecArray> {
  let result;

  do {
    result = regexp.exec(text);

    if (result) {
      yield result;
    }
  } while (result);
}

export function randomString(size: number, base: number = 36): string {
  let result = "";

  while (result.length < size) {
    result += Math.random().toString(base).slice(2);
  }

  return result.length > size ? result.slice(0, size) : result;
}
