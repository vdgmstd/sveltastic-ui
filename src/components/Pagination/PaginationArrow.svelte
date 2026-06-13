<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { WithElementRef } from '../../types';
	import type { HTMLButtonAttributes } from 'svelte/elements';

	export type PaginationArrowProps = WithElementRef<
		{
			/** Arrow direction. */
			direction: 'prev' | 'next';
			/** Accessible name. */
			ariaLabel?: string;
			/** Arrow glyph. */
			children?: Snippet;
			/** Render-delegation: receive the merged props and render your own arrow element. */
			child?: Snippet<[{ props: Record<string, unknown> }]>;
		} & Omit<HTMLButtonAttributes, 'children' | 'disabled'>,
		HTMLButtonElement
	>;
</script>

<script lang="ts">
	import { createAttachmentKey } from 'svelte/attachments';
	import { CaretLeftIcon, CaretRightIcon } from 'phosphor-svelte';
	import { ripple as rippleAction } from '../../actions/ripple.svelte';
	import { boolAttr } from '../../utils/attrs';
	import { mergeProps } from '../../utils/mergeProps';
	import { attachRef } from '../../utils/ref';
	import { usePaginationContext } from './context';

	let {
		ref = $bindable(null),
		direction,
		ariaLabel,
		children,
		child,
		class: className,
		...rest
	}: PaginationArrowProps = $props();
	const ctx = usePaginationContext();

	let variant = $derived(ctx.variant);
	let shape = $derived(ctx.shape);
	let mode = $derived(ctx.mode);
	let isDisabled = $derived.by(() => {
		if (ctx.disabled) return true;
		if (ctx.infinite) return false;
		return direction === 'prev' ? ctx.page <= 1 : ctx.page >= ctx.length;
	});

	let rippleOptions = $derived({ disabled: !ctx.ripple || isDisabled });

	const attrs = $derived({
		type: 'button' as const,
		class: `pagination__arrow pagination__arrow--${direction}`,
		'data-variant': variant,
		'data-shape': shape,
		'data-mode': mode,
		'data-disabled': boolAttr(isDisabled),
		disabled: isDisabled || undefined,
		'aria-label': ariaLabel ?? (direction === 'prev' ? ctx.ariaLabelPrev : ctx.ariaLabelNext),
		'data-testid': `pagination-${direction}`,
		onclick: () => (direction === 'prev' ? ctx.goPrev() : ctx.goNext())
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
			{#if children}
				{@render children()}
			{:else if direction === 'prev'}
				<CaretLeftIcon size={14} weight="bold" />
			{:else}
				<CaretRightIcon size={14} weight="bold" />
			{/if}
		</span>
	</button>
{/if}

<style>
	.pagination__arrow {
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

	.pagination__arrow[data-shape='circle'] {
		border-radius: var(--rad-pill);
	}
	.pagination__arrow[data-shape='square'] {
		border-radius: 0;
	}

	.pagination__arrow[data-variant='default'] {
		color: rgb(var(--text));
	}
	.pagination__arrow[data-variant='default']:hover:not(:disabled) {
		background: rgb(var(--gray-2));
	}

	.pagination__arrow[data-variant='flat']:hover:not(:disabled) {
		background: rgb(var(--c) / 0.1);
		color: rgb(var(--c));
	}

	.pagination__arrow[data-variant='border'] {
		box-shadow: var(--shadow-ring-inset);
	}
	.pagination__arrow[data-variant='border']:hover:not(:disabled) {
		box-shadow: inset 0 0 0 1px rgb(var(--c) / 0.5);
		color: rgb(var(--c));
	}

	.pagination__arrow[data-variant='transparent']:hover:not(:disabled) {
		color: rgb(var(--c));
	}

	.pagination__arrow:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}

	.pagination__arrow:focus-visible {
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
	/* RTL: prev/next carets point the other way. */
	:global([dir='rtl']) .pagination__icon {
		transform: scaleX(-1);
	}
</style>
