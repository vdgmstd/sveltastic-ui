<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import type { WithElementRef } from '../../types';

	export type ToastTitleProps = WithElementRef<
		Omit<HTMLAttributes<HTMLDivElement>, 'children'> & {
			children?: Snippet;
			/** Render-delegation: receive the merged props and render your own element. */
			child?: Snippet<[{ props: Record<string, unknown> }]>;
		},
		HTMLDivElement
	>;
</script>

<script lang="ts">
	import { createAttachmentKey } from 'svelte/attachments';
	import { cn } from '../../utils/cn';
	import { mergeProps } from '../../utils/mergeProps';
	import { attachRef } from '../../utils/ref';
	import { getToastCtx } from './context';

	let { ref = $bindable(null), children, child, class: className, ...rest }: ToastTitleProps =
		$props();
	const ctx = getToastCtx();

	const refKey = createAttachmentKey();
	const merged = $derived(
		mergeProps(rest, {
			class: cn('toast__title', className),
			[refKey]: attachRef<HTMLDivElement>((n) => (ref = n))
		})
	);
</script>

{#if child}
	{@render child({ props: merged })}
{:else}
	<div {...merged}>{#if children}{@render children()}{:else}{ctx.entry.title ?? ''}{/if}</div>
{/if}
