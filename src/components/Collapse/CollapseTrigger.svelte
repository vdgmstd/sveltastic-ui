<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { HTMLButtonAttributes } from 'svelte/elements';
	import type { WithElementRef } from '../../types';

	export type CollapseTriggerProps = WithElementRef<
		{
			children?: Snippet;
			/** Render-delegation: receive the merged props and render your own trigger element. */
			child?: Snippet<[{ props: Record<string, unknown> }]>;
		} & Omit<HTMLButtonAttributes, 'children'>,
		HTMLButtonElement
	>;
</script>

<script lang="ts">
	import { createAttachmentKey } from 'svelte/attachments';
	import { cn } from '../../utils/cn';
	import { mergeProps } from '../../utils/mergeProps';
	import { attachRef } from '../../utils/ref';
	import { getCollapseItemContext } from './context';

	let { ref = $bindable(null), class: className, children, child, ...rest }: CollapseTriggerProps =
		$props();
	const root = getCollapseItemContext();

	const refKey = createAttachmentKey();
	const rovingKey = createAttachmentKey();
	const registerRoving = (node: HTMLElement) => root.registerRoving(node);

	const merged = $derived(
		mergeProps(rest, root.triggerAttrs, {
			class: cn('collapse__header', className),
			[refKey]: attachRef<HTMLButtonElement>((n) => (ref = n)),
			[rovingKey]: registerRoving
		})
	);
</script>

{#if child}
	{@render child({ props: merged })}
{:else}
	<button {...merged}>{@render children?.()}</button>
{/if}
