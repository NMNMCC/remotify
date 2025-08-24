import type { Transmitter } from "@remotify/core/type";

export const websocketTransmitter = (
	conn: WebSocketConnection,
): Transmitter => {
	return async (req, ..._as) => {
		await conn.writable.getWriter().write(req);

		const result = await conn.readable.getReader().read();

		if (result.done || result.value === undefined) {
			return;
		}

		switch (typeof result.value) {
			case "string": {
				const encoder = new TextEncoder();
				return encoder.encode(result.value);
			}
			default: {
				return result.value;
			}
		}
	};
};
