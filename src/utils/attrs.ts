/** Empty string when truthy, `undefined` otherwise — yields a clean `[data-x]` presence selector. */
export function boolAttr(condition: unknown): '' | undefined {
	return condition ? '' : undefined;
}

/** Pass-through enum value for a `data-*` attribute, dropping `undefined`/`null`. */
export function dataState<T extends string>(value: T | undefined | null): T | undefined {
	return value ?? undefined;
}
