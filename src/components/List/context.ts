import { getContext, setContext } from 'svelte';
import type { Color, Size } from '../../types';

export type ListVariant = 'default' | 'flat' | 'border' | 'transparent' | 'shadow';
export type ListRole = 'list' | 'menu' | 'listbox';

export type ListContext = {
	readonly variant: ListVariant;
	readonly color: Color;
	readonly size: Size;
	readonly divided: boolean;
	readonly role: ListRole;
	readonly multiple: boolean;
	readonly disabled: boolean;
	isSelected: (value: unknown) => boolean;
	select: (value: unknown) => void;
	register: (id: string, el: HTMLElement, getValue: () => unknown, getDisabled: () => boolean) => void;
	unregister: (id: string) => void;
	focusNext: (from: string, dir: 1 | -1) => void;
	focusEdge: (edge: 'first' | 'last') => void;
};

const KEY = Symbol('list');

export function createListContext(value: ListContext): void {
	setContext(KEY, value);
}

export function useListContext(): ListContext | undefined {
	return getContext<ListContext | undefined>(KEY);
}
