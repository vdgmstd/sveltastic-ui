<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import type { WithElementRef } from '../../types';

	export type CardOverlayProps = WithElementRef<
		{
			/** Overlay content — rendered inside the absolutely-positioned `.card__interactions` region. Place as a sibling of `Card.Image`, inside `Card.Media`. */
			children?: Snippet;
			/** Render-delegation for the `.card__interactions` element. */
			child?: Snippet<[{ props: Record<string, unknown> }]>;
		} & Omit<HTMLAttributes<HTMLDivElement>, 'children'>,
		HTMLDivElement
	>;
</script>

<script lang="ts">
	import { createAttachmentKey } from 'svelte/attachments';
	import { cn } from '../../utils/cn';
	import { attachRef } from '../../utils/ref';
	import { mergeProps } from '../../utils/mergeProps';

	let { children, child, ref = $bindable(null), class: className, ...rest }: CardOverlayProps =
		$props();

	const refKey = createAttachmentKey();

	let merged = $derived(
		mergeProps(rest, {
			class: cn('card__interactions', className),
			[refKey]: attachRef<HTMLDivElement>((n) => (ref = n))
		})
	);
</script>

{#if child}
	{@render child({ props: merged })}
{:else}
	<div {...merged}>{@render children?.()}</div>
{/if}
