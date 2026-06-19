<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { HTMLButtonAttributes } from 'svelte/elements';
	import type { WithElementRef } from '../../types';

	export type ToastActionProps = WithElementRef<
		Omit<HTMLButtonAttributes, 'children'> & {
			/** Close the toast after the action runs. */
			closeOnClick?: boolean;
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
	import { getToastCtx } from './context';

	let {
		closeOnClick = true,
		onclick,
		ref = $bindable(null),
		class: className,
		children,
		child,
		...rest
	}: ToastActionProps = $props();
	const ctx = getToastCtx();

	function handleClick(e: MouseEvent & { currentTarget: EventTarget & HTMLButtonElement }): void {
		onclick?.(e);
		if (closeOnClick) ctx.close();
	}

	const refKey = createAttachmentKey();
	const merged = $derived(
		mergeProps(rest, {
			type: 'button' as const,
			class: cn('toast__action-button', className),
			onclick: handleClick,
			[refKey]: attachRef<HTMLButtonElement>((n) => (ref = n))
		})
	);
</script>

{#if child}
	{@render child({ props: merged })}
{:else}
	<button {...merged}>{@render children?.()}</button>
{/if}
