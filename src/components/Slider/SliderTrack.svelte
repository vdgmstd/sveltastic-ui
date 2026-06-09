<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { WithElementRef } from '../../types';

	export type SliderTrackProps = WithElementRef<
		{
			/** Track contents — `<Slider.Range>`, `<Slider.Tick>`, `<Slider.Thumb>`, `<Slider.Tooltip>`. */
			children?: Snippet;
			/** Render-delegation: receive the merged props and render your own rail element. */
			child?: Snippet<[{ props: Record<string, unknown> }]>;
			/** Extra classes merged onto the rail. */
			class?: string;
		},
		HTMLDivElement
	>;
</script>

<script lang="ts">
	import { createAttachmentKey } from 'svelte/attachments';
	import { mergeProps } from '../../utils/mergeProps';
	import { attachRef } from '../../utils/ref';
	import { getSliderCtx } from './context';

	let { ref = $bindable(null), children, child, class: className, ...rest }: SliderTrackProps =
		$props();
	const root = getSliderCtx();

	const refKey = createAttachmentKey();
	const merged = $derived(
		mergeProps(rest, { 'data-orientation': 'horizontal' as const }, {
			class: ['slider__rail', className].filter(Boolean).join(' '),
			[refKey]: attachRef<HTMLDivElement>((n) => {
				ref = n;
				root.setRail(n);
			})
		})
	);
</script>

{#if child}
	{@render child({ props: merged })}
{:else}
	<div {...merged}>{@render children?.()}</div>
{/if}
