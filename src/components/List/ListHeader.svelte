<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import type { WithElementRef } from '../../types';

	export type ListHeaderProps = WithElementRef<
		{
			/** Header content (small uppercase caption). */
			children?: Snippet;
			/** Render-delegation: receive the merged props and render your own element. */
			child?: Snippet<[{ props: Record<string, unknown> }]>;
		} & Omit<HTMLAttributes<HTMLDivElement>, 'children'>
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
	}: ListHeaderProps = $props();

	const attrs = $derived({ class: 'list__header', 'data-testid': 'list-header', style: userStyle });
	const merged = $derived(
		mergeProps(rest, attrs, {
			class: className,
			[createAttachmentKey()]: attachRef<HTMLDivElement>((n) => (ref = n))
		})
	);
</script>

{#if child}
	{@render child({ props: merged })}
{:else}
	<div {...merged}>{@render children?.()}</div>
{/if}

<style>
	.list__header {
		font-size: var(--fs-sm);
		text-transform: uppercase;
		letter-spacing: 0.08em;
		font-weight: 600;
		opacity: 0.55;
		padding: 0 var(--space-6) var(--space-3);
		-webkit-user-select: none;
		user-select: none;
	}
</style>
