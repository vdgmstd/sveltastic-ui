import { createPartContext } from '../../utils/context';
import type { DividerRootState } from './divider.svelte';

const ctx = createPartContext<DividerRootState>('Divider', 'Divider parts must be used within <Divider.Root>');

export const setDividerCtx = ctx.set;
export const useDividerCtx = ctx.get;

export type { DividerRootState };
