<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { WithElementRef } from '../../types';

	export type SliderTooltipProps = WithElementRef<
		{
			/** Bound thumb index — `0` (low / single) or `1` (high, range only). Auto-derived from mount order when omitted; pass it explicitly when rendering only the high tooltip (a lone tooltip auto-resolves to `0`, so use `index={1}` to pair it with the high thumb). */
			index?: 0 | 1;
			/** Custom tooltip content. Defaults to the formatted thumb value. */
			children?: Snippet;
			/** Render-delegation: receive the merged props and render your own tooltip element. */
			child?: Snippet<[{ props: Record<string, unknown> }]>;
			/** Extra classes merged onto the tooltip. */
			class?: string;
		},
		HTMLSpanElement
	>;
</script>

<script lang="ts">
	import { createAttachmentKey } from 'svelte/attachments';
	import { mergeProps } from '../../utils/mergeProps';
	import { attachRef } from '../../utils/ref';
	import { getSliderCtx } from './context';

	let {
		ref = $bindable(null),
		index: indexProp,
		children,
		child,
		class: className,
		...rest
	}: SliderTooltipProps = $props();
	const root = getSliderCtx();

	// Auto-index from mount order unless an explicit `index` is passed (explicit wins).
	const token = Symbol('SliderTooltip');
	let autoIndex = $derived(indexProp === undefined);
	$effect(() => {
		if (autoIndex) return root.registerTooltip(token);
	});
	let index = $derived<0 | 1>(autoIndex ? root.tooltipIndex(token) : (indexProp as 0 | 1));

	const isHigh = $derived(index === 1);
	const positionClass = $derived(isHigh ? 'slider__tooltip--high' : 'slider__tooltip--low');
	const text = $derived(root.fmt(root.displayAt(index)));

	const refKey = createAttachmentKey();
	const merged = $derived(
		mergeProps(rest, {
			'aria-hidden': 'true' as const,
			'data-position': isHigh ? ('high' as const) : ('low' as const)
		}, {
			class: ['slider__tooltip', positionClass, className].filter(Boolean).join(' '),
			[refKey]: attachRef<HTMLSpanElement>((n) => (ref = n))
		})
	);
</script>

{#if child}
	{@render child({ props: merged })}
{:else}
	<span {...merged}>{#if children}{@render children()}{:else}{text}{/if}</span>
{/if}
