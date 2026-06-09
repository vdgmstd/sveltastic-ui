<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import type { WithElementRef } from '../../types';

	export type TooltipArrowProps = WithElementRef<
		Omit<HTMLAttributes<HTMLDivElement>, 'children'> & {
			children?: Snippet;
			/** Render-delegation: receive the merged props and render your own element. */
			child?: Snippet<[{ props: Record<string, unknown> }]>;
		},
		HTMLDivElement
	>;
</script>

<script lang="ts">
	import { createAttachmentKey } from 'svelte/attachments';
	import { cn } from '../../utils/cn';
	import { mergeProps } from '../../utils/mergeProps';
	import { attachRef } from '../../utils/ref';
	import { getTooltipCtx } from './context';

	let { ref = $bindable(null), class: className, children, child, ...rest }: TooltipArrowProps =
		$props();
	const root = getTooltipCtx();

	const refKey = createAttachmentKey();

	const attrs = $derived({
		class: cn('tooltip__arrow', className),
		'data-placement': root.placement,
		'aria-hidden': 'true' as const,
		'data-testid': 'tooltip-arrow'
	});
	const merged = $derived(
		mergeProps(rest, attrs, { [refKey]: attachRef<HTMLDivElement>((n) => (ref = n)) })
	);
</script>

{#if child}
	{@render child({ props: merged })}
{:else}
	<div {...merged}>{@render children?.()}</div>
{/if}

<style>
	.tooltip__arrow {
		position: absolute;
		background: var(--tooltip-bg);
		-webkit-user-select: none;
		user-select: none;
		-webkit-backdrop-filter: var(--frost);
		backdrop-filter: var(--frost);
		pointer-events: none;
	}
	.tooltip__arrow[data-placement='top'] {
		top: 100%;
		left: 50%;
		width: 14px;
		height: 7px;
		transform: translateX(-50%);
		clip-path: polygon(0 0, 100% 0, 50% 100%);
	}
	.tooltip__arrow[data-placement='bottom'] {
		bottom: 100%;
		left: 50%;
		width: 14px;
		height: 7px;
		transform: translateX(-50%);
		clip-path: polygon(50% 0, 0 100%, 100% 100%);
	}
	.tooltip__arrow[data-placement='left'] {
		left: 100%;
		top: 50%;
		width: 7px;
		height: 14px;
		transform: translateY(-50%);
		clip-path: polygon(0 0, 0 100%, 100% 50%);
	}
	.tooltip__arrow[data-placement='right'] {
		right: 100%;
		top: 50%;
		width: 7px;
		height: 14px;
		transform: translateY(-50%);
		clip-path: polygon(100% 0, 0 50%, 100% 100%);
	}
</style>
