<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import type { WithElementRef } from '../../types';

	export type SwitchThumbProps = WithElementRef<
		{
			/** Knob content — a small `<Switch.Icon state="knob">` glyph. */
			children?: Snippet;
			/** Render-delegation: receive the merged props and render your own knob element. */
			child?: Snippet<[{ props: Record<string, unknown> }]>;
		} & Omit<HTMLAttributes<HTMLDivElement>, 'children'>,
		HTMLDivElement
	>;
</script>

<script lang="ts">
	import { createAttachmentKey } from 'svelte/attachments';
	import { cn } from '../../utils/cn';
	import { mergeProps } from '../../utils/mergeProps';
	import { attachRef } from '../../utils/ref';
	import { useSwitchContext } from './context';

	let {
		children,
		child,
		ref = $bindable(null),
		class: className,
		...rest
	}: SwitchThumbProps = $props();

	useSwitchContext();

	const refKey = createAttachmentKey();
	const merged = $derived(
		mergeProps(rest, {
			class: cn('switch__circle', className),
			'aria-hidden': 'true',
			[refKey]: attachRef<HTMLDivElement>((n) => (ref = n))
		})
	);
</script>

{#if child}
	{@render child({ props: merged })}
{:else}
	<div {...merged}>{@render children?.()}</div>
{/if}

<style>
	.switch__circle {
		position: absolute;
		left: var(--knob-pad);
		width: var(--knob-d);
		height: var(--knob-d);
		border-radius: var(--inner-radius);
		background: color-mix(in oklab, rgb(var(--gray-2)), rgb(var(--on-accent)) 0%);
		color: rgb(var(--text));
		box-shadow: 0 1px 2px rgb(0 0 0 / 0.12);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 10;
		transition: 0.25s;
	}

	/* Active "drag" — knob widens toward the slide direction. */
	:global(.switch:has(.switch__input:active)) .switch__circle {
		width: calc(var(--knob-d) + 5px);
	}
	:global(.switch[data-checked]:has(.switch__input:active)) .switch__circle {
		left: calc(100% - var(--knob-d) - var(--knob-pad) - 6px);
	}

	/* Settled checked position. */
	:global(.switch[data-checked]) .switch__circle {
		left: calc(100% - var(--knob-d) - var(--knob-pad));
		color: rgb(var(--c));
		box-shadow: -5px 0 25px 0 rgb(var(--background) / 0.6);
	}

	/* Icon-knob (ghost) — strip the white pill, keep only the knob's icon. */
	:global(.switch[data-icon]) .switch__circle {
		background: transparent;
		box-shadow: none;
	}
	:global(.switch[data-icon][data-checked]) .switch__circle {
		color: rgb(255 255 255);
	}

	/* Indeterminate — knob centered. */
	:global(.switch[data-indeterminate]) .switch__circle {
		left: 50%;
		transform: translateX(-50%);
	}

	:global(.switch[data-loading]) .switch__circle {
		opacity: 0;
	}
</style>
