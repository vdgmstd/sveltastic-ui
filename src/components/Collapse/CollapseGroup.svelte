<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import type { Color, Shape, Size, WithElementRef } from '../../types';
	import type { CollapseGroupLayout, CollapseGroupType, CollapseVariant } from './context';

	export type { CollapseGroupLayout } from './context';

	export type CollapseGroupProps = WithElementRef<
		{
			/** Selection type. `single` collapses siblings on open; `multiple` allows any combination. */
			type?: CollapseGroupType;
			/** Bonded item keys (or single key when `type='single'`). Two-way bindable. */
			value?: string | string[] | null;
			/** Visual layout. `stack` — separate cards with gap. `fused` — items joined as one block. `card` — wrapped in a shared card surface. */
			layout?: CollapseGroupLayout;
			/** Default `variant` cascaded to children. */
			variant?: CollapseVariant;
			/** Default `color` cascaded to children. */
			color?: Color;
			/** Default `size` cascaded to children. */
			size?: Size;
			/** Default `shape` cascaded to children. */
			shape?: Shape;
			/** Vertical gap between items (px). Ignored for `fused` and `card` layouts. */
			gap?: number;
			/** Arrow-key axis. Default `vertical`. */
			orientation?: 'vertical' | 'horizontal';
			/** Wrap arrow navigation past the ends. Default `true`. */
			loop?: boolean;
			/** Title row above the items (visible in all layouts). Use the `child` snippet for richer content. */
			title?: string;
			/** Footer row below the items. Use the `child` snippet for richer content. */
			footer?: string;
			/** Group children. */
			children?: Snippet;
			/** Fired when the open set changes. */
			onValueChange?: (value: string | string[] | null) => void;
			/** Render-delegation: receive the merged props and render your own root element. */
			child?: Snippet<[{ props: Record<string, unknown> }]>;
		} & Omit<HTMLAttributes<HTMLDivElement>, 'color' | 'title'>,
		HTMLDivElement
	>;
</script>

<script lang="ts">
	import { createAttachmentKey } from 'svelte/attachments';
	import { rgbTriplet } from '../../utils/color';
	import { cn } from '../../utils/cn';
	import { mergeProps } from '../../utils/mergeProps';
	import { attachRef } from '../../utils/ref';
	import { setCollapseGroupContext } from './context';
	import { CollapseGroupState } from './collapseState.svelte';

	let {
		ref = $bindable(null),
		type = 'single',
		value = $bindable(type === 'multiple' ? [] : null),
		layout = 'stack',
		variant,
		color,
		size,
		shape,
		gap = 8,
		orientation = 'vertical',
		loop = true,
		title = '',
		footer = '',
		children,
		onValueChange,
		child,
		class: className,
		style: userStyle,
		...rest
	}: CollapseGroupProps = $props();

	const baseId = $props.id();
	let triplet = $derived(color ? rgbTriplet(color) : undefined);
	let autoCounter = 0;

	const group = new CollapseGroupState({
		type: () => type,
		value: () => value,
		setValue: (next) => {
			value = next;
			onValueChange?.(next);
		},
		layout: () => layout,
		variant: () => variant,
		color: () => color,
		size: () => size,
		shape: () => shape,
		orientation: () => orientation,
		loop: () => loop,
		nextKey: () => {
			autoCounter += 1;
			return `${baseId}-item-${autoCounter}`;
		}
	});

	setCollapseGroupContext(group);

	$effect(() => {
		group.roving.orientation = orientation;
		group.roving.loop = loop;
	});

	const refKey = createAttachmentKey();
	const attrs = $derived({
		class: cn('collapse-group', `collapse-group--${layout}`, className),
		'data-orientation': orientation,
		'data-testid': 'collapse-group',
		[refKey]: attachRef<HTMLDivElement>((n) => (ref = n))
	});
	const merged = $derived(mergeProps(rest, attrs));
</script>

{#snippet body()}
	{#if title}
		<div class="collapse-group__header">{title}</div>
	{/if}

	<div class="collapse-group__body">
		{@render children?.()}
	</div>

	{#if footer}
		<div class="collapse-group__footer">{footer}</div>
	{/if}
{/snippet}

{#if child}
	{@render child({
		props: {
			...merged,
			style: `--collapse-group-gap:${gap}px;${triplet ? `--cg-c:${triplet};` : ''}${userStyle ?? ''}`
		}
	})}
{:else}
	<div
		{...merged}
		style:--collapse-group-gap="{gap}px"
		style:--cg-c={triplet}
		style={userStyle}
	>
		{@render body()}
	</div>
{/if}

<style>
	:where(.collapse-group) {
		display: flex;
		flex-direction: column;
		width: 100%;
		color: rgb(var(--text));
		box-sizing: border-box;
	}

	.collapse-group__body {
		display: flex;
		flex-direction: column;
		min-width: 0;
	}

	.collapse-group__header,
	.collapse-group__footer {
		min-width: 0;
	}

	.collapse-group--stack > .collapse-group__header {
		font-size: var(--fs-sm);
		text-transform: uppercase;
		letter-spacing: 0.04em;
		opacity: 0.6;
		margin-bottom: var(--space-4);
	}
	.collapse-group--stack > .collapse-group__footer {
		font-size: var(--fs-sm);
		opacity: 0.6;
		margin-top: var(--space-4);
	}

	.collapse-group--stack > .collapse-group__body {
		gap: var(--collapse-group-gap, var(--space-4));
	}

	.collapse-group--fused > .collapse-group__header {
		font-size: var(--fs-sm);
		text-transform: uppercase;
		letter-spacing: 0.04em;
		opacity: 0.6;
		margin-bottom: var(--space-4);
	}
	.collapse-group--fused > .collapse-group__footer {
		font-size: var(--fs-sm);
		opacity: 0.6;
		margin-top: var(--space-4);
	}

	.collapse-group--fused > .collapse-group__body {
		gap: 0;
	}
	.collapse-group--fused > .collapse-group__body :global(.collapse + .collapse) {
		margin-top: -1px;
	}
	.collapse-group--fused
		> .collapse-group__body
		:global(.collapse:not(:first-child):not(:last-child)) {
		border-radius: 0;
	}
	.collapse-group--fused > .collapse-group__body :global(.collapse:first-child) {
		border-end-start-radius: 0;
		border-end-end-radius: 0;
	}
	.collapse-group--fused > .collapse-group__body :global(.collapse:last-child) {
		border-start-start-radius: 0;
		border-start-end-radius: 0;
	}

	:where(.collapse-group--card) {
		background: rgb(var(--gray-1));
		border-radius: var(--radius);
		box-shadow:
			inset 0 0 0 1px rgb(var(--gray-4)),
			0 5px 20px 0 rgb(0 0 0 / calc(var(--shadow-opacity) * 0.7));
		overflow: hidden;
	}

	.collapse-group--card > .collapse-group__header {
		padding: var(--space-7) var(--space-8);
		font-weight: 600;
		font-size: var(--fs-lg);
		color: rgb(var(--cg-c, var(--text)));
		border-bottom: 1px solid rgb(var(--gray-4));
		background: rgb(var(--background) / 0.5);
	}

	.collapse-group--card > .collapse-group__footer {
		padding: var(--space-6) var(--space-8);
		font-size: var(--fs-md);
		opacity: 0.75;
		border-top: 1px solid rgb(var(--gray-4));
		background: rgb(var(--background) / 0.5);
	}

	.collapse-group--card > .collapse-group__body :global(.collapse) {
		border-radius: 0;
	}
	.collapse-group--card > .collapse-group__body :global(.collapse::before),
	.collapse-group--card > .collapse-group__body :global(.collapse::after) {
		display: none;
	}
	.collapse-group--card > .collapse-group__body :global(.collapse:not(:last-child)) {
		border-bottom: 1px solid rgb(var(--gray-4));
	}

	:global([data-theme='dark']) :where(.collapse-group--card) {
		background: rgb(var(--gray-1));
		box-shadow:
			inset 0 0 0 1px rgb(var(--gray-2)),
			0 5px 20px 0 rgb(0 0 0 / calc(var(--shadow-opacity) * 0.6));
	}
	:global([data-theme='dark']) .collapse-group--card > .collapse-group__header,
	:global([data-theme='dark']) .collapse-group--card > .collapse-group__footer {
		border-color: rgb(var(--gray-2));
		background: rgb(var(--gray-2) / 0.4);
	}
	:global([data-theme='dark'])
		.collapse-group--card
		> .collapse-group__body
		:global(.collapse:not(:last-child)) {
		border-bottom-color: rgb(var(--gray-2));
	}
</style>
