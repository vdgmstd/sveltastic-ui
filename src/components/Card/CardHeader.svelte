<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import type { WithElementRef } from '../../types';

	export type CardHeaderProps = WithElementRef<
		{
			/** Title content — rendered inside `.card__title`. */
			children?: Snippet;
			/** Render-delegation for the `.card__title` element. */
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

	let { children, child, ref = $bindable(null), class: className, ...rest }: CardHeaderProps = $props();

	const refKey = createAttachmentKey();

	let merged = $derived(
		mergeProps(rest, { class: cn('card__title', className), [refKey]: attachRef<HTMLDivElement>((n) => (ref = n)) })
	);
</script>

{#if child}
	{@render child({ props: merged })}
{:else}
	<div {...merged}>{@render children?.()}</div>
{/if}
