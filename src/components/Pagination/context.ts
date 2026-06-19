import { createPartContext } from '../../utils/context';
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

const ctx = createPartContext<PaginationRootState>('Pagination', '<Pagination> parts must be used within <Pagination.Root>');

export const setPaginationContext = ctx.set;
export const usePaginationContext = ctx.get;
