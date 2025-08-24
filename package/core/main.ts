// deno-lint-ignore-file no-explicit-any

import * as l from "./lite.ts";
import type { Codec, Transmitter } from "./type.ts";
import { wait } from "./util.ts";

export type MaybePromise<T> = T | Promise<T>;

export type RemotifyRequest =
	| { o: "get"; p: string }
	| { o: "set"; p: string; v: any }
	| { o: "call"; p: string; a: any[] }
	| { o: "delete"; p: string }
	| { o: "keys" };

export type RemotifyController<
	TObject extends Record<string, any>,
	TExtraArgs extends any[] = any[],
> = {
	get: <K extends keyof TObject>(
		prop: K,
		...as: TExtraArgs
	) => Promise<TObject[K]>;
	set: <K extends keyof TObject>(
		prop: K,
		value: TObject[K],
		...as: TExtraArgs
	) => Promise<void>;
	call: <K extends keyof TObject>(
		prop: K,
		args: Parameters<TObject[K]>,
		...as: TExtraArgs
	) => Promise<ReturnType<TObject[K]>>;
	delete: (prop: keyof TObject, ...as: TExtraArgs) => Promise<boolean>;
	keys: (...as: TExtraArgs) => Promise<(keyof TObject)[]>;
};

export type RemotifyResponse =
	| { ok: true; v: any }
	| { ok: false; e: { n: string; m: string } };

export const remotify = <
	TObject extends Record<string, any>,
	TCodec extends Codec<any, any, any>,
>(codec: TCodec) => {
	const lite = l.remotify<TCodec>(codec);

	return {
		local: <TTransmitterArgs extends any[] = any[]>(
			transmitter: Transmitter<
				TTransmitterArgs,
				TCodec extends Codec<any, infer I, any> ? I : never,
				TCodec extends Codec<any, any, infer O> ? O : never
			>,
		) => {
			const lg = lite.local<
				RemotifyRequest,
				RemotifyResponse,
				TTransmitterArgs
			>(
				transmitter,
			);
			const go = async (
				req: RemotifyRequest,
				...as: TTransmitterArgs
			) => {
				const resp = await lg(req, ...as);
				if (resp.ok) {
					return resp.v;
				}
				const err = new Error(resp.e?.m || "remote error");
				(err as any).name = resp.e?.n || "RemoteError";
				throw err;
			};

			return {
				get: <K extends keyof TObject>(
					prop: K,
					...as: TTransmitterArgs
				) => go({ o: "get", p: String(prop) }, ...as),
				set: <K extends keyof TObject>(
					prop: K,
					value: TObject[K],
					...as: TTransmitterArgs
				) => go(
					{ o: "set", p: String(prop), v: value },
					...as,
				),
				call: <K extends keyof TObject>(
					prop: K,
					args: Parameters<TObject[K]>,
					...as: TTransmitterArgs
				) => go(
					{ o: "call", p: String(prop), a: args },
					...as,
				),
				delete: (prop: keyof TObject, ...as: TTransmitterArgs) =>
					go({ o: "delete", p: String(prop) }, ...as),
				keys: (...as: TTransmitterArgs) => go({ o: "keys" }, ...as),
			} as RemotifyController<TObject, TTransmitterArgs>;
		},
		remote: (obj: TObject, error?: (err: unknown) => void) =>
			lite.remote<RemotifyRequest, RemotifyResponse>(
				async (req) => {
					try {
						switch (req.o) {
							case "get": {
								const v = obj[req.p as keyof TObject];
								return { ok: true, v };
							}
							case "set": {
								(obj as any)[req.p] = req.v;
								return {
									ok: true,
									v: (obj as any)[req.p],
								};
							}
							case "call": {
								const fn = obj[req.p as keyof TObject];
								if (typeof fn !== "function") {
									throw new TypeError(
										`'${req.p}' is not callable`,
									);
								}
								const result = await wait((fn as any)(
									...(req as any).a ?? [],
								));
								return { ok: true, v: result };
							}
							case "delete": {
								return {
									ok: true,
									v: (delete (obj as any)[req.p]),
								};
							}
							case "keys": {
								return {
									ok: true,
									v: Object.keys(obj),
								};
							}
							default:
								throw new Error("unknown op");
						}
					} catch (err) {
						error?.(err);
						return {
							ok: false,
							e: {
								n: (err as any)?.name ?? "Error",
								m: (err as any)?.message ?? String(err),
							},
						};
					}
				},
			),
	};
};
