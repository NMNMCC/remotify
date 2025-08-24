import { decode, encode } from "@msgpack/msgpack";
import type { Codec } from "@remotify/core/type";

export const msgpack: Codec<Uint8Array> = {
	serializer: encode,
	deserializer: decode,
};
