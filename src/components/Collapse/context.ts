import { createPartContext } from '../../utils/context';
import type { CollapseGroupState, CollapseRootState } from './collapseState.svelte';

export type CollapseVariant =
	| 'default'
	| 'flat'
	| 'border'
	| 'solid'
	| 'gradient'
	| 'relief'
	| 'ghost';

export type CollapseGroupLayout = 'stack' | 'fused' | 'card';
export type CollapseGroupType = 'single' | 'multiple';

const groupCtx = createPartContext<CollapseGroupState>('collapse-group');
export const setCollapseGroupContext = groupCtx.set;
export const useCollapseGroupContext = groupCtx.find;

const itemCtx = createPartContext<CollapseRootState>('collapse-item', 'Collapse parts must be used within <Collapse.Root>');
export const setCollapseItemContext = itemCtx.set;
export const getCollapseItemContext = itemCtx.get;
