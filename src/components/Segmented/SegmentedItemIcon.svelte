<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { WithElementRef } from '../../types';
	import type { HTMLAttributes } from 'svelte/elements';

	export type SegmentedItemIconProps = WithElementRef<
		{
			/** Glyph content. */
			children?: Snippet;
			/** Render-delegation: receive the merged props and render your own element. */
			child?: Snippet<[{ props: Record<string, unknown> }]>;
		} & HTMLAttributes<HTMLSpanElement>,
		HTMLSpanElement
	>;
</script>

<script lang="ts">
	import { createAttachmentKey } from 'svelte/attachments';
	import { cn } from '../../utils/cn';
	import { mergeProps } from '../../utils/mergeProps';
	import { attachRef } from '../../utils/ref';

	let { ref = $bindable(null), children, child, class: className, ...rest }: SegmentedItemIconProps =
		$props();

	const refKey = createAttachmentKey();
	const merged = $derived(
		mergeProps(rest, {
			class: cn('segmented__icon', className),
			'aria-hidden': 'true',
			'data-testid': 'segmented-item-icon',
			[refKey]: attachRef<HTMLSpanElement>((n) => (ref = n))
		})
	);
</script>

{#if child}
	{@render child({ props: merged })}
{:else}
	<span {...merged}>{@render children?.()}</span>
{/if}

<style>
	.segmented__icon {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		font-size: 1.05em;
	}
</style>
