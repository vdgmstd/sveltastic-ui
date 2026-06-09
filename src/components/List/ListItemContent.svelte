<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import type { WithElementRef } from '../../types';

	export type ListItemContentProps = WithElementRef<
		{
			/** Stacked primary + secondary text — `<List.ItemLabel>` / `<List.ItemDescription>`. */
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
	}: ListItemContentProps = $props();

	const attrs = $derived({
		class: 'list-item__main',
		'data-testid': 'list-item-content',
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
	.list-item__main {
		position: relative;
		z-index: 1;
		display: flex;
		flex-direction: column;
		flex: 1 1 auto;
		min-width: 0;
		gap: var(--space-1);
		padding: var(--item-pad-y) 0;
	}
</style>
