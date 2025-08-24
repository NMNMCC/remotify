import { BSON } from "bson";
import type { Codec } from "@remotify/core/type";

export const bson: Codec<Uint8Array> = {
	serializer: (input) => BSON.serialize(input),
	deserializer: (input) => BSON.deserialize(input),
};
