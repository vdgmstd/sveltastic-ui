<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { HTMLButtonAttributes } from 'svelte/elements';
	import type { WithElementRef } from '../../types';

	export type PopoverCloseProps = WithElementRef<
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
	import { cn } from '../../utils/cn';
	import { mergeProps } from '../../utils/mergeProps';
	import { attachRef } from '../../utils/ref';
	import { getPopoverCtx } from './context';

	let { ref = $bindable(null), class: className, children, child, ...rest }: PopoverCloseProps =
		$props();
	const root = getPopoverCtx();

	const refKey = createAttachmentKey();
	const merged = $derived(
		mergeProps(rest, {
			type: 'button' as const,
			class: cn('popover-close', className) || undefined,
			'data-popover-close': '',
			onclick: () => root.close(),
			[refKey]: attachRef<HTMLButtonElement>((n) => (ref = n))
		})
	);
</script>

{#if child}
	{@render child({ props: merged })}
{:else}
	<button {...merged}>{@render children?.()}</button>
{/if}
