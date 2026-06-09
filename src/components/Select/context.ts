import { getContext, setContext } from 'svelte';
import type { SelectRootState } from './selectState.svelte';

const KEY = Symbol('Select');
const GROUP_KEY = Symbol('SelectGroup');
const ITEM_KEY = Symbol('SelectItem');

export function setSelectCtx<V>(state: SelectRootState<V>): SelectRootState<V> {
	return setContext(KEY, state);
}

export function getSelectCtx<V = unknown>(): SelectRootState<V> {
	const ctx = getContext<SelectRootState<V>>(KEY);
	if (!ctx) throw new Error('Select parts must be used within <Select.Root>');
	return ctx;
}

/** Group heading id wiring for Select.Group + Select.GroupHeading. */
export type SelectGroupCtx = {
	readonly headingId: string;
	registerHeading: (id: string) => void;
};

export function setSelectGroupCtx(group: SelectGroupCtx): SelectGroupCtx {
	return setContext(GROUP_KEY, group);
}

export function getSelectGroupCtx(): SelectGroupCtx | undefined {
	return getContext<SelectGroupCtx | undefined>(GROUP_KEY);
}

/** Per-item state Select.Item shares with Select.ItemText / Select.ItemIndicator. */
export type SelectItemCtx = {
	readonly isSelected: boolean;
	readonly isHighlighted: boolean;
	readonly label: string;
};

export function setSelectItemCtx(item: SelectItemCtx): SelectItemCtx {
	return setContext(ITEM_KEY, item);
}

export function getSelectItemCtx(): SelectItemCtx | undefined {
	return getContext<SelectItemCtx | undefined>(ITEM_KEY);
}
