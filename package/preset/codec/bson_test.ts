import { assertEquals } from "@std/assert";
import { bson } from "./bson.ts";

Deno.test("bson codec roundtrip", () => {
	const input = { a: 123, b: "str", c: { d: true } };
	const wire = bson.serializer(input);
	const out = bson.deserializer(wire as Uint8Array);
	assertEquals(out, input);
});
