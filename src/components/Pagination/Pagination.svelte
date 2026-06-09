<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { Color, Shape, Size, WithElementRef } from '../../types';
	import type {
		PaginationMode,
		PaginationVariant,
		PaginationSnippetProps
	} from './context';

	export type { PaginationMode, PaginationVariant } from './context';

	export type PaginationRootProps = WithElementRef<
		{
			/** Currently selected page (1-based). Bindable. */
			page?: number;
			/** Total number of pages. */
			length?: number;
			/** Max number of buttons rendered before ellipses appear. */
			max?: number;
			/** Pages to jump when an ellipsis is clicked. */
			dottedJump?: number;
			/** Wrap around at the edges. */
			infinite?: boolean;
			/** Render a thin progress bar below the control. */
			progress?: boolean;
			/** Numeric buttons or dot indicators. */
			mode?: PaginationMode;
			/** Show prev/next arrows. */
			arrows?: boolean;
			/** Hide the buttons; render only prev/next arrows. */
			arrowsOnly?: boolean;
			/** Visual variant of the page buttons. */
			variant?: PaginationVariant;
			/** Predefined size (matches the kit's Button sizes). */
			size?: Size;
			/** Border-radius shape. */
			shape?: Shape;
			/** Disable individual pages (non-clickable). */
			disabledItems?: number[];
			/** Pages that show a loading spinner. */
			loadingItems?: number[];
			/** Disable the entire control. */
			disabled?: boolean;
			/** Emit a click ripple on selection. */
			ripple?: boolean;
			/** Stretch the control to the parent's width. */
			block?: boolean;
			/** Palette color (`'primary' | 'success' | ...`) or hex / `rgb(...)`. */
			color?: Color;
			/** Label for the wrapping `<nav>`. Defaults to `'Pagination'`. */
			ariaLabel?: string;
			/** Aria-label for the prev arrow. */
			ariaLabelPrev?: string;
			/** Aria-label for the next arrow. */
			ariaLabelNext?: string;
			/** Accessible name for a page button, given its 1-based number. */
			pageLabel?: (page: number) => string;
			/** Aria-label for the "jump back" ellipsis. */
			ariaLabelJumpPrev?: string;
			/** Aria-label for the "jump forward" ellipsis. */
			ariaLabelJumpNext?: string;
			/** Render-loop escape hatch (bits-ui parity): receives `{ pages, range, currentPage }` and replaces the default styled control. */
			children?: Snippet<[PaginationSnippetProps]>;
			/** Render-delegation: receive the merged props and render your own root element. */
			child?: Snippet<[{ props: Record<string, unknown> }]>;
			/** Fired on selection with the new page. */
			onPageChange?: (page: number) => void;
			/** Class merged onto the root. */
			class?: string;
			/** Inline style merged onto the root. */
			style?: string;
		},
		HTMLElement
	>;
</script>

<script lang="ts">
	import { createAttachmentKey } from 'svelte/attachments';
	import { rgbTriplet } from '../../utils/color';
	import { boolAttr } from '../../utils/attrs';
	import { mergeProps } from '../../utils/mergeProps';
	import { attachRef } from '../../utils/ref';
	import { setPaginationContext } from './context';
	import { PaginationRootState } from './paginationState.svelte';
	import List from './PaginationList.svelte';
	import Page from './PaginationPage.svelte';
	import Ellipsis from './PaginationEllipsis.svelte';
	import PrevButton from './PaginationPrevButton.svelte';
	import NextButton from './PaginationNextButton.svelte';
	import Progress from './PaginationProgress.svelte';

	let {
		ref = $bindable(null),
		page = $bindable(1),
		length = 0,
		max = 9,
		dottedJump = 5,
		infinite = false,
		progress = false,
		mode = 'numbers',
		arrows = true,
		arrowsOnly = false,
		variant = 'flat',
		size = 'medium',
		shape = 'default',
		disabledItems = [],
		loadingItems = [],
		disabled = false,
		ripple = true,
		block = false,
		color = 'primary',
		ariaLabel = 'Pagination',
		ariaLabelPrev = 'Previous page',
		ariaLabelNext = 'Next page',
		pageLabel = (p: number) => `Page ${p}`,
		ariaLabelJumpPrev = 'Previous pages',
		ariaLabelJumpNext = 'Next pages',
		children,
		child,
		onPageChange,
		class: className,
		style: userStyle,
		...rest
	}: PaginationRootProps = $props();

	const baseId = $props.id();
	let triplet = $derived(rgbTriplet(color));

	const root = setPaginationContext(
		new PaginationRootState({
			baseId,
			getPage: () => page,
			setPageProp: (next) => {
				page = next;
			},
			length: () => length,
			max: () => max,
			dottedJump: () => dottedJump,
			infinite: () => infinite,
			mode: () => mode,
			variant: () => variant,
			size: () => size,
			shape: () => shape,
			color: () => color,
			ripple: () => ripple,
			disabled: () => disabled,
			disabledItems: () => disabledItems,
			loadingItems: () => loadingItems,
			pageLabel: () => pageLabel,
			ariaLabelPrev: () => ariaLabelPrev,
			ariaLabelNext: () => ariaLabelNext,
			ariaLabelJumpPrev: () => ariaLabelJumpPrev,
			ariaLabelJumpNext: () => ariaLabelJumpNext,
			onPageChange: () => onPageChange
		})
	);

	$effect(() => {
		root.roving.setCurrent(root.pageId(root.safeValue));
	});

	const refKey = createAttachmentKey();
	const attrs = $derived({
		class: 'pagination',
		'data-variant': variant,
		'data-size': size,
		'data-shape': shape,
		'data-mode': mode,
		'data-disabled': boolAttr(disabled),
		'data-block': boolAttr(block),
		'data-has-progress': boolAttr(progress),
		'aria-label': ariaLabel,
		'data-testid': 'pagination'
	});
	const merged = $derived(
		mergeProps(rest, attrs, {
			class: className,
			[refKey]: attachRef<HTMLElement>((n) => (ref = n))
		})
	);
</script>

{#snippet content()}
	{#if arrows}
		<PrevButton ariaLabel={ariaLabelPrev} />
	{/if}

	{#if children}
		{@render children({ pages: root.items, range: root.range, currentPage: root.safeValue })}
	{:else if !arrowsOnly}
		<List>
			{#each root.items as item (item.kind === 'page' ? `page:${item.n}` : `gap:${item.direction}`)}
				{#if item.kind === 'page'}
					<Page page={item} />
				{:else}
					<Ellipsis page={item} />
				{/if}
			{/each}
		</List>
	{/if}

	{#if arrows}
		<NextButton ariaLabel={ariaLabelNext} />
	{/if}

	{#if progress}
		<Progress />
	{/if}
{/snippet}

{#if child}
	{@render child({ props: { ...merged, style: `--c:${triplet};${userStyle ?? ''}` } })}
{:else}
	<nav {...merged} style:--c={triplet} style={userStyle}>
		{@render content()}
	</nav>
{/if}

<style>
	:where(.pagination) {
		--c: var(--primary);
		--sa-color: var(--c);
		--ease: var(--ease-standard);

		position: relative;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: var(--space-2);
		padding: var(--space-2) 0;
		margin: var(--space-5) 0;
		border-radius: var(--rad-md);
		font: inherit;
	}
	:where(.pagination[data-block]) {
		display: flex;
		width: 100%;
	}
	:where(.pagination[data-has-progress]) {
		padding-bottom: var(--space-5);
	}
	:where(.pagination[data-disabled]) {
		opacity: 0.5;
		pointer-events: none;
	}

	:where(.pagination[data-size='xl'])     { --btn-size: 44px; --btn-font: var(--fs-xl); --btn-radius: var(--rad-lg); }
	:where(.pagination[data-size='large'])  { --btn-size: 38px; --btn-font: var(--fs-lg); --btn-radius: var(--rad-md); }
	/* --btn-radius 10px kept literal: ramp-collision between --rad-sm 8 and --rad-md 12. */
	:where(.pagination[data-size='medium']) { --btn-size: 32px; --btn-font: var(--fs-md); --btn-radius: 10px; }
	:where(.pagination[data-size='small'])  { --btn-size: 28px; --btn-font: var(--fs-sm); --btn-radius: var(--rad-sm); }
	:where(.pagination[data-size='mini'])   { --btn-size: 22px; --btn-font: var(--fs-xs); --btn-radius: var(--rad-xs); }
</style>
