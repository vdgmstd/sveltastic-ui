<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import type { WithElementRef } from '../../types';

	export type RatingGroupItemState = 'full' | 'partial' | 'empty';

	export type RatingGroupItemProps = WithElementRef<
		Omit<HTMLAttributes<HTMLSpanElement>, 'children'> & {
			/** Zero-based position in the group. */
			index: number;
			/** Custom icon content; receives the item's fill state + fraction. */
			children?: Snippet<[{ state: RatingGroupItemState; fraction: number }]>;
			/** Render-delegation: receive the merged props and render your own element. */
			child?: Snippet<[{ props: Record<string, unknown> }]>;
		},
		HTMLSpanElement
	>;
</script>

<script lang="ts">
	import { StarIcon } from 'phosphor-svelte';
	import { cn } from '../../utils/cn';
	import { mergeProps } from '../../utils/mergeProps';
	import { attachRef } from '../../utils/ref';
	import { createAttachmentKey } from 'svelte/attachments';
	import { boolAttr } from '../../utils/attrs';
	import { getRatingGroupCtx } from './context';

	let { index, ref = $bindable(null), class: className, children, child, ...rest }: RatingGroupItemProps =
		$props();
	const root = getRatingGroupCtx();

	let fraction = $derived(root.fractionFor(index));
	let state = $derived(root.stateFor(index));

	const refKey = createAttachmentKey();
	const merged = $derived(
		mergeProps(rest, {
			class: cn('rating__item', className),
			'data-rating-group-item': '',
			'data-index': String(index),
			'data-value': String(index + 1),
			'data-state': state,
			'data-disabled': boolAttr(root.disabled),
			'data-orientation': root.orientation,
			'aria-hidden': 'true',
			[refKey]: attachRef<HTMLSpanElement>((n) => (ref = n))
		})
	);
</script>

{#if child}
	{@render child({ props: { ...merged, style: `--f:${fraction}` } })}
{:else}
	<span {...merged} style:--f={fraction}>
		{#if children}
			{@render children({ state, fraction })}
		{:else}
			<span class="rating__star rating__star--bg"><StarIcon size={24} weight="regular" /></span>
			<span class="rating__star rating__star--fill"><StarIcon size={24} weight="fill" /></span>
		{/if}
	</span>
{/if}

<style>
	.rating__item {
		position: relative;
		display: inline-flex;
		cursor: pointer;
		line-height: 0;
		transition: transform 140ms cubic-bezier(0.5, 1.45, 0.35, 1);
	}
	:global(.rating:not([data-disabled]):not([data-readonly]) .rating__item:hover) {
		transform: scale(1.12);
	}
	:global(.rating[data-disabled]) .rating__item,
	:global(.rating[data-readonly]) .rating__item {
		cursor: default;
	}
	.rating__star {
		display: inline-flex;
	}
	.rating__star--bg {
		color: rgb(var(--c, var(--warn)) / 0.24);
	}
	.rating__star--fill {
		position: absolute;
		inset: 0;
		color: rgb(var(--c, var(--warn)));
		clip-path: inset(0 calc((1 - var(--f, 0)) * 100%) 0 0);
	}
	:global([dir='rtl']) .rating__star--fill {
		clip-path: inset(0 0 0 calc((1 - var(--f, 0)) * 100%));
	}
</style>
