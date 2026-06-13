<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { HTMLButtonAttributes } from 'svelte/elements';
	import type { WithElementRef } from '../../types';

	export type ChipCloseProps = WithElementRef<
		{
			children?: Snippet;
			child?: Snippet<[{ props: Record<string, unknown> }]>;
			/** Accessible label for the close button. Override for localized labels. */
			ariaLabel?: string;
			/** Fired when the close button is activated (unless the chip is disabled). */
			onclose?: (event: MouseEvent) => void;
		} & Omit<HTMLButtonAttributes, 'children'>,
		HTMLButtonElement
	>;
</script>

<script lang="ts">
	import { createAttachmentKey } from 'svelte/attachments';
	import { XIcon } from 'phosphor-svelte';
	import { cn } from '../../utils/cn';
	import { attachRef } from '../../utils/ref';
	import { mergeProps } from '../../utils/mergeProps';
	import { useChipCtx } from './context';

	let {
		children,
		child,
		ariaLabel = 'Remove',
		onclose,
		onclick,
		ref = $bindable(null),
		class: className,
		...rest
	}: ChipCloseProps = $props();
	const ctx = useChipCtx();

	function fireClose(event: Event): void {
		if (ctx.disabled) return;
		event.stopPropagation();
		onclose?.(event as MouseEvent);
		onclick?.(event as MouseEvent & { currentTarget: EventTarget & HTMLButtonElement });
	}

	// On an interactive chip the close affordance is presentational — Delete/Backspace on the chip triggers it.
	$effect(() => {
		if (!ctx.isInteractive) return;
		return ctx.registerClose(fireClose);
	});

	let isPresentational = $derived(ctx.isInteractive);

	const refKey = createAttachmentKey();
	let merged = $derived(
		mergeProps(rest, {
			class: cn('chip__close', className),
			onclick: fireClose,
			...(isPresentational
				? { 'aria-hidden': 'true' as const }
				: {
						type: 'button' as const,
						'aria-label': ariaLabel,
						disabled: ctx.disabled || undefined
					}),
			[refKey]: attachRef<HTMLButtonElement>((n) => (ref = n))
		})
	);
</script>

{#if child}
	{@render child({ props: merged })}
{:else if isPresentational}
	<span {...merged}>
		{@render children?.()}
		<XIcon size={16} weight="bold" />
	</span>
{:else}
	<button {...merged}>
		{@render children?.()}
		<XIcon size={16} weight="bold" />
	</button>
{/if}

<style>
	.chip__close {
		position: absolute;
		inset-inline-end: calc(var(--chip-pad-x) / 2);
		top: 50%;
		transform: translateY(-50%);
		z-index: 2;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		flex: 0 0 auto;
		width: var(--chip-close-size);
		height: var(--chip-close-size);
		padding: 0;
		border: 0;
		border-radius: var(--rad-circle);
		background: rgb(var(--c) / 0.18);
		color: inherit;
		cursor: pointer;
		outline: none;
		transition: background 180ms var(--ease-standard);
	}
	.chip__close:hover {
		background: rgb(var(--c) / 0.32);
	}
	.chip__close:focus-visible {
		outline: 2px solid rgb(var(--c) / 0.6);
		outline-offset: 2px;
	}
	.chip__close:disabled {
		cursor: not-allowed;
	}
	.chip__close :global(svg) {
		width: var(--chip-close-icon);
		height: var(--chip-close-icon);
	}

	/* Per-variant close-button surfaces — cascade from the variant class on Chip.Root. */
	:global(.chip--default) .chip__close,
	:global(.chip--gradient) .chip__close,
	:global(.chip--flat[data-active]) .chip__close,
	:global(.chip--border[data-active]) .chip__close {
		background: rgb(0 0 0 / 0.18);
	}
	:global(.chip--default) .chip__close:hover,
	:global(.chip--gradient) .chip__close:hover,
	:global(.chip--flat[data-active]) .chip__close:hover,
	:global(.chip--border[data-active]) .chip__close:hover {
		background: rgb(0 0 0 / 0.3);
	}
	:global(.chip--transparent) .chip__close {
		background: rgb(var(--c) / 0.12);
	}
</style>
