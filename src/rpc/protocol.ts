import { COMMAND_KNOWN_ERROR_DEFINITION } from "../error";
import { IDENTITY } from "../shared/utils";

export const COMMAND_KNOWN_RPC_ERROR_DEFINITION = {
  BAD_REQUEST: {
    code: -32400,
    message: COMMAND_KNOWN_ERROR_DEFINITION.BAD_REQUEST.message as string,
  },
  UNAUTHORIZED: {
    code: -32401,
    message: COMMAND_KNOWN_ERROR_DEFINITION.UNAUTHORIZED.message as string,
  },
  FORBIDDEN: {
    code: -32403,
    message: COMMAND_KNOWN_ERROR_DEFINITION.FORBIDDEN.message as string,
  },
  NOT_FOUND: {
    code: -32404,
    message: COMMAND_KNOWN_ERROR_DEFINITION.NOT_FOUND.message as string,
  },
  METHOD_NOT_SUPPORTED: {
    code: -32405,
    message: COMMAND_KNOWN_ERROR_DEFINITION.METHOD_NOT_SUPPORTED.message as string,
  },
  NOT_ACCEPTABLE: {
    code: -32406,
    message: COMMAND_KNOWN_ERROR_DEFINITION.NOT_ACCEPTABLE.message as string,
  },
  TIMEOUT: {
    code: -32408,
    message: COMMAND_KNOWN_ERROR_DEFINITION.TIMEOUT.message as string,
  },
  CONFLICT: {
    code: -32409,
    message: COMMAND_KNOWN_ERROR_DEFINITION.CONFLICT.message as string,
  },
  PRECONDITION_FAILED: {
    code: -32412,
    message: COMMAND_KNOWN_ERROR_DEFINITION.PRECONDITION_FAILED.message as string,
  },
  PAYLOAD_TOO_LARGE: {
    code: -32413,
    message: COMMAND_KNOWN_ERROR_DEFINITION.PAYLOAD_TOO_LARGE.message as string,
  },
  UNSUPPORTED_MEDIA_TYPE: {
    code: -32415,
    message: COMMAND_KNOWN_ERROR_DEFINITION.UNSUPPORTED_MEDIA_TYPE.message as string,
  },
  UNPROCESSABLE_CONTENT: {
    code: -32422,
    message: COMMAND_KNOWN_ERROR_DEFINITION.UNPROCESSABLE_CONTENT.message as string,
  },
  TOO_MANY_REQUESTS: {
    code: -32429,
    message: COMMAND_KNOWN_ERROR_DEFINITION.TOO_MANY_REQUESTS.message as string,
  },
  CLIENT_CLOSED_REQUEST: {
    code: -32499,
    message: COMMAND_KNOWN_ERROR_DEFINITION.CLIENT_CLOSED_REQUEST.message as string,
  },
  INTERNAL_SERVER_ERROR: {
    code: -32500,
    message: COMMAND_KNOWN_ERROR_DEFINITION.INTERNAL_SERVER_ERROR.message as string,
  },
  NOT_IMPLEMENTED: {
    code: -32501,
    message: COMMAND_KNOWN_ERROR_DEFINITION.NOT_IMPLEMENTED.message as string,
  },
  BAD_GATEWAY: {
    code: -32502,
    message: COMMAND_KNOWN_ERROR_DEFINITION.BAD_GATEWAY.message as string,
  },
  SERVICE_UNAVAILABLE: {
    code: -32503,
    message: COMMAND_KNOWN_ERROR_DEFINITION.SERVICE_UNAVAILABLE.message as string,
  },
  GATEWAY_TIMEOUT: {
    code: -32504,
    message: COMMAND_KNOWN_ERROR_DEFINITION.GATEWAY_TIMEOUT.message as string,
  },
} as const;

export const RPC_KNOWN_ERROR_DEFINITION = {
  [-32700]: {
    code: "PARSE_ERROR",
    message: "Parse Error" as string,
  },
  [-32600]: {
    code: "INVALID_REQUEST",
    message: "Invalid Request" as string,
  },
  [-32601]: {
    code: "METHOD_NOT_FOUND",
    message: "Method Not Found" as string,
  },
  [-32602]: {
    code: "INVALID_PARAMS",
    message: "Invalid Params" as string,
  },
  [-32603]: {
    code: "INTERNAL_ERROR",
    message: "Internal Error" as string,
  },
  [-32400]: {
    code: "BAD_REQUEST",
    message: COMMAND_KNOWN_ERROR_DEFINITION.BAD_REQUEST.message as string,
  },
  [-32401]: {
    code: "UNAUTHORIZED",
    message: COMMAND_KNOWN_ERROR_DEFINITION.UNAUTHORIZED.message as string,
  },
  [-32403]: {
    code: "FORBIDDEN",
    message: COMMAND_KNOWN_ERROR_DEFINITION.FORBIDDEN.message as string,
  },
  [-32404]: {
    code: "NOT_FOUND",
    message: COMMAND_KNOWN_ERROR_DEFINITION.NOT_FOUND.message as string,
  },
  [-32405]: {
    code: "METHOD_NOT_ALLOWED",
    message: COMMAND_KNOWN_ERROR_DEFINITION.METHOD_NOT_SUPPORTED.message as string,
  },
  [-32406]: {
    code: "NOT_ACCEPTABLE",
    message: COMMAND_KNOWN_ERROR_DEFINITION.NOT_ACCEPTABLE.message as string,
  },
  [-32408]: {
    code: "REQUEST_TIMEOUT",
    message: COMMAND_KNOWN_ERROR_DEFINITION.TIMEOUT.message as string,
  },
  [-32409]: {
    code: "CONFLICT",
    message: COMMAND_KNOWN_ERROR_DEFINITION.CONFLICT.message as string,
  },
  [-32412]: {
    code: "PRECONDITION_FAILED",
    message: COMMAND_KNOWN_ERROR_DEFINITION.PRECONDITION_FAILED.message as string,
  },
  [-32413]: {
    code: "PAYLOAD_TOO_LARGE",
    message: COMMAND_KNOWN_ERROR_DEFINITION.PAYLOAD_TOO_LARGE.message as string,
  },
  [-32415]: {
    code: "UNSUPPORTED_MEDIA_TYPE",
    message: COMMAND_KNOWN_ERROR_DEFINITION.UNSUPPORTED_MEDIA_TYPE.message as string,
  },
  [-32422]: {
    code: "UNPROCESSABLE_CONTENT",
    message: COMMAND_KNOWN_ERROR_DEFINITION.UNPROCESSABLE_CONTENT.message as string,
  },
  [-32429]: {
    code: "TOO_MANY_REQUESTS",
    message: COMMAND_KNOWN_ERROR_DEFINITION.TOO_MANY_REQUESTS.message as string,
  },
  [-32499]: {
    code: "CLIENT_CLOSED_REQUEST",
    message: COMMAND_KNOWN_ERROR_DEFINITION.CLIENT_CLOSED_REQUEST.message as string,
  },
  [-32500]: {
    code: "INTERNAL_SERVER_ERROR",
    message: COMMAND_KNOWN_ERROR_DEFINITION.INTERNAL_SERVER_ERROR.message as string,
  },
  [-32501]: {
    code: "NOT_IMPLEMENTED",
    message: COMMAND_KNOWN_ERROR_DEFINITION.NOT_IMPLEMENTED.message as string,
  },
  [-32502]: {
    code: "BAD_GATEWAY",
    message: COMMAND_KNOWN_ERROR_DEFINITION.BAD_GATEWAY.message as string,
  },
  [-32503]: {
    code: "SERVICE_UNAVAILABLE",
    message: COMMAND_KNOWN_ERROR_DEFINITION.SERVICE_UNAVAILABLE.message as string,
  },
  [-32504]: {
    code: "GATEWAY_TIMEOUT",
    message: COMMAND_KNOWN_ERROR_DEFINITION.GATEWAY_TIMEOUT.message as string,
  },
} as const;

export type RPCKnownErrorCode = keyof typeof RPC_KNOWN_ERROR_DEFINITION;

export type RPCErrorCode = RPCKnownErrorCode | (number & {});

export type JSONRPCVersion = "2";

export type RPCId = string | number;

export interface RPCParams {
  path: string;
  input?: unknown;
}

export interface RPCDataResult {
  type: "data";
  data: unknown;
}

export interface RPCStartedResult {
  type: "started";
  data?: undefined;
}

export interface RPCStoppedResult {
  type: "stopped";
  data?: undefined;
}

export interface RPCError {
  code: RPCErrorCode;
  message: string;
  data?: unknown;
}

export interface RPCQueryRequestMessage {
  jsonrpc?: JSONRPCVersion;
  id: RPCId;
  method: "query";
  params: RPCParams;
}

export interface RPCMutationRequestMessage {
  jsonrpc?: JSONRPCVersion;
  id: RPCId;
  method: "mutation";
  params: RPCParams;
}

export interface RPCSubscriptionRequestMessage {
  jsonrpc?: JSONRPCVersion;
  id: RPCId;
  method: "subscription";
  params: RPCParams;
}

export interface RPCStopSubscriptionRequestMessage {
  jsonrpc?: JSONRPCVersion;
  id: RPCId;
  method: "subscription.stop";
  params?: undefined;
}

export interface RPCDataResponseMessage {
  jsonrpc?: JSONRPCVersion;
  id: RPCId;
  result: RPCDataResult;
}

export interface RPCStartedResponseMessage {
  jsonrpc?: JSONRPCVersion;
  id: RPCId;
  result: RPCStartedResult;
}

export interface RPCStoppedResponseMessage {
  jsonrpc?: JSONRPCVersion;
  id: RPCId;
  result: RPCStoppedResult;
}

export interface RPCErrorResponseMessage {
  jsonrpc?: JSONRPCVersion;
  id: RPCId | null;
  error: RPCError;
}

export type RPCRequestMessage =
  | RPCQueryRequestMessage
  | RPCMutationRequestMessage
  | RPCSubscriptionRequestMessage
  | RPCStopSubscriptionRequestMessage;

export type RPCResponseMessage =
  | RPCDataResponseMessage
  | RPCStartedResponseMessage
  | RPCStoppedResponseMessage
  | RPCErrorResponseMessage;

export type RPCMessage = RPCRequestMessage | RPCResponseMessage;

export function isJSONRPCVersion(target: unknown): target is JSONRPCVersion | undefined {
  const candidate = target as JSONRPCVersion | undefined;

  return candidate === undefined || candidate === "2";
}

export function isRPCId(target: unknown): target is RPCId {
  const candidate = target as RPCId;

  const type = typeof candidate;

  return type === "number" || type === "string";
}

export function isRPCParams(target: unknown): target is RPCParams {
  const candidate = target as RPCParams;

  return Boolean(candidate && typeof candidate.path === "string");
}

export function isRPCDataResult(target: unknown): target is RPCDataResult {
  const candidate = target as RPCDataResult;

  return Boolean(candidate && candidate.type === "data");
}

export function isRPCStartedResult(target: unknown): target is RPCStartedResult {
  const candidate = target as RPCStartedResult;

  return Boolean(candidate && candidate.type === "started");
}

export function isRPCStoppedResult(target: unknown): target is RPCStoppedResult {
  const candidate = target as RPCStoppedResult;

  return Boolean(candidate && candidate.type === "stopped");
}

export function isRPCError(target: unknown): target is RPCError {
  const candidate = target as RPCError;

  return Boolean(
    candidate && typeof candidate.code === "number" && typeof candidate.message === "string",
  );
}

export function isRPCQueryRequestMessage(target: unknown): target is RPCQueryRequestMessage {
  const candidate = target as RPCQueryRequestMessage;

  return Boolean(
    candidate &&
    candidate.method === "query" &&
    isRPCId(candidate.id) &&
    isRPCParams(candidate.params) &&
    isJSONRPCVersion(candidate.jsonrpc),
  );
}

export function isRPCMutationRequestMessage(target: unknown): target is RPCMutationRequestMessage {
  const candidate = target as RPCMutationRequestMessage;

  return Boolean(
    candidate &&
    candidate.method === "mutation" &&
    isRPCId(candidate.id) &&
    isRPCParams(candidate.params) &&
    isJSONRPCVersion(candidate.jsonrpc),
  );
}

export function isRPCSubscriptionRequestMessage(
  target: unknown,
): target is RPCSubscriptionRequestMessage {
  const candidate = target as RPCSubscriptionRequestMessage;

  return Boolean(
    candidate &&
    candidate.method === "subscription" &&
    isRPCId(candidate.id) &&
    isRPCParams(candidate.params) &&
    isJSONRPCVersion(candidate.jsonrpc),
  );
}

export function isRPCStopSubscriptionRequestMessage(
  target: unknown,
): target is RPCStopSubscriptionRequestMessage {
  const candidate = target as RPCStopSubscriptionRequestMessage;

  return Boolean(
    candidate &&
    candidate.method === "subscription.stop" &&
    isRPCId(candidate.id) &&
    isJSONRPCVersion(candidate.jsonrpc),
  );
}

export function isRPCDataResponseMessage(target: unknown): target is RPCDataResponseMessage {
  const candidate = target as RPCDataResponseMessage;

  return Boolean(
    candidate &&
    isRPCDataResult(candidate.result) &&
    isRPCId(candidate.id) &&
    isJSONRPCVersion(candidate.jsonrpc),
  );
}

export function isRPCStartedResponseMessage(target: unknown): target is RPCStartedResponseMessage {
  const candidate = target as RPCStartedResponseMessage;

  return Boolean(
    candidate &&
    isRPCStartedResult(candidate.result) &&
    isRPCId(candidate.id) &&
    isJSONRPCVersion(candidate.jsonrpc),
  );
}

export function isRPCStoppedResponseMessage(target: unknown): target is RPCStoppedResponseMessage {
  const candidate = target as RPCStoppedResponseMessage;

  return Boolean(
    candidate &&
    isRPCStoppedResult(candidate.result) &&
    isRPCId(candidate.id) &&
    isJSONRPCVersion(candidate.jsonrpc),
  );
}

export function isRPCErrorResponseMessage(target: unknown): target is RPCErrorResponseMessage {
  const candidate = target as RPCErrorResponseMessage;

  return Boolean(
    candidate &&
    isRPCError(candidate.error) &&
    (candidate.id === null || isRPCId(candidate.id)) &&
    isJSONRPCVersion(candidate.jsonrpc),
  );
}

export function isRPCRequestMessage(target: unknown): target is RPCRequestMessage {
  const candidate = target as RPCRequestMessage;

  return Boolean(
    candidate &&
    (candidate.method === "subscription.stop" ||
      ((candidate.method === "query" ||
        candidate.method === "mutation" ||
        candidate.method === "subscription") &&
        isRPCParams(candidate.params))) &&
    isRPCId(candidate.id) &&
    isJSONRPCVersion(candidate.jsonrpc),
  );
}

export function isRPCResponseMessage(target: unknown): target is RPCResponseMessage {
  const candidate = target as RPCResponseMessage;

  return Boolean(
    candidate &&
    ("result" in candidate
      ? (candidate.result.type === "data" ||
          candidate.result.type === "started" ||
          candidate.result.type === "stopped") &&
        isRPCId(candidate.id)
      : isRPCError(candidate.error) && (candidate.id === null || isRPCId(candidate.id))) &&
    isJSONRPCVersion(candidate.jsonrpc),
  );
}

export function isRPCMessage(target: unknown): target is RPCMessage {
  return isRPCRequestMessage(target) || isRPCResponseMessage(target);
}

export class RPCIdGenerator {
  private _value: number = 0;

  private _format: (counter: number) => RPCId;

  constructor(prefix?: string) {
    if (prefix) {
      this._format = (counter) => {
        return `${prefix}:${counter}`;
      };
    } else {
      this._format = IDENTITY;
    }
  }

  next(): RPCId {
    this._value += 1;

    return this._format(this._value);
  }
}
