<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { WithElementRef } from '../../types';
	import type { HTMLButtonAttributes } from 'svelte/elements';
	import type { PaginationGapItem } from './context';

	export type PaginationEllipsisProps = WithElementRef<
		{
			/** Which jump-gap this is. */
			page: PaginationGapItem;
			/** Custom ellipsis glyph. */
			children?: Snippet;
			/** Render-delegation: receive the merged props and render your own ellipsis element. */
			child?: Snippet<[{ props: Record<string, unknown> }]>;
		} & Omit<HTMLButtonAttributes, 'children' | 'disabled'>,
		HTMLButtonElement
	>;
</script>

<script lang="ts">
	import { createAttachmentKey } from 'svelte/attachments';
	import { DotsThreeIcon } from 'phosphor-svelte';
	import { ripple as rippleAction } from '../../actions/ripple.svelte';
	import { mergeProps } from '../../utils/mergeProps';
	import { attachRef } from '../../utils/ref';
	import { usePaginationContext } from './context';

	let {
		ref = $bindable(null),
		page,
		children,
		child,
		class: className,
		...rest
	}: PaginationEllipsisProps = $props();
	const ctx = usePaginationContext();

	let direction = $derived(page.direction);
	let variant = $derived(ctx?.variant ?? 'flat');
	let shape = $derived(ctx?.shape ?? 'default');
	let mode = $derived(ctx?.mode ?? 'numbers');
	let isDisabled = $derived(ctx?.disabled ?? false);

	let rippleOptions = $derived({ disabled: !(ctx?.ripple ?? true) || isDisabled });

	const attrs = $derived({
		type: 'button' as const,
		class: 'pagination__gap',
		'data-variant': variant,
		'data-shape': shape,
		'data-mode': mode,
		'data-direction': direction,
		'data-pagination-ellipsis': '',
		tabindex: -1,
		'aria-label': direction === 'next' ? ctx?.ariaLabelJumpNext : ctx?.ariaLabelJumpPrev,
		'data-testid': 'pagination-ellipsis',
		onclick: () => ctx?.jump(direction)
	});
	const merged = $derived(
		mergeProps(rest, attrs, {
			class: className,
			[createAttachmentKey()]: attachRef<HTMLButtonElement>((node) => (ref = node))
		})
	);
</script>

{#if child}
	{@render child({ props: merged })}
{:else}
	<button {...merged} use:rippleAction={rippleOptions}>
		<span class="pagination__icon">
			{#if children}{@render children()}{:else}<DotsThreeIcon size={14} weight="bold" />{/if}
		</span>
	</button>
{/if}

<style>
	.pagination__gap {
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

	.pagination__gap[data-shape='circle'] {
		border-radius: var(--rad-pill);
	}
	.pagination__gap[data-shape='square'] {
		border-radius: 0;
	}

	.pagination__gap[data-variant='default'] {
		color: rgb(var(--text));
	}
	.pagination__gap[data-variant='default']:hover:not(:disabled) {
		background: rgb(var(--gray-2));
	}

	.pagination__gap[data-variant='flat']:hover:not(:disabled) {
		background: rgb(var(--c) / 0.1);
		color: rgb(var(--c));
	}

	.pagination__gap[data-variant='border'] {
		box-shadow: var(--shadow-ring-inset);
	}
	.pagination__gap[data-variant='border']:hover:not(:disabled) {
		box-shadow: inset 0 0 0 1px rgb(var(--c) / 0.5);
		color: rgb(var(--c));
	}

	.pagination__gap[data-variant='transparent']:hover:not(:disabled) {
		color: rgb(var(--c));
	}

	.pagination__gap:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}

	.pagination__gap:focus-visible {
		outline: 2px solid rgb(var(--c) / 0.6);
		outline-offset: 2px;
	}

	.pagination__icon {
		position: relative;
		z-index: 2;
		display: inline-flex;
		align-items: center;
		justify-content: center;
	}
</style>
