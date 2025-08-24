import type { MaybePromise } from "@remotify/core/type";

export const wait = async <T>(v: MaybePromise<T>): Promise<T> => {
	// @ts-ignore ...
	const result = await v;
	if (result instanceof Promise) {
		return await wait(result);
	}
	return result;
};
