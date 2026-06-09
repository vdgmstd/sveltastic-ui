import { getContext, setContext } from 'svelte';
import type { ChipRootState } from './chip.svelte';

const KEY = Symbol('Chip');

export function setChipCtx(state: ChipRootState): ChipRootState {
	return setContext(KEY, state);
}

export function useChipCtx(): ChipRootState {
	const ctx = getContext<ChipRootState>(KEY);
	if (!ctx) throw new Error('Chip parts must be used within <Chip.Root>');
	return ctx;
}

export type { ChipRootState };
