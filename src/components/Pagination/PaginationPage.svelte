<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { WithElementRef } from '../../types';
	import type { HTMLButtonAttributes } from 'svelte/elements';
	import type { PaginationPageItem } from './context';

	export type PaginationPageProps = WithElementRef<
		{
			/** The page descriptor to render. */
			page: PaginationPageItem;
			/** Render-delegation: receive the merged props and render your own page element. */
			child?: Snippet<[{ props: Record<string, unknown> }]>;
		} & Omit<HTMLButtonAttributes, 'children' | 'disabled'>,
		HTMLButtonElement
	>;
</script>

<script lang="ts">
	import { createAttachmentKey } from 'svelte/attachments';
	import { ripple as rippleAction } from '../../actions/ripple.svelte';
	import { rgbTriplet } from '../../utils/color';
	import { boolAttr } from '../../utils/attrs';
	import { mergeProps } from '../../utils/mergeProps';
	import { attachRef } from '../../utils/ref';
	import { usePaginationContext } from './context';
	import Spinner from '../../primitives/Spinner.svelte';

	let { ref = $bindable(null), page, child, class: className, ...rest }: PaginationPageProps = $props();
	const ctx = usePaginationContext();

	let n = $derived(page.n);
	let variant = $derived(ctx.variant);
	let shape = $derived(ctx.shape);
	let mode = $derived(ctx.mode);
	let isActive = $derived(ctx.safeValue === n);
	let isItemDisabled = $derived(ctx.isItemDisabled(n));
	let isItemLoading = $derived(ctx.isItemLoading(n));
	let isInert = $derived(ctx.disabled || isItemDisabled || isItemLoading);
	let triplet = $derived(rgbTriplet(ctx.color));

	let rippleOptions = $derived({
		disabled: !ctx.ripple || isInert,
		solidBg: isActive && (variant === 'default' || variant === 'border')
	});

	let pageId = $derived(ctx.pageId(n));

	// Mint once: re-minting in the $derived re-runs the attachment every recompute → update-depth loop
	// (the ref attachment writes `node`, and `merged` reads the registry via `tabindexFor`, so a fresh
	// attachment closure each recompute bounced `node` and re-fired registration).
	const refKey = createAttachmentKey();

	let node = $state<HTMLElement | null>(null);
	// Stable, change-guarded ref attachment: identity never changes, captured node only updates on
	// actual DOM-node change — so `merged` recomputing (e.g. on registry-driven `tabindexFor`) can't
	// re-run this and bounce `node`.
	const attachNode = attachRef<HTMLButtonElement>((el) => {
		ref = el;
		node = el;
	});
	// Re-register on in-place page-number change so roving keyboard nav follows without remount.
	$effect(() => {
		if (node) return ctx.roving.register(pageId, node, () => isInert);
	});

	const attrs = $derived({
		type: 'button' as const,
		class: 'pagination__button',
		'data-variant': variant,
		'data-shape': shape,
		'data-mode': mode,
		'data-state': isActive ? ('active' as const) : ('inactive' as const),
		'data-selected': boolAttr(isActive),
		'data-loading': boolAttr(isItemLoading),
		'data-value': n,
		tabindex: ctx.roving.tabindexFor(pageId),
		'aria-current': isActive ? ('page' as const) : undefined,
		'aria-label': mode === 'dots' ? ctx.pageLabel(n) : undefined,
		disabled: isInert || undefined,
		'data-testid': 'pagination-page',
		onclick: () => ctx.setPage(n),
		onkeydown: (e: KeyboardEvent) => ctx.handleKeydown(e, n)
	});
	const merged = $derived(mergeProps(rest, attrs, { class: className, [refKey]: attachNode }));
</script>

{#snippet body()}
	{#if mode === 'numbers'}
		<span class="pagination__label">{n}</span>
	{/if}
	{#if isItemLoading}
		<span class="pagination__loading" aria-hidden="true">
			<Spinner color={triplet} size={14} thickness={2} speed={800} />
		</span>
	{/if}
{/snippet}

{#if child}
	{@render child({ props: merged })}
{:else}
	<button {...merged} use:rippleAction={rippleOptions}>
		{@render body()}
	</button>
{/if}

<style>
	.pagination__button {
		position: relative;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-width: var(--btn-size);
		height: var(--btn-size);
		padding: 0 var(--space-3);
		box-sizing: border-box;
		border: 0;
		border-radius: var(--btn-radius);
		background: transparent;
		color: inherit;
		font: inherit;
		font-size: var(--btn-font);
		cursor: pointer;
		-webkit-user-select: none;
		user-select: none;
		outline: none;
		transition:
			background-color 200ms var(--ease),
			box-shadow 200ms var(--ease),
			transform 200ms var(--ease);
	}

	.pagination__label {
		position: relative;
		z-index: 2;
		font-variant-numeric: tabular-nums;
	}

	.pagination__button[data-shape='circle'] {
		border-radius: var(--rad-pill);
	}
	.pagination__button[data-shape='square'] {
		border-radius: 0;
	}

	.pagination__button[data-variant='default']:not([data-state='active']) {
		color: rgb(var(--text));
	}
	.pagination__button[data-variant='default']:hover:not(:disabled) {
		background: rgb(var(--gray-2));
	}
	.pagination__button[data-variant='default'][data-state='active'] {
		background: rgb(var(--c));
		color: rgb(var(--on-accent));
	}
	.pagination__button[data-variant='default'][data-state='active']:hover:not(:disabled) {
		background: rgb(var(--c));
	}

	.pagination__button[data-variant='flat']:hover:not(:disabled) {
		background: rgb(var(--c) / 0.1);
		color: rgb(var(--c));
	}
	.pagination__button[data-variant='flat'][data-state='active'] {
		background: rgb(var(--c) / 0.18);
		color: rgb(var(--c));
		font-weight: 600;
	}

	.pagination__button[data-variant='border'] {
		box-shadow: var(--shadow-ring-inset);
	}
	.pagination__button[data-variant='border']:hover:not(:disabled) {
		box-shadow: inset 0 0 0 1px rgb(var(--c) / 0.5);
		color: rgb(var(--c));
	}
	.pagination__button[data-variant='border'][data-state='active'] {
		background: rgb(var(--c));
		color: rgb(var(--on-accent));
		box-shadow: inset 0 0 0 1px rgb(var(--c));
	}

	.pagination__button[data-variant='transparent']:hover:not(:disabled) {
		color: rgb(var(--c));
	}
	.pagination__button[data-variant='transparent'][data-state='active'] {
		color: rgb(var(--c));
		font-weight: 600;
	}

	.pagination__button:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}
	.pagination__button[data-loading] {
		opacity: 1;
		cursor: progress;
	}
	.pagination__button[data-loading] .pagination__label {
		visibility: hidden;
	}
	.pagination__loading {
		position: absolute;
		left: 50%;
		top: 50%;
		z-index: 2;
		display: flex;
		transform: translate(-50%, -50%);
		pointer-events: none;
	}

	.pagination__button:focus-visible {
		outline: 2px solid rgb(var(--c) / 0.6);
		outline-offset: 2px;
	}

	.pagination__button[data-mode='dots'] {
		min-width: calc(var(--btn-size) * 0.4);
		width: calc(var(--btn-size) * 0.4);
		height: calc(var(--btn-size) * 0.4);
		padding: 0;
		border-radius: var(--rad-circle);
		background: rgb(var(--text) / 0.18);
		box-shadow: none;
		transition:
			background-color 200ms var(--ease),
			transform 200ms var(--ease);
	}
	.pagination__button[data-mode='dots']:hover:not(:disabled) {
		background: rgb(var(--text) / 0.32);
		transform: scale(1.15);
	}
	.pagination__button[data-mode='dots'][data-state='active'] {
		background: rgb(var(--c));
		transform: scale(1.2);
	}
</style>
