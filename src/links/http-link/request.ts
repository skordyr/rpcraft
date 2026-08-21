import { EventSourceParserStream } from "eventsource-parser/stream";

import { fromStream } from "../../iterator";
import { isPlainObject } from "../../shared/utils";

export type HTTPRequestUrl = string;

export type HTTPRequestMethod =
  | "GET"
  | "POST"
  | "PUT"
  | "PATCH"
  | "DELETE"
  | "HEAD"
  | "QUERY"
  | (string & {});

export type HTTPRequestParams = {
  [key: string]: unknown;
};

export type HTTPRequestData = unknown;

export type HTTPRequestHeaderValue = string | number | (string | number)[] | undefined;

export type HTTPRequestHeaders = {
  [key: string]: HTTPRequestHeaderValue;
};

export type HTTPRequestRequestDataType = "text" | "json" | "form-urlencoded" | "form-data" | "raw";

export type HTTPRequestResponseDataType =
  | "ignore"
  | "text"
  | "json"
  | "binary"
  | "stream"
  | "stream-text"
  | "event-stream"
  | "event-stream-text"
  | "event-stream-json"
  | "raw";

export type HTTPRequestStatus = number;

export type HTTPRequestResult =
  | {
      success: true;
      data: HTTPRequestData;
      headers: HTTPRequestHeaders;
      status: HTTPRequestStatus;
      request: Request;
      response: Response;
    }
  | {
      success: false;
      error: unknown;
      isTimeout: boolean;
      isAbort: boolean;
      data?: HTTPRequestData;
      headers?: HTTPRequestHeaders;
      status?: HTTPRequestStatus;
      request?: Request;
      response?: Response;
    };

const EVENT_STREAM_TERMINATOR = "[DONE]";

export interface HTTPRequestOptions extends Omit<RequestInit, "method" | "body" | "headers"> {
  url: HTTPRequestUrl;
  method: HTTPRequestMethod;
  params?: HTTPRequestParams;
  data?: HTTPRequestData;
  headers?: HTTPRequestHeaders;
  requestDataType?: HTTPRequestRequestDataType;
  responseDataType?: HTTPRequestResponseDataType;
  timeout?: number;
  stringifyData?(data: unknown): string;
  parseData?(text: string): unknown;
  stringifyParams?(params: HTTPRequestParams): string;
}

export async function* request(
  options: HTTPRequestOptions,
): AsyncIteratorObject<HTTPRequestResult, void, void> {
  const {
    url,
    method,
    params,
    data,
    headers,
    requestDataType = "json",
    responseDataType = "json",
    timeout = 0,
    signal,
    stringifyData = DEFAULT_STRINGIFY_DATA,
    parseData = DEFAULT_PARSE_DATA,
    stringifyParams = DEFAULT_STRINGIFY_PARAMS,
    ...fetchOptions
  } = options;

  const controller = new AbortController();

  let closed = false;
  let isTimeout = false;
  let isAbort = false;
  let request: Request | undefined;
  let response: Response | undefined;
  let disposeTimeout: (() => void) | undefined;
  let disposeSignal: (() => void) | undefined;

  if (timeout > 0) {
    const id = setTimeout(() => {
      if (closed || isAbort) {
        return;
      }

      isTimeout = true;

      disposeSignal?.();

      controller.abort(new Error(`The request timeout occurred after ${timeout}ms.`));
    }, timeout);

    disposeTimeout = () => {
      disposeTimeout = undefined;

      clearTimeout(id);
    };
  }

  if (signal) {
    const handle = (event: Event) => {
      if (closed || isTimeout) {
        return;
      }

      isAbort = true;

      disposeTimeout?.();

      const { target } = event;

      controller.abort(
        new Error(`The request was aborted by the signal.`, { cause: (target as any)?.reason }),
      );
    };

    signal.addEventListener("abort", handle);

    disposeSignal = () => {
      disposeSignal = undefined;

      signal.removeEventListener("abort", handle);
    };
  }

  const $dispose = () => {
    disposeTimeout?.();
    disposeSignal?.();
  };

  let $$headers: HTTPRequestHeaders | undefined;

  const $getHeaders = () => {
    if (!response) {
      return;
    }

    if (!$$headers) {
      $$headers = toHeaders(response.headers);
    }

    return $$headers;
  };

  const $getStatus = () => {
    if (!response) {
      return undefined;
    }

    return response.status;
  };

  const $success = (data?: unknown): HTTPRequestResult => {
    return {
      success: true,
      data,
      headers: $getHeaders()!,
      status: $getStatus()!,
      request: request!,
      response: response!,
    };
  };

  const $error = (error: unknown, data?: unknown): HTTPRequestResult => {
    return {
      success: false,
      error,
      isTimeout,
      isAbort,
      data,
      headers: $getHeaders(),
      status: $getStatus(),
      request,
      response,
    };
  };

  const $abort = (): HTTPRequestResult => {
    return $error(controller.signal.reason || new Error("The request was aborted."));
  };

  try {
    const $signal = controller.signal;
    const $search = params && stringifyParams(params);
    const $url = $search ? `${url}?${$search}` : url;

    let $headers = headers && toNativeHeaders(headers);
    let $body: BodyInit | undefined;

    const $addContentType = (contentType: string) => {
      if ($headers?.has("Content-Type")) {
        return;
      }

      if (!$headers) {
        $headers = new Headers();
      }

      $headers.set("Content-Type", contentType);
    };

    if (data !== undefined && data !== null) {
      switch (requestDataType) {
        case "text": {
          $body = typeof data === "string" ? data : stringifyData(data);

          $addContentType("text/plain");

          break;
        }
        case "json": {
          $body = stringifyData(data);

          $addContentType("application/json");

          break;
        }
        case "form-urlencoded": {
          $body = toNativeURLSearchParams(data);

          break;
        }
        case "form-data": {
          $body = toNativeFormData(data);

          break;
        }
        case "raw": {
          $body = data as BodyInit;

          break;
        }
      }
    }

    request = new Request($url, {
      ...fetchOptions,
      method,
      body: $body,
      headers: $headers,
      signal: $signal,
    });

    response = await fetch(request);

    if (closed) {
      yield $abort();

      return;
    }

    if (response.ok) {
      switch (responseDataType) {
        case "ignore": {
          yield $success();

          break;
        }
        case "text": {
          yield $success(await response.text());

          break;
        }
        case "json": {
          yield $success(parseData(await response.text()));

          break;
        }
        case "binary": {
          yield $success(await response.arrayBuffer());

          break;
        }
        case "stream": {
          disposeTimeout?.();

          if (response.body) {
            for await (const data of fromStream(response.body)) {
              if (closed) {
                yield $abort();

                return;
              }

              yield $success(data);
            }
          }

          break;
        }
        case "stream-text": {
          disposeTimeout?.();

          if (response.body) {
            for await (const data of fromStream(
              response.body.pipeThrough(new TextDecoderStream()),
            )) {
              if (closed) {
                yield $abort();

                return;
              }

              yield $success(data);
            }
          }

          break;
        }
        case "event-stream":
        case "event-stream-text": {
          disposeTimeout?.();

          if (response.body) {
            for await (const data of fromStream(
              response.body
                .pipeThrough(new TextDecoderStream())
                .pipeThrough(new EventSourceParserStream()),
            )) {
              if (closed) {
                yield $abort();

                return;
              }

              if (data.data !== EVENT_STREAM_TERMINATOR) {
                yield $success(data);
              }
            }
          }

          break;
        }
        case "event-stream-json": {
          disposeTimeout?.();

          if (response.body) {
            for await (const data of fromStream(
              response.body
                .pipeThrough(new TextDecoderStream())
                .pipeThrough(new EventSourceParserStream()),
            )) {
              if (closed) {
                yield $abort();

                return;
              }

              if (data.data !== EVENT_STREAM_TERMINATOR) {
                yield $success({ ...data, data: parseData(data.data) });
              }
            }
          }

          break;
        }
        case "raw": {
          disposeTimeout?.();

          yield $success(response);

          break;
        }
      }

      closed = true;

      $dispose();

      return;
    }

    let $$data;

    try {
      $$data = await response.text();

      disposeTimeout?.();

      $$data = parseData($$data);
    } catch {}

    if (closed) {
      yield $abort();

      return;
    }

    closed = true;

    $dispose();

    yield $error(new Error(`The server responded with status "${response.status}".`), $$data);
  } catch (error) {
    if (closed) {
      yield $abort();

      return;
    }

    closed = true;

    $dispose();

    yield $error(error);
  } finally {
    if (!closed) {
      closed = true;
      isAbort = true;

      $dispose();
    }
  }
}

function DEFAULT_STRINGIFY_DATA(data: unknown) {
  return JSON.stringify(data);
}

function DEFAULT_PARSE_DATA(text: string) {
  return JSON.parse(text);
}

function DEFAULT_STRINGIFY_PARAMS(params: HTTPRequestParams) {
  return toNativeURLSearchParams(params).toString();
}

function toHeaders(value: Headers) {
  const headers: HTTPRequestHeaders = {};

  value.forEach((value, key) => {
    const prevValue = headers[key];

    if (prevValue === undefined) {
      headers[key] = value;

      return;
    }

    if (Array.isArray(prevValue)) {
      prevValue.push(value);

      return;
    }

    headers[key] = [prevValue, value];
  });

  return headers;
}

function toNativeHeaders(target: unknown) {
  if (!target) {
    return new Headers();
  }

  if (target instanceof Headers) {
    return target;
  }

  const headers = new Headers();

  eachEntry(target, (key, value) => {
    headers.append(key, String(value));
  });

  return headers;
}

function toNativeURLSearchParams(target: unknown) {
  if (!target) {
    return new URLSearchParams();
  }

  if (typeof target === "string") {
    return new URLSearchParams(target);
  }

  if (target instanceof URLSearchParams) {
    return target;
  }

  const params = new URLSearchParams();

  eachEntry(target, (key, value) => {
    params.append(key, String(value));
  });

  return params;
}

function toNativeFormData(target: unknown) {
  if (!target) {
    return new FormData();
  }

  if (target instanceof FormData) {
    return target;
  }

  const formData = new FormData();

  eachEntry(target, (key, value) => {
    formData.append(key, value instanceof Blob ? value : String(value));
  });

  return formData;
}

function eachEntry(target: unknown, fn: (key: string, value: unknown) => void) {
  if (!target || Array.isArray(target) || !isPlainObject(target)) {
    return;
  }

  for (const [key, value] of Object.entries(target)) {
    if (value !== undefined && value !== null) {
      if (Array.isArray(value)) {
        for (const $value of value) {
          if ($value !== undefined && $value !== null) {
            fn(key, $value);
          }
        }
      } else {
        fn(key, value);
      }
    }
  }
}
