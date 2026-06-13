<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { WithElementRef } from '../../types';

	export type SliderTickProps = WithElementRef<
		{
			/** Index into the Root tick list (`min + index·step`). */
			index: number;
			/** Render-delegation: receive the merged props and render your own tick element. */
			child?: Snippet<[{ props: Record<string, unknown> }]>;
			/** Extra classes merged onto the tick. */
			class?: string;
		},
		HTMLSpanElement
	>;
</script>

<script lang="ts">
	import { createAttachmentKey } from 'svelte/attachments';
	import { mergeProps } from '../../utils/mergeProps';
	import { attachRef } from '../../utils/ref';
	import { boolAttr } from '../../utils/attrs';
	import { getSliderCtx } from './context';

	let { ref = $bindable(null), index, child, class: className, ...rest }: SliderTickProps =
		$props();
	const root = getSliderCtx();

	const tickValue = $derived(root.tickList[index] ?? root.min);
	const tickPct = $derived(root.pct(tickValue));
	const isBounded = $derived(root.isInActiveRegion(tickPct));

	const refKey = createAttachmentKey();
	const merged = $derived(
		mergeProps(rest, {
			'aria-hidden': 'true' as const,
			'data-orientation': 'horizontal' as const,
			'data-bounded': boolAttr(isBounded)
		}, {
			class: ['slider__tick', className].filter(Boolean).join(' '),
			style: `inset-inline-start:${tickPct}%`,
			[refKey]: attachRef<HTMLSpanElement>((n) => (ref = n))
		})
	);
</script>

{#if child}
	{@render child({ props: merged })}
{:else}
	<span {...merged}></span>
{/if}
