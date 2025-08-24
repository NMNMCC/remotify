import type { MaybePromise } from "@remotify/core/type";

export const wait = async <T>(v: MaybePromise<T>): Promise<T> => {
	const result = await v;
	// Handle nested promises properly without recursion risk
	if (result instanceof Promise) {
		return await result;
	}
	return result;
};
