import type { Transmitter } from "@remotify/core/type";

export const fetchTransmitter = (
	url: string,
): Transmitter<[abortSignal: AbortSignal]> => {
	return async (req, ...as) => {
		const [abortSignal] = as;

		const resp = await fetch(url, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify(req),
			signal: abortSignal,
		});
		if (!resp.ok) {
			throw new Error(`HTTP error ${resp.status}`);
		}

		return new Uint8Array(await resp.arrayBuffer());
	};
};
