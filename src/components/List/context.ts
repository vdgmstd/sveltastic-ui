import { getContext, setContext } from 'svelte';
import type { ListRootState } from './listState.svelte';

export type ListVariant = 'default' | 'flat' | 'border' | 'transparent' | 'shadow';
export type ListRole = 'list' | 'menu' | 'listbox';

const KEY = Symbol('List');

export function setListContext(value: ListRootState): ListRootState {
	return setContext(KEY, value);
}

export function useListContext(): ListRootState | undefined {
	return getContext<ListRootState | undefined>(KEY);
}

const GROUP_KEY = Symbol('ListGroup');

export type ListGroupContext = {
	labelId: string;
	setLabelled: () => void;
};

export function setListGroupContext(value: ListGroupContext): ListGroupContext {
	return setContext(GROUP_KEY, value);
}

export function useListGroupContext(): ListGroupContext | undefined {
	return getContext<ListGroupContext | undefined>(GROUP_KEY);
}
