<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { HTMLButtonAttributes } from 'svelte/elements';
	import type { WithElementRef } from '../../types';

	export type DialogTriggerProps = WithElementRef<
		Omit<HTMLButtonAttributes, 'children'> & {
			children?: Snippet;
			/** Render-delegation: receive the merged props and render your own element. */
			child?: Snippet<[{ props: Record<string, unknown> }]>;
		},
		HTMLButtonElement
	>;
</script>

<script lang="ts">
	import { createAttachmentKey } from 'svelte/attachments';
	import { getDialogCtx } from './context';
	import { mergeProps } from '../../utils/mergeProps';
	import { attachRef } from '../../utils/ref';
	import { dataState } from '../../utils/attrs';

	let { ref = $bindable(null), class: className, children, child, ...rest }: DialogTriggerProps =
		$props();
	const root = getDialogCtx();
	const refKey = createAttachmentKey();

	const attrs = $derived({
		type: 'button' as const,
		'aria-haspopup': 'dialog' as const,
		'aria-expanded': root.open,
		'aria-controls': root.contentId,
		'data-state': dataState(root.open ? 'open' : 'closed'),
		onclick: () => root.setOpen(true)
	});
	const merged = $derived(
		mergeProps(rest, attrs, {
			class: className,
			[refKey]: attachRef<HTMLButtonElement>((n) => (ref = n))
		})
	);
</script>

{#if child}
	{@render child({ props: merged })}
{:else}
	<button {...merged}>{@render children?.()}</button>
{/if}
