import { assertEquals } from "@std/assert";
import { json } from "./json.ts";

Deno.test("json codec serializer/deserializer roundtrip", () => {
	const input = { a: 1, b: "text", c: [1, 2, 3] };
	const wire = json.serializer(input);
	const out = json.deserializer(wire);
	assertEquals(out, input);
});

Deno.test("json codec prepare path", () => {
	const input = { hello: "world" };
	const wire = json.serializer(input);
	// simulate remote wire as Uint8Array
	const raw = new TextEncoder().encode(wire);
	const prepared = json.prepare!(raw) as unknown;
	assertEquals(JSON.stringify(prepared), JSON.stringify(input));
});
