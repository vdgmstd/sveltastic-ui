import { createPartContext } from '../../utils/context';
import type { SelectRootState } from './selectState.svelte';

const rootCtx = createPartContext<SelectRootState<unknown>>('Select', 'Select parts must be used within <Select.Root>');
const group = createPartContext<SelectGroupCtx>('SelectGroup');
const item = createPartContext<SelectItemCtx>('SelectItem');

export const setSelectCtx = rootCtx.set as <V>(state: SelectRootState<V>) => SelectRootState<V>;

export const getSelectCtx = rootCtx.get as <V = unknown>() => SelectRootState<V>;

/** Group heading id wiring for Select.Group + Select.GroupHeading. */
export type SelectGroupCtx = {
	readonly headingId: string | undefined;
	registerHeading: (id: string | undefined) => void;
};

export const setSelectGroupCtx = group.set;

export const getSelectGroupCtx = group.find;

/** Per-item state Select.Item shares with Select.ItemText / Select.ItemIndicator. */
export type SelectItemCtx = {
	readonly isSelected: boolean;
	readonly isHighlighted: boolean;
	readonly label: string;
};

export const setSelectItemCtx = item.set;

export const getSelectItemCtx = item.find;
