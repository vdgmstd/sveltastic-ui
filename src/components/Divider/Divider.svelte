<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import type { Color, WithElementRef } from '../../types';
	import type {
		DividerOrientation,
		DividerVariant,
		DividerLabelPlacement
	} from './divider.svelte';

	export type { DividerOrientation, DividerVariant, DividerLabelPlacement };

	export type DividerRootProps = WithElementRef<
		{
			/** Axis of the divider. */
			orientation?: DividerOrientation;
			/** Line style. */
			variant?: DividerVariant;
			/** Line thickness — number (px) or any CSS length. */
			thickness?: number | string;
			/** Palette name or hex / `rgb(...)` / `r,g,b`. Defaults to a subtle `--text` mix. */
			color?: Color;
			/** Leading inset gutter — `true` = 1.5rem, or any CSS length. */
			inset?: boolean | string;
			/** Where the label sits along the line. Ignored when there is no label. */
			labelPlacement?: DividerLabelPlacement;
			/** Purely visual — sets `aria-hidden`, drops the `separator` role. No-op when a label is present. */
			decorative?: boolean;
			/** Render-delegation: receive the merged prop bag and render your own element. Ignored when a label is present. */
			child?: Snippet<[{ props: Record<string, unknown> }]>;
			/** Compose `Divider.Line` / `Divider.Label`. Renders the divider with a centred / inline cap. */
			children?: Snippet;
		} & Omit<HTMLAttributes<HTMLDivElement>, 'children'>
	>;
</script>

<script lang="ts">
	import { createAttachmentKey } from 'svelte/attachments';
	import { rgbTriplet } from '../../utils/color';
	import { cn } from '../../utils/cn';
	import { attachRef } from '../../utils/ref';
	import { mergeProps } from '../../utils/mergeProps';
	import Separator from '../../primitives/Separator.svelte';
	import { setDividerCtx } from './context';
	import { DividerRootState } from './divider.svelte';

	let {
		orientation = 'horizontal',
		variant = 'solid',
		thickness = 1,
		color,
		inset = false,
		labelPlacement = 'center',
		decorative = false,
		children,
		child,
		ref = $bindable(null),
		class: className,
		style: userStyle,
		...rest
	}: DividerRootProps = $props();

	const labelId = $props.id();

	setDividerCtx(
		new DividerRootState({
			getLabelId: () => labelId
		})
	);

	let triplet = $derived(color ? rgbTriplet(color) : null);
	let lineColor = $derived(triplet ? `rgb(${triplet})` : 'rgb(var(--text) / 0.12)');
	let lineThickness = $derived(typeof thickness === 'number' ? `${thickness}px` : thickness);
	let insetValue = $derived(inset === true ? '1.5rem' : inset || '0');
	let hasLabel = $derived(!!children);

	let styleVars = $derived(
		`--line-color:${lineColor};--line-thickness:${lineThickness};--line-style:${variant};` +
			`--inset:${insetValue};${userStyle ?? ''}`
	);

	const refKey = createAttachmentKey();

	let labelledProps = $derived(
		mergeProps(rest, {
			class: cn('separator', 'separator--labelled', className),
			role: 'separator' as const,
			'aria-orientation': 'horizontal' as const,
			'aria-labelledby': labelId,
			'data-orientation': 'horizontal',
			'data-variant': variant,
			'data-placement': labelPlacement,
			'data-testid': 'divider',
			style: styleVars,
			[refKey]: attachRef<HTMLElement>((n) => (ref = n))
		})
	);
</script>

{#if hasLabel}
	<div {...labelledProps}>{@render children?.()}</div>
{:else}
	<Separator
		bind:ref
		{orientation}
		{variant}
		{thickness}
		{color}
		{inset}
		{decorative}
		{child}
		class={className}
		style={userStyle}
		data-testid="divider"
		{...rest}
	/>
{/if}

<style>
	:where(.separator--labelled) {
		--line-color: rgb(var(--text) / 0.12);
		--line-thickness: 1px;
		--line-style: solid;
		--inset: 0;
		display: flex;
		align-items: center;
		gap: 0.75rem;
		width: 100%;
		color: rgb(var(--text) / 0.7);
		font-size: var(--fs-md);
		line-height: 1;
	}

	.separator--labelled :global(.separator__line) {
		flex: 1;
		height: var(--line-thickness);
		border-top: var(--line-thickness) var(--line-style) var(--line-color);
	}

	.separator--labelled :global(.separator__label) {
		flex-shrink: 0;
		white-space: nowrap;
	}

	.separator[data-placement='start'] :global(.separator__line:first-child) {
		flex: 0 0 var(--inset);
	}
	.separator[data-placement='start'] :global(.separator__line:last-child) {
		flex: 1;
	}

	.separator[data-placement='end'] :global(.separator__line:first-child) {
		flex: 1;
	}
	.separator[data-placement='end'] :global(.separator__line:last-child) {
		flex: 0 0 var(--inset);
	}
</style>
