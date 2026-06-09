<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { WithElementRef } from '../../types';

	export type SliderRangeProps = WithElementRef<
		{
			/** Render-delegation: receive the merged props and render your own range element. */
			child?: Snippet<[{ props: Record<string, unknown> }]>;
			/** Extra classes merged onto the active segment. */
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

	let { ref = $bindable(null), child, class: className, ...rest }: SliderRangeProps = $props();
	const root = getSliderCtx();

	const refKey = createAttachmentKey();
	const activeClass = $derived(root.isRange ? 'slider__seg--mid' : 'slider__seg--left');
	const merged = $derived(
		mergeProps(rest, { 'aria-hidden': 'true' as const, 'data-orientation': 'horizontal' as const }, {
			class: ['slider__seg', 'slider__seg--active', activeClass, className]
				.filter(Boolean)
				.join(' '),
			[refKey]: attachRef<HTMLSpanElement>((n) => (ref = n))
		})
	);
</script>

{#if root.isRange}
	<span class="slider__seg slider__seg--side slider__seg--left" aria-hidden="true"></span>
{/if}
{#if child}
	{@render child({ props: merged })}
{:else}
	<span {...merged}></span>
{/if}
<span class="slider__seg slider__seg--side slider__seg--right" aria-hidden="true"></span>
