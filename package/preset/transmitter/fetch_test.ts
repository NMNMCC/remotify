import { assertEquals, assertRejects } from "@std/assert";
import { fetchTransmitter } from "./fetch.ts";

// Mock fetch
const originalFetch = globalThis.fetch;

Deno.test({
	name: "fetchTransmitter success",
	fn: async () => {
		let received:
			| { input: RequestInfo | URL; init?: RequestInit }
			| undefined;
		globalThis.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
			received = { input, init };
			return Promise.resolve(
				new Response(new Uint8Array([1, 2, 3]), { status: 200 }),
			);
		};
		try {
			const tx = fetchTransmitter("https://api.example.com/rpc");
			const out = await tx({ foo: "bar" }, new AbortController().signal);
			assertEquals(Array.from(out), [1, 2, 3]);
			if (!received) { throw new Error("no fetch recorded"); }
			const r = received as {
				input: RequestInfo | URL;
				init?: RequestInit;
			};
			assertEquals(r.input, "https://api.example.com/rpc");
			assertEquals(r.init?.method, "POST");
			assertEquals(r.init?.headers, {
				"Content-Type": "application/json",
			});
			assertEquals(r.init?.body, JSON.stringify({ foo: "bar" }));
		} finally {
			globalThis.fetch = originalFetch;
		}
	},
});

Deno.test({
	name: "fetchTransmitter non-2xx throws",
	fn: async () => {
		globalThis.fetch = () =>
			Promise.resolve(new Response(null, { status: 500 }));
		try {
			const tx = fetchTransmitter("https://x");
			await assertRejects(
				() => tx({}, new AbortController().signal),
				Error,
				"HTTP error 500",
			);
		} finally {
			globalThis.fetch = originalFetch;
		}
	},
});
