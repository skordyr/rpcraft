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
  | (string & {});

export type HTTPRequestParams = {
  [key: string]: unknown;
};

export type HTTPRequestData = unknown;

export type HTTPRequestHeaderValue = string | number | (string | number)[] | undefined;

export type HTTPRequestHeaders = {
  [key: string]: HTTPRequestHeaderValue;
};

export type HTTPRequestResponseType =
  | "ignore"
  | "text"
  | "json"
  | "binary"
  | "stream"
  | "stream-text"
  | "event-stream"
  | "event-stream-text"
  | "event-stream-json";

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
  responseType?: HTTPRequestResponseType;
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
    responseType = "json",
    timeout = 0,
    signal,
    stringifyData = DEFAULT_STRINGIFY_DATA,
    parseData = DEFAULT_PARSE_DATA,
    stringifyParams = DEFAULT_STRINGIFY_PARAMS,
    ...fetchOptions
  } = options;

  const isJsonData = Boolean(data && (Array.isArray(data) || isPlainObject(data)));
  const search = params && stringifyParams(params);
  const controller = new AbortController();

  const $url = search ? `${url}${search}` : url;
  const $body = isJsonData ? stringifyData(data) : (data as BodyInit);
  const $headers = isJsonData || headers ? new Headers(headers && toEntries(headers)) : undefined;
  const $signal = controller.signal;

  if ($headers && isJsonData && !$headers.has("Content-Type")) {
    $headers.set("Content-Type", "application/json");
  }

  const request = new Request($url, {
    ...fetchOptions,
    method,
    body: $body,
    headers: $headers,
    signal: $signal,
  });

  let closed = false;
  let isTimeout = false;
  let isAbort = false;
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
      request,
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
    response = await fetch(request);

    if (closed) {
      yield $abort();

      return;
    }

    if (response.ok) {
      switch (responseType) {
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
      }

      closed = true;

      $dispose();

      return;
    }

    let data;

    try {
      data = await response.text();

      disposeTimeout?.();

      data = parseData(data);
    } catch {}

    if (closed) {
      yield $abort();

      return;
    }

    closed = true;

    $dispose();

    yield $error(new Error(`The server responded with status "${response.status}".`), data);
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
  const init = toEntries(params);

  return new URLSearchParams(init).toString();
}

type HTTPRequestEntry = [key: string, value: string];

function toEntries(value: HTTPRequestParams | HTTPRequestHeaders) {
  return Object.entries(value).reduce<HTTPRequestEntry[]>((result, [key, value]) => {
    if (value !== undefined) {
      if (Array.isArray(value)) {
        for (const v of value) {
          result.push([key, String(v)]);
        }
      } else {
        result.push([key, String(value)]);
      }
    }

    return result;
  }, []);
}

function toHeaders(value: Headers) {
  const headers: HTTPRequestHeaders = {};

  value.forEach((value, key) => {
    const prevValue = headers[key];

    if (!prevValue) {
      headers[key] = value;

      return;
    }

    if (Array.isArray(prevValue)) {
      prevValue.push(value);

      return;
    }

    headers[key] = value;
  });

  return headers;
}
