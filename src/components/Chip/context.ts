import { createPartContext } from '../../utils/context';
import type { ChipRootState } from './chip.svelte';

const ctx = createPartContext<ChipRootState>('Chip', 'Chip parts must be used within <Chip.Root>');

export const setChipCtx = ctx.set;
export const useChipCtx = ctx.get;

export type { ChipRootState };
