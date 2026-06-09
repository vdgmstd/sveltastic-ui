<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import type { WithElementRef } from '../../types';

	export type ListItemLeadProps = WithElementRef<
		{
			/** Leading visual (avatar / icon). */
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
	}: ListItemLeadProps = $props();

	const attrs = $derived({
		class: 'list-item__lead',
		'data-testid': 'list-item-lead',
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
	.list-item__lead {
		position: relative;
		z-index: 1;
		display: inline-flex;
		flex: 0 0 auto;
		align-items: center;
		justify-content: center;
		transition:
			transform 220ms var(--ease-spring),
			color 220ms var(--ease-standard);
		transform-origin: center;
	}
</style>
