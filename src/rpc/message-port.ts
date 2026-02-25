export interface RPCMessageEvent {
  data: unknown;
}

export interface RPCMessagePort {
  postMessage(message: unknown): void;
  addEventListener(event: "message", listener: (event: RPCMessageEvent) => void): void;
  removeEventListener(event: "message", listener: (event: RPCMessageEvent) => void): void;
}

export function isRPCMessagePort(target: unknown): target is RPCMessagePort {
  const candidate = target as RPCMessagePort;

  return Boolean(
    candidate &&
    candidate.postMessage &&
    candidate.addEventListener &&
    candidate.removeEventListener &&
    typeof candidate.postMessage === "function" &&
    typeof candidate.addEventListener === "function" &&
    typeof candidate.removeEventListener === "function",
  );
}
