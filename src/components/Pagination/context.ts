import { getContext, setContext } from 'svelte';
import type { PaginationRootState } from './paginationState.svelte';

export type PaginationMode = 'numbers' | 'dots';
export type PaginationVariant = 'default' | 'flat' | 'border' | 'transparent';

export type PaginationPageItem = { kind: 'page'; n: number };
export type PaginationGapItem = { kind: 'gap'; direction: 'prev' | 'next' };
export type PaginationItem = PaginationPageItem | PaginationGapItem;

/** Payload for the bits-ui-parity render-loop `children` snippet. */
export type PaginationSnippetProps = {
	pages: PaginationItem[];
	range: { start: number; end: number };
	currentPage: number;
};

const KEY = Symbol('Pagination');

export function setPaginationContext(value: PaginationRootState): PaginationRootState {
	return setContext(KEY, value);
}

export function usePaginationContext(): PaginationRootState {
	const ctx = getContext<PaginationRootState | undefined>(KEY);
	if (!ctx) throw new Error('<Pagination> parts must be used within <Pagination.Root>');
	return ctx;
}
