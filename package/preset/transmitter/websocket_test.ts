import { assertEquals } from "@std/assert";
import { websocketTransmitter } from "./websocket.ts";

// Minimal structural WebSocketConnection mock
interface MinimalWebSocketConnection {
	readable: ReadableStream<unknown>;
	writable: WritableStream<unknown>;
	// properties not used by transmitter but required structurally
	protocol?: string;
	extensions?: string;
}

Deno.test("websocketTransmitter binary passthrough", async () => {
	let written: unknown;
	const writable = new WritableStream({
		write(chunk) {
			written = chunk;
		},
	});
	const response = new Uint8Array([9, 8, 7]);
	const readable = new ReadableStream({
		start(controller) {
			controller.enqueue(response);
			controller.close();
		},
	});
	const tx = websocketTransmitter(
		{
			readable,
			writable,
		} as MinimalWebSocketConnection as unknown as WebSocketConnection,
	);
	const out = await tx({ hello: "world" });
	assertEquals(written, { hello: "world" });
	assertEquals(Array.from(out as Uint8Array), [9, 8, 7]);
});

Deno.test("websocketTransmitter string response encoded", async () => {
	const writable = new WritableStream({ write() {} });
	const readable = new ReadableStream({
		start(controller) {
			controller.enqueue("hello");
			controller.close();
		},
	});
	const tx = websocketTransmitter(
		{
			readable,
			writable,
		} as MinimalWebSocketConnection as unknown as WebSocketConnection,
	);
	const out = await tx({});
	const dec = new TextDecoder();
	assertEquals(dec.decode(out as Uint8Array), "hello");
});
