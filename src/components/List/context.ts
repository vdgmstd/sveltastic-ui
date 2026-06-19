import { createPartContext } from '../../utils/context';
import type { ListRootState } from './listState.svelte';

export type ListVariant = 'default' | 'flat' | 'border' | 'transparent' | 'shadow';
export type ListRole = 'list' | 'menu' | 'listbox';

const listCtx = createPartContext<ListRootState>('List');
export const setListContext = listCtx.set;
export const useListContext = listCtx.find;

export type ListGroupContext = {
	labelId: string;
	setLabelled: () => void;
};

const groupCtx = createPartContext<ListGroupContext>('ListGroup');
export const setListGroupContext = groupCtx.set;
export const useListGroupContext = groupCtx.find;
