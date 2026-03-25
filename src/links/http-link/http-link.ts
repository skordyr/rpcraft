import type { Link, LinkOperation } from "../../link";
import type { Thunkable } from "../../shared/types";
import type { TemplateRenderOptions, TemplateVariables } from "../../template";
import type { Command, CommandName, CommandType, Context } from "../../types";
import type {
  HTTPRequestData,
  HTTPRequestHeaders,
  HTTPRequestMethod,
  HTTPRequestOptions,
  HTTPRequestParams,
  HTTPRequestResponseType,
  HTTPRequestResult,
} from "./request";

import { COMMAND_KNOWN_ERROR_DEFINITION, CommandError } from "../../error";
import { EMPTY_OBJECT, isPlainObject } from "../../shared/utils";
import { renderTemplate } from "../../template";
import { request } from "./request";

export const HTTP_LINK_KNOWN_ERROR_DEFINITION = {
  400: {
    code: "BAD_REQUEST",
    message: COMMAND_KNOWN_ERROR_DEFINITION.BAD_REQUEST.message as string,
  },
  401: {
    code: "UNAUTHORIZED",
    message: COMMAND_KNOWN_ERROR_DEFINITION.UNAUTHORIZED.message as string,
  },
  403: {
    code: "FORBIDDEN",
    message: COMMAND_KNOWN_ERROR_DEFINITION.FORBIDDEN.message as string,
  },
  404: {
    code: "NOT_FOUND",
    message: COMMAND_KNOWN_ERROR_DEFINITION.NOT_FOUND.message as string,
  },
  405: {
    code: "METHOD_NOT_SUPPORTED",
    message: COMMAND_KNOWN_ERROR_DEFINITION.METHOD_NOT_SUPPORTED.message as string,
  },
  406: {
    code: "NOT_ACCEPTABLE",
    message: COMMAND_KNOWN_ERROR_DEFINITION.NOT_ACCEPTABLE.message as string,
  },
  408: {
    code: "TIMEOUT",
    message: COMMAND_KNOWN_ERROR_DEFINITION.TIMEOUT.message as string,
  },
  409: {
    code: "CONFLICT",
    message: COMMAND_KNOWN_ERROR_DEFINITION.CONFLICT.message as string,
  },
  412: {
    code: "PRECONDITION_FAILED",
    message: COMMAND_KNOWN_ERROR_DEFINITION.PRECONDITION_FAILED.message as string,
  },
  413: {
    code: "PAYLOAD_TOO_LARGE",
    message: COMMAND_KNOWN_ERROR_DEFINITION.PAYLOAD_TOO_LARGE.message as string,
  },
  415: {
    code: "UNSUPPORTED_MEDIA_TYPE",
    message: COMMAND_KNOWN_ERROR_DEFINITION.UNSUPPORTED_MEDIA_TYPE.message as string,
  },
  422: {
    code: "UNPROCESSABLE_CONTENT",
    message: COMMAND_KNOWN_ERROR_DEFINITION.UNPROCESSABLE_CONTENT.message as string,
  },
  429: {
    code: "TOO_MANY_REQUESTS",
    message: COMMAND_KNOWN_ERROR_DEFINITION.TOO_MANY_REQUESTS.message as string,
  },
  499: {
    code: "CLIENT_CLOSED_REQUEST",
    message: COMMAND_KNOWN_ERROR_DEFINITION.CLIENT_CLOSED_REQUEST.message as string,
  },
  500: {
    code: "INTERNAL_SERVER_ERROR",
    message: COMMAND_KNOWN_ERROR_DEFINITION.INTERNAL_SERVER_ERROR.message as string,
  },
  501: {
    code: "NOT_IMPLEMENTED",
    message: COMMAND_KNOWN_ERROR_DEFINITION.NOT_IMPLEMENTED.message as string,
  },
  502: {
    code: "BAD_GATEWAY",
    message: COMMAND_KNOWN_ERROR_DEFINITION.BAD_GATEWAY.message as string,
  },
  503: {
    code: "SERVICE_UNAVAILABLE",
    message: COMMAND_KNOWN_ERROR_DEFINITION.SERVICE_UNAVAILABLE.message as string,
  },
  504: {
    code: "GATEWAY_TIMEOUT",
    message: COMMAND_KNOWN_ERROR_DEFINITION.GATEWAY_TIMEOUT.message as string,
  },
} as const;

export type HTTPLinkKnownStatus = keyof typeof HTTP_LINK_KNOWN_ERROR_DEFINITION;

export type HTTPLinkStatus = HTTPLinkKnownStatus | (number & {});

export type HTTPLinkEndpoint = string;

export type HTTPLinkPath = string;

export type HTTPLinkMethod = HTTPRequestMethod;

export type HTTPLinkVariables = TemplateVariables;

export type HTTPLinkParams = HTTPRequestParams;

export type HTTPLinkData = HTTPRequestData;

export type HTTPLinkHeaders = HTTPRequestHeaders;

export type HTTPLinkResponseType = HTTPRequestResponseType;

export type HTTPLinkContext = {
  timeout?: number;
  signal?: AbortSignal;
};

export const HTTP_LINK_CONTEXT: unique symbol = /* @__PURE__ */ Symbol("HTTPLinkContext");

export type HTTPLinkOutContext = {
  [HTTP_LINK_CONTEXT]?: {
    result?: HTTPRequestResult;
  };
};

export type HTTPLinkMeta = {
  endpoint: HTTPLinkEndpoint;
  path: HTTPLinkPath;
  method: HTTPLinkMethod;
  variables?: HTTPLinkVariables;
  params?: HTTPLinkParams;
  data?: HTTPLinkData;
  headers?: HTTPLinkHeaders;
  responseType?: HTTPLinkResponseType;
  timeout?: number;
};

export type HTTPLinkInput = {
  variables?: HTTPLinkVariables;
  params?: HTTPLinkParams;
  data?: HTTPLinkData;
  headers?: HTTPLinkHeaders;
};

export type HTTPLinkOutput = {
  data: HTTPLinkData;
  headers: HTTPLinkHeaders;
  status: HTTPLinkStatus;
};

export type HTTPLinkError = {
  data?: HTTPLinkData;
  headers?: HTTPLinkHeaders;
  status?: HTTPLinkStatus;
};

export type HTTPLinkCommand = Command<
  CommandType,
  CommandName,
  HTTPLinkMeta,
  HTTPLinkInput | undefined,
  HTTPLinkOutput,
  HTTPLinkError
>;

export interface HTTPLinkOptions<TContext extends Context> {
  endpoint?: Thunkable<
    (
      operation: LinkOperation<HTTPLinkContext & TContext>,
    ) => HTTPLinkEndpoint | { [endpoint: HTTPLinkEndpoint]: HTTPLinkEndpoint }
  >;
  variables?: Thunkable<
    (operation: LinkOperation<HTTPLinkContext & TContext>) => HTTPLinkVariables | void
  >;
  params?: Thunkable<
    (operation: LinkOperation<HTTPLinkContext & TContext>) => HTTPLinkParams | void
  >;
  data?: Thunkable<
    (operation: LinkOperation<HTTPLinkContext & TContext>) => HTTPRequestData | void
  >;
  headers?: Thunkable<
    (operation: LinkOperation<HTTPLinkContext & TContext>) => HTTPRequestHeaders | void
  >;
  template?: TemplateRenderOptions;
  request?: Omit<HTTPRequestOptions, "url" | "method" | "params" | "data" | "headers" | "signal">;
}

export function HTTPLink<TContext extends Context>(
  options: HTTPLinkOptions<TContext> = EMPTY_OBJECT,
): Link<HTTPLinkContext & TContext, HTTPLinkContext & HTTPLinkOutContext & TContext> {
  const {
    endpoint,
    variables,
    params,
    data,
    headers,
    template: templateOptions,
    request: requestOptions,
  } = options;

  const getGlobalEndpoint = typeof endpoint === "function" ? endpoint : () => endpoint;
  const getGlobalVariables = typeof variables === "function" ? variables : () => variables;
  const getGlobalParams = typeof params === "function" ? params : () => params;
  const getGlobalData = typeof data === "function" ? data : () => data;
  const getGlobalHeaders = typeof headers === "function" ? headers : () => headers;

  return async function* (operation): AsyncGenerator<any> {
    const $operation = operation as LinkOperation<HTTPLinkContext & HTTPLinkOutContext & TContext>;

    const { context, command } = $operation;

    const { signal, timeout: contextTimeout } = context;
    const {
      meta: {
        method,
        responseType,
        endpoint: metaEndpoint,
        path: metaPath,
        variables: metaVariables,
        params: metaParams,
        data: metaData,
        headers: metaHeaders,
        timeout: metaTimeout,
      },
      input: {
        variables: inputVariables,
        params: inputParams,
        data: inputData,
        headers: inputHeaders,
      } = EMPTY_OBJECT as HTTPLinkInput,
    } = command as HTTPLinkCommand;

    const globalEndpoint = getGlobalEndpoint($operation);
    const globalVariables = getGlobalVariables($operation);
    const globalParams = getGlobalParams($operation);
    const globalData = getGlobalData($operation);
    const globalHeaders = getGlobalHeaders($operation);

    let endpoint;

    if (globalEndpoint) {
      endpoint =
        typeof globalEndpoint === "string"
          ? globalEndpoint
          : globalEndpoint[metaEndpoint] || metaEndpoint;
    } else {
      endpoint = metaEndpoint;
    }

    const variables = (globalVariables || metaVariables || inputVariables) && {
      ...globalVariables,
      ...metaVariables,
      ...inputVariables,
    };
    const path = renderTemplate(metaPath, variables, templateOptions);
    const url = endpoint ? `${endpoint.replace(/\/$/, "")}/${path.replace(/^\//, "")}` : path;
    const params = (globalParams || metaParams || inputParams) && {
      ...globalParams,
      ...metaParams,
      ...inputParams,
    };
    const data =
      (globalData || metaData || inputData) && mergeData(globalData, metaData, inputData);
    const headers = (globalHeaders || metaHeaders || inputHeaders) && {
      ...globalHeaders,
      ...metaHeaders,
      ...inputHeaders,
    };
    const timeout = contextTimeout ?? metaTimeout ?? requestOptions?.timeout;

    for await (const result of request({
      ...requestOptions,
      url,
      method,
      params,
      data,
      headers,
      responseType,
      timeout,
      signal,
    })) {
      $operation.context[HTTP_LINK_CONTEXT] = {
        result,
      };

      if (!result.success) {
        const { error, isTimeout, isAbort, data, headers, status } = result;

        let $status: HTTPLinkStatus | undefined;

        if (isTimeout) {
          $status = 408;
        } else if (isAbort) {
          $status = 499;
        } else {
          $status = status;
        }

        const definition =
          HTTP_LINK_KNOWN_ERROR_DEFINITION[$status as HTTPLinkKnownStatus] ||
          HTTP_LINK_KNOWN_ERROR_DEFINITION[500];

        throw CommandError.from(error, {
          code: definition.code,
          message: definition.message,
          data: {
            data,
            headers,
            status,
          } satisfies HTTPLinkError,
        });
      }

      const { data, headers, status } = result;

      yield {
        data,
        headers,
        status,
      } satisfies HTTPLinkOutput;
    }
  };
}

export function isHTTPLinkCommand(target: unknown): target is HTTPLinkCommand {
  const candidate = target as HTTPLinkCommand;

  return Boolean(
    candidate &&
    candidate.meta &&
    candidate.meta.endpoint &&
    candidate.meta.path &&
    candidate.meta.method &&
    typeof candidate.meta.endpoint === "string" &&
    typeof candidate.meta.path === "string" &&
    typeof candidate.meta.method === "string",
  );
}

function mergeData(...data: unknown[]): unknown {
  let merged = data.shift();

  for (const $data of data) {
    if ($data !== undefined) {
      if (
        isPlainObject($data) &&
        !Array.isArray($data) &&
        isPlainObject(merged) &&
        !Array.isArray(merged)
      ) {
        merged = {
          ...(merged as any),
          ...$data,
        };
      } else {
        merged = $data;
      }
    }
  }

  return merged;
}
