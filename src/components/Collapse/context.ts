import { getContext, setContext } from 'svelte';
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

const GROUP_KEY = Symbol('collapse-group');
const ITEM_KEY = Symbol('collapse-item');

export function setCollapseGroupContext(value: CollapseGroupState): void {
	setContext(GROUP_KEY, value);
}

export function useCollapseGroupContext(): CollapseGroupState | undefined {
	return getContext<CollapseGroupState | undefined>(GROUP_KEY);
}

export function setCollapseItemContext(value: CollapseRootState): void {
	setContext(ITEM_KEY, value);
}

export function getCollapseItemContext(): CollapseRootState {
	const ctx = getContext<CollapseRootState | undefined>(ITEM_KEY);
	if (!ctx) throw new Error('Collapse parts must be used within <Collapse.Root>');
	return ctx;
}
