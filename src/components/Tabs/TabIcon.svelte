<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { WithElementRef } from '../../types';
	import type { HTMLAttributes } from 'svelte/elements';

	export type TabsIconProps = WithElementRef<
		{
			/** Icon content. */
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
		ref = $bindable(null),
		children,
		child,
		class: className,
		...rest
	}: TabsIconProps = $props();

	const refKey = createAttachmentKey();
	const attrs = { class: 'tab__icon', 'aria-hidden': 'true' as const, 'data-testid': 'tab-icon' };
	const merged = $derived(
		mergeProps(rest, attrs, {
			class: className,
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
	.tab__icon {
		display: inline-flex;
		align-items: center;
		font-size: 1.05em;
	}
</style>
