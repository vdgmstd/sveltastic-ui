<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import type { WithElementRef } from '../../types';

	export type CardBodyProps = WithElementRef<
		{
			/** Body content — rendered inside `.card__text`. May contain a `Card.Header`. */
			children?: Snippet;
			/** Render-delegation for the `.card__text` element. */
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

	let { children, child, ref = $bindable(null), class: className, ...rest }: CardBodyProps = $props();

	const refKey = createAttachmentKey();

	let merged = $derived(
		mergeProps(rest, { class: cn('card__text', className), [refKey]: attachRef<HTMLDivElement>((n) => (ref = n)) })
	);
</script>

{#if child}
	{@render child({ props: merged })}
{:else}
	<div {...merged}>{@render children?.()}</div>
{/if}
