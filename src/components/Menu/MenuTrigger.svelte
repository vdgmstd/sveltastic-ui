<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { WithElementRef } from '../../types';

	export type MenuTriggerProps = WithElementRef<
		{
			children?: Snippet;
			/** Render-delegation: receive the merged anchor props + `open`, render your own element. */
			child?: Snippet<[{ props: Record<string, unknown>; open: boolean }]>;
		},
		HTMLElement
	>;
</script>

<script lang="ts">
	import { createAttachmentKey } from 'svelte/attachments';
	import { mergeProps } from '../../utils/mergeProps';
	import { attachRef } from '../../utils/ref';
	import { dataState, boolAttr } from '../../utils/attrs';
	import { getMenuCtx } from './context';

	let { ref = $bindable(null), children, child, ...rest }: MenuTriggerProps = $props();
	const root = getMenuCtx();

	const refKey = createAttachmentKey();
	const attrs = $derived({
		'data-state': dataState(root.open ? 'open' : 'closed'),
		'data-disabled': boolAttr(root.disabled)
	});
	const merged = $derived(
		mergeProps(rest, attrs, { [refKey]: attachRef<HTMLElement>((n) => (ref = n)) })
	);
	const wrapped = $derived(mergeProps(merged, { class: 'menu-trigger' }));

	$effect(() => {
		root.triggerSnippet = triggerBody;
		return () => {
			if (root.triggerSnippet === triggerBody) root.triggerSnippet = undefined;
		};
	});
</script>

{#snippet triggerBody(arg: { props: Record<string, unknown>; open: boolean })}
	{#if child}
		{@render child({ props: mergeProps(arg.props, merged), open: arg.open })}
	{:else}
		<span {...mergeProps(arg.props, wrapped)}>{@render children?.()}</span>
	{/if}
{/snippet}

<style>
	/* Contents-dissolving wrapper so ref, data attributes and rest land in the default path without a box. */
	.menu-trigger {
		display: contents;
	}
</style>
