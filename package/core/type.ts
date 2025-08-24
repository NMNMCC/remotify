// deno-lint-ignore-file no-explicit-any
export type MaybePromise<T> = T | Promise<MaybePromise<T>>;

export type Wait<T extends MaybePromise<any>> = T extends Promise<infer U>
	? Wait<U>
	: T;

export type Codec<M extends any = any, I = any, O = any> = {
	serializer: (input: I) => M;
	deserializer: (input: M) => O;

	prepare?: (raw: Uint8Array) => M;
};

export type Transmitter<A extends any[] = any[], I = any, O = any> = (
	input: I,
	...as: A
) => MaybePromise<O>;
