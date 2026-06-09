import { getContext, setContext } from 'svelte';
import type { DividerRootState } from './divider.svelte';

const KEY = Symbol('Divider');

export function setDividerCtx(state: DividerRootState): DividerRootState {
	return setContext(KEY, state);
}

export function useDividerCtx(): DividerRootState {
	const ctx = getContext<DividerRootState>(KEY);
	if (!ctx) throw new Error('Divider parts must be used within <Divider.Root>');
	return ctx;
}

export type { DividerRootState };
