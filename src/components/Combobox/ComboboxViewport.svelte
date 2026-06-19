<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import type { WithElementRef } from '../../types';

	export type ComboboxViewportProps = WithElementRef<
		Omit<HTMLAttributes<HTMLDivElement>, 'children'> & {
			children?: Snippet;
			/** Render-delegation: receive the merged props and render your own scroll region. */
			child?: Snippet<[{ props: Record<string, unknown> }]>;
		},
		HTMLDivElement
	>;
</script>

<script lang="ts" generics="V">
	import { createAttachmentKey } from 'svelte/attachments';
	import { cn } from '../../utils/cn';
	import { mergeProps } from '../../utils/mergeProps';
	import { attachRef } from '../../utils/ref';
	import { dataState } from '../../utils/attrs';
	import { getComboboxCtx } from './context';

	let { ref = $bindable(null), children, child, class: className, ...rest }: ComboboxViewportProps =
		$props();
	const root = getComboboxCtx<V>();

	const refKey = createAttachmentKey();
	const merged = $derived(
		mergeProps(rest, {
			class: cn('combobox__viewport', className),
			role: 'presentation',
			'data-combobox-viewport': '',
			'data-state': dataState(root.open ? 'open' : 'closed'),
			[refKey]: attachRef<HTMLDivElement>((n) => (ref = n))
		})
	);
</script>

{#if child}
	{@render child({ props: merged })}
{:else}
	<div {...merged}>{@render children?.()}</div>
{/if}

<style>
	.combobox__viewport {
		display: contents;
	}
</style>
