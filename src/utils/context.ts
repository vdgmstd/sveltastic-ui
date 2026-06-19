import { getContext, setContext } from 'svelte';

/** A typed component-tree context channel: `set` from the Root, `get` (throws) from required parts, `find` from optional ones. */
export type PartContext<T> = {
	readonly key: symbol;
	set(value: T): T;
	get(): T;
	find(): T | undefined;
};

/** Build a typed context channel for a compound component, collapsing the per-component Symbol + set/get-or-throw boilerplate. */
export function createPartContext<T>(name: string, message?: string): PartContext<T> {
	const key = Symbol(name);
	const error = message ?? `${name} parts must be used within <${name}.Root>`;
	const set = (value: T): T => setContext(key, value);
	const get = (): T => {
		const ctx = getContext<T | undefined>(key);
		if (ctx === undefined) throw new Error(error);
		return ctx;
	};
	const find = (): T | undefined => getContext<T | undefined>(key);
	return { key, set, get, find };
}
