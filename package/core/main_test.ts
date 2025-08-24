import { assertEquals, assertRejects } from "@std/assert";
import { remotify } from "./main.ts";
import { json } from "@remotify/preset"; // via aggregated exports
import type { Transmitter } from "./type.ts";

// Helper to build a loopback transmitter for the higher-level remotify
function buildLoopback<TObj extends Record<string, unknown>>(obj: TObj) {
	const r = remotify<TObj, typeof json>(json);
	const remote = r.remote(obj, () => {});

	// Transmitter: send string (request) -> receive Uint8Array (prepared response)
	const tx: Transmitter = async (wire: string) => {
		const respWire = await remote(wire);
		// json.prepare expects Uint8Array raw => convert string -> Uint8Array of its JSON string
		return new TextEncoder().encode(JSON.stringify(respWire));
	};

	return r.local(tx);
}

Deno.test("main.remotify get/set/call/delete/keys lifecycle", async () => {
	const target = {
		a: 1,
		b: 2,
		sum(x: number, y: number) {
			return x + y;
		},
		asyncMul(x: number, y: number) {
			return Promise.resolve(x * y);
		},
	};

	const ctrl = buildLoopback(target);

	// get
	assertEquals(await ctrl.get("a"), 1);

	// set
	await ctrl.set("b", 10);
	assertEquals(target.b, 10);

	// call sync
	assertEquals(await ctrl.call("sum", [2, 3]), 5);

	// call async
	assertEquals(await ctrl.call("asyncMul", [3, 4]), 12);

	// keys
	const ks = await ctrl.keys();
	ks.sort();
	assertEquals(ks, ["a", "asyncMul", "b", "sum"].sort());

	// delete
	const del = await ctrl.delete("a");
	assertEquals(del, true);
	assertEquals("a" in target, false);
});

Deno.test("main.remotify propagates remote errors (non-callable)", async () => {
	const target: { x: number } = { x: 1 }; // no callable at 'x'
	const ctrl = buildLoopback(target);
	await assertRejects(
		() =>
			(ctrl as unknown as {
				call: (k: string, a: unknown[]) => Promise<unknown>;
			}).call("x", []),
		Error,
		"is not callable",
	);
});

Deno.test("main.remotify handler thrown error surfaced", async () => {
	const target = {
		fail() {
			throw new RangeError("boom");
		},
	};
	const ctrl = buildLoopback(target);
	await assertRejects(() => ctrl.call("fail", []), Error, "boom");
});
