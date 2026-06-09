<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import type { WithElementRef } from '../../types';

	export type CardFooterProps = WithElementRef<
		{
			/** Float the strip absolutely, pinned to the card's bottom edge and hung 50% outside it (`.card__actions`). Default `false` renders the in-flow `.card__buttons` strip. */
			floating?: boolean;
			/** Footer content. */
			children?: Snippet;
			/** Render-delegation for the footer element. */
			child?: Snippet<[{ props: Record<string, unknown> }]>;
		} & Omit<HTMLAttributes<HTMLDivElement>, 'children'>,
		HTMLDivElement
	>;
</script>

<script lang="ts">
	import { createAttachmentKey } from 'svelte/attachments';
	import { cn } from '../../utils/cn';
	import { boolAttr } from '../../utils/attrs';
	import { attachRef } from '../../utils/ref';
	import { mergeProps } from '../../utils/mergeProps';

	let {
		floating = false,
		children,
		child,
		ref = $bindable(null),
		class: className,
		...rest
	}: CardFooterProps = $props();

	const refKey = createAttachmentKey();

	let merged = $derived(
		mergeProps(rest, {
			class: cn(floating ? 'card__actions' : 'card__buttons', className),
			'data-floating': boolAttr(floating),
			[refKey]: attachRef<HTMLDivElement>((n) => (ref = n))
		})
	);
</script>

{#if child}
	{@render child({ props: merged })}
{:else}
	<div {...merged}>{@render children?.()}</div>
{/if}
