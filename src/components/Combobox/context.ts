import { createPartContext } from '../../utils/context';
import type { ComboboxRootState } from './comboboxState.svelte';

const rootCtx = createPartContext<ComboboxRootState<unknown>>(
	'Combobox',
	'Combobox parts must be used within <Combobox.Root>'
);
const group = createPartContext<ComboboxGroupCtx>('ComboboxGroup');
const item = createPartContext<ComboboxItemCtx>('ComboboxItem');

export const setComboboxCtx = rootCtx.set as <V>(state: ComboboxRootState<V>) => ComboboxRootState<V>;

export const getComboboxCtx = rootCtx.get as <V = unknown>() => ComboboxRootState<V>;

/** Group heading id wiring for Combobox.Group + Combobox.GroupHeading. */
export type ComboboxGroupCtx = {
	readonly headingId: string | undefined;
	registerHeading: (id: string | undefined) => void;
};

export const setComboboxGroupCtx = group.set;

export const getComboboxGroupCtx = group.find;

/** Per-item state Combobox.Item shares with Combobox.ItemText / Combobox.ItemIndicator. */
export type ComboboxItemCtx = {
	readonly isSelected: boolean;
	readonly isHighlighted: boolean;
	readonly label: string;
};

export const setComboboxItemCtx = item.set;

export const getComboboxItemCtx = item.find;
