import { assertEquals, assertRejects } from "@std/assert";
import { remotify } from "./lite.ts";
import type { Codec, Transmitter } from "./type.ts";

// Identity codec for lite tests – preserve structure generically
const identity: Codec<unknown, unknown, unknown> = {
	serializer: (i) => i,
	deserializer: (i) => i,
};

Deno.test("lite.remotify basic round trip", async () => {
	const { local, remote } = remotify(identity);

	type Req = { value: number };
	type Res = { result: number };

	const remoteHandler = remote<Req, Res>((req) => ({
		result: req.value + 1,
	}));

	const tx: Transmitter = async (payload) => {
		return await remoteHandler(payload);
	};

	const call = local<Req, Res>(tx);
	const out = await call({ value: 41 });
	assertEquals(out.result, 42);
});

Deno.test("lite.remotify correlation id mismatch throws", async () => {
	const { local, remote } = remotify(identity);

	type Req = { n: number };
	type Res = { n: number };

	const remoteHandler = remote<Req, Res>((req) => ({ n: req.n + 1 }));

	const badTx: Transmitter = async (payload: unknown) => {
		const resp = await remoteHandler(payload as unknown);
		// Corrupt correlation id (breach typing intentionally for test)
		if (resp && typeof resp === "object") {
			(resp as Record<string, unknown>).i = "broken";
		}
		return resp as unknown;
	};

	const call = local<Req, Res>(badTx);
	await assertRejects(
		() => call({ n: 1 }),
		Error,
		"invalid response correlation",
	);
});
