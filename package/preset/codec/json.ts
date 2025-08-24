import type { Codec } from "@remotify/core/type";

export const json: Codec<string> = {
	serializer: (i) => JSON.stringify(i),
	deserializer: (i) => JSON.parse(i),

	prepare: (raw) => JSON.parse(new TextDecoder().decode(raw)),
};
