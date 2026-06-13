<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import type { WithElementRef } from '../../types';

	/** Where the glyph lives: inside the sliding knob, or as the track label shown when on / off. */
	export type SwitchIconState = 'knob' | 'on' | 'off';

	export type SwitchIconProps = WithElementRef<
		{
			/** Slot: `knob` (inside the circle), `on` (track label when checked), `off` (track label when unchecked). */
			state?: SwitchIconState;
			/** Glyph content. */
			children?: Snippet;
			/** Render-delegation: receive the merged props and render your own glyph element. */
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
		state = 'on',
		children,
		child,
		ref = $bindable(null),
		class: className,
		...rest
	}: SwitchIconProps = $props();

	useSwitchContext();

	const refKey = createAttachmentKey();
	const merged = $derived(
		mergeProps(rest, {
			class: cn('switch__text', `switch__text--${state}`, className),
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
	/* Inline labels: padding shifts content past the knob; checked flips padding and swaps on/off. */
	.switch__text {
		position: relative;
		z-index: 9;
		display: flex;
		align-items: center;
		justify-content: center;
		padding-block: var(--space-3);
		padding-inline: var(--space-9) var(--space-3);
		font-size: var(--fs-sm);
		color: rgb(var(--text));
		white-space: nowrap;
		overflow: hidden;
		transition: 0.25s 0.05s;
	}
	.switch__text--on {
		position: absolute;
		opacity: 0;
		transform: translateX(-100%);
	}
	:global(.switch[data-checked]) .switch__text {
		padding-inline: var(--space-3) var(--space-9);
		color: rgb(var(--on-accent));
	}
	:global(.switch[data-checked]) .switch__text--on {
		position: relative;
		opacity: 1;
		transform: translateX(0);
	}
	:global(.switch[data-checked]) .switch__text--off {
		position: absolute;
		opacity: 0;
		transform: translateX(100%);
	}

	/* Knob glyph rides inside the sliding circle, not the track. */
	.switch__text--knob {
		position: static;
		z-index: auto;
		padding: 0;
		font-size: inherit;
		color: inherit;
		transition: none;
	}

	:global(.switch[data-loading]) .switch__text {
		opacity: 0 !important;
	}

	/* RTL: the off/on labels slide horizontally — mirror the hidden-offset direction. */
	:global([dir='rtl']) .switch__text--on {
		transform: translateX(100%);
	}
	:global([dir='rtl'] .switch[data-checked]) .switch__text--off {
		transform: translateX(-100%);
	}
</style>
