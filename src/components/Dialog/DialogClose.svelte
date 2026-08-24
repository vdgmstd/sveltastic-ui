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
		<span class="dialog__close-plate">
			{#if children}{@render children()}{:else}<XIcon size={16} weight="bold" />{/if}
		</span>
	</button>
{/if}

<style>
	:where(.dialog__close) {
		--dialog-close-hit: 44px;
		--dialog-close-plate: 32px;
		--dialog-close-inset: 12px;
		--dialog-close-bleed: calc((var(--dialog-close-hit) - var(--dialog-close-plate)) / 2);

		position: absolute;
		top: calc(var(--dialog-close-inset) - var(--dialog-close-bleed));
		inset-inline-end: calc(var(--dialog-close-inset) - var(--dialog-close-bleed));
		width: var(--dialog-close-hit);
		height: var(--dialog-close-hit);
		padding: 0;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		background: transparent;
		border: 0;
		color: inherit;
		cursor: pointer;
		-webkit-user-select: none;
		user-select: none;
		z-index: 2;
	}
	/* The ring belongs on the visual plate, not on the invisible touch box. */
	.dialog__close:focus-visible { outline: none; }

	.dialog__close-plate {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: var(--dialog-close-plate);
		height: var(--dialog-close-plate);
		border-radius: var(--rad-md);
		opacity: 0.7;
		transition:
			opacity 200ms var(--ease-standard),
			background-color 200ms var(--ease-standard);
	}
	.dialog__close:hover .dialog__close-plate {
		opacity: 1;
		background: rgb(var(--text) / 0.08);
	}
	.dialog__close:focus-visible .dialog__close-plate {
		opacity: 1;
		outline: 2px solid rgb(var(--c) / 0.6);
		outline-offset: 2px;
	}
</style>
