// deno-lint-ignore-file no-explicit-any

import type { Codec, MaybePromise, Transmitter } from "./type.ts";

export type WithID<T> = T & { i: string };

export const remotify = <
	TCodec extends Codec<any, any, any>,
>(codec: TCodec) => {
	return {
		local: <TRequest, TResponse, TTransmitterArgs extends any[] = any[]>(
			transmitter: Transmitter<
				TTransmitterArgs,
				TCodec extends Codec<any, infer I, any> ? I : never,
				TCodec extends Codec<any, any, infer O> ? O : never
			>,
		) =>
		async (
			req: TRequest,
			...as: TTransmitterArgs
		): Promise<TResponse> => {
			const full: WithID<TRequest> = {
				...req,
				i: crypto.randomUUID(),
			};
			const wire = await codec.serializer(full);
			const remoteWire = await transmitter(wire, ...as);
			const resp: WithID<TResponse> = await codec.deserializer(
				codec.prepare ? await codec.prepare(remoteWire) : remoteWire,
			);
			if (!resp || resp.i !== full.i) {
				throw new Error("invalid response correlation");
			}
			return resp;
		},
		remote: <TRequest, TResponse>(
			handler: (req: WithID<TRequest>) => MaybePromise<TResponse>,
		) =>
		async (payload: any): Promise<any> => {
			const req: WithID<TRequest> = await codec.deserializer(payload);
			const resp = await handler(req);
			return codec.serializer({ ...resp, i: req.i });
		},
	};
};
