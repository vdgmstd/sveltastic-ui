import Root from './Pagination.svelte';
import Page from './PaginationPage.svelte';
import Ellipsis from './PaginationEllipsis.svelte';
import PrevButton from './PaginationPrevButton.svelte';
import NextButton from './PaginationNextButton.svelte';
import Progress from './PaginationProgress.svelte';

/** Page navigation. Compound: `Pagination.Root` + `Pagination.Page`/`Ellipsis`/`PrevButton`/`NextButton`/`Progress`. */
export const Pagination = {
	Root,
	Page,
	Ellipsis,
	PrevButton,
	NextButton,
	Progress
};

export type {
	PaginationMode,
	PaginationVariant,
	PaginationItem,
	PaginationPageItem,
	PaginationGapItem,
	PaginationSnippetProps
} from './context';
export type { PaginationRootProps } from './Pagination.svelte';
export type { PaginationPageProps } from './PaginationPage.svelte';
export type { PaginationEllipsisProps } from './PaginationEllipsis.svelte';
export type { PaginationArrowProps } from './PaginationArrow.svelte';
export type { PaginationPrevButtonProps } from './PaginationPrevButton.svelte';
export type { PaginationNextButtonProps } from './PaginationNextButton.svelte';
export type { PaginationProgressProps } from './PaginationProgress.svelte';
