import { createPartContext } from '../../utils/context';
import type { ToggleGroupRootState } from './toggleGroupState.svelte';

export type ToggleGroupType = 'single' | 'multiple';
export type ToggleGroupOrientation = 'horizontal' | 'vertical';

const ctx = createPartContext<ToggleGroupRootState>('ToggleGroup');

export const setToggleGroupCtx = ctx.set;
export const getToggleGroupCtx = ctx.get;
