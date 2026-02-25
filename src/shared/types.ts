export type Simplify<T> = { [KeyType in keyof T]: T[KeyType] } & {};

export type Thunkable<T> = T extends (...args: any[]) => infer R ? R | T : T;
