<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import type { WithElementRef } from '../../types';

	export type ListItemDescriptionProps = WithElementRef<
		{
			/** Secondary text under the label (ellipsis-truncated). */
			children?: Snippet;
			/** Render-delegation: receive the merged props and render your own element. */
			child?: Snippet<[{ props: Record<string, unknown> }]>;
		} & Omit<HTMLAttributes<HTMLSpanElement>, 'children'>,
		HTMLSpanElement
	>;
</script>

<script lang="ts">
	import { createAttachmentKey } from 'svelte/attachments';
	import { mergeProps } from '../../utils/mergeProps';
	import { attachRef } from '../../utils/ref';

	let {
		children,
		child,
		ref = $bindable(null),
		class: className,
		style: userStyle,
		...rest
	}: ListItemDescriptionProps = $props();

	const attrs = $derived({
		class: 'list-item__desc',
		'data-testid': 'list-item-description',
		style: userStyle
	});
	const merged = $derived(
		mergeProps(rest, attrs, {
			class: className,
			[createAttachmentKey()]: attachRef<HTMLSpanElement>((n) => (ref = n))
		})
	);
</script>

{#if child}
	{@render child({ props: merged })}
{:else}
	<span {...merged}>{@render children?.()}</span>
{/if}

<style>
	.list-item__desc {
		display: block;
		min-width: 0;
		font-size: 0.78em;
		opacity: 0.6;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		line-height: 1.3;
	}
</style>
