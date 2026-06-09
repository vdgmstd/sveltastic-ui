<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { HTMLButtonAttributes } from 'svelte/elements';
	import type { WithElementRef } from '../../types';

	export type DialogCloseProps = WithElementRef<
		Omit<HTMLButtonAttributes, 'children'> & {
			children?: Snippet;
			child?: Snippet<[{ props: Record<string, unknown> }]>;
			/** Accessible label for the icon-only close button. */
			ariaLabel?: string;
		},
		HTMLButtonElement
	>;
</script>

<script lang="ts">
	import { createAttachmentKey } from 'svelte/attachments';
	import { XIcon } from 'phosphor-svelte';
	import { getDialogCtx } from './context';
	import { mergeProps } from '../../utils/mergeProps';
	import { attachRef } from '../../utils/ref';
	import { cn } from '../../utils/cn';

	let {
		ref = $bindable(null),
		class: className,
		children,
		child,
		ariaLabel = 'Close dialog',
		...rest
	}: DialogCloseProps = $props();
	const root = getDialogCtx();
	const refKey = createAttachmentKey();

	const attrs = $derived({
		type: 'button' as const,
		'aria-label': ariaLabel,
		onclick: () => root.setOpen(false)
	});
	const merged = $derived(
		mergeProps(rest, attrs, {
			class: cn('dialog__close', className),
			[refKey]: attachRef<HTMLButtonElement>((n) => (ref = n))
		})
	);
</script>

{#if child}
	{@render child({ props: merged })}
{:else}
	<button {...merged}>
		{#if children}{@render children()}{:else}<XIcon size={16} weight="bold" />{/if}
	</button>
{/if}

<style>
	.dialog__close {
		position: absolute;
		top: 12px;
		inset-inline-end: 12px;
		width: 32px;
		height: 32px;
		padding: 0;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		background: transparent;
		border: 0;
		border-radius: var(--rad-md);
		color: inherit;
		cursor: pointer;
		-webkit-user-select: none;
		user-select: none;
		opacity: 0.7;
		transition:
			opacity 200ms var(--ease-standard),
			background-color 200ms var(--ease-standard);
		z-index: 2;
	}
	.dialog__close:hover { opacity: 1; background: rgb(var(--text) / 0.08); }
	.dialog__close:focus-visible {
		outline: 2px solid rgb(var(--c) / 0.6);
		outline-offset: 2px;
	}
</style>
