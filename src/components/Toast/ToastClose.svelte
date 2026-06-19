<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { HTMLButtonAttributes } from 'svelte/elements';
	import type { WithElementRef } from '../../types';

	export type ToastCloseProps = WithElementRef<
		Omit<HTMLButtonAttributes, 'children'> & {
			/** Accessible label when no visible children are supplied. */
			ariaLabel?: string;
			children?: Snippet;
			/** Render-delegation: receive the merged props and render your own element. */
			child?: Snippet<[{ props: Record<string, unknown> }]>;
		},
		HTMLButtonElement
	>;
</script>

<script lang="ts">
	import { createAttachmentKey } from 'svelte/attachments';
	import { XIcon } from 'phosphor-svelte';
	import { cn } from '../../utils/cn';
	import { mergeProps } from '../../utils/mergeProps';
	import { attachRef } from '../../utils/ref';
	import { getToastCtx } from './context';

	let {
		ariaLabel,
		ref = $bindable(null),
		class: className,
		children,
		child,
		...rest
	}: ToastCloseProps = $props();
	const ctx = getToastCtx();

	const refKey = createAttachmentKey();
	const merged = $derived(
		mergeProps(rest, {
			type: 'button' as const,
			class: cn('toast__close', className),
			'aria-label': ariaLabel ?? ctx.entry.closeLabel ?? ctx.closeLabel,
			onclick: (e: MouseEvent) => {
				e.stopPropagation();
				ctx.close();
			},
			[refKey]: attachRef<HTMLButtonElement>((n) => (ref = n))
		})
	);
</script>

{#if child}
	{@render child({ props: merged })}
{:else}
	<button {...merged}>
		{#if children}{@render children()}{:else}<XIcon size={14} weight="bold" />{/if}
	</button>
{/if}
