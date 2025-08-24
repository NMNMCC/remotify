import { assertEquals } from "@std/assert";
import { msgpack } from "./msgpack.ts";

Deno.test("msgpack codec roundtrip", () => {
	const input = { x: 42, arr: [1, 2, 3], nested: { y: "z" } };
	const wire = msgpack.serializer(input);
	const out = msgpack.deserializer(wire as Uint8Array);
	assertEquals(out, input);
});
