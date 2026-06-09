<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import type { Color, WithElementRef } from '../types';

	export type SeparatorOrientation = 'horizontal' | 'vertical';
	/** Line style — maps to CSS `border-style`, distinct from the kit-wide surface `Variant`. */
	export type SeparatorVariant = 'solid' | 'dashed' | 'dotted';
	export type SeparatorLabelPlacement = 'start' | 'center' | 'end';

	export type SeparatorProps = WithElementRef<
		{
			/** Axis of the separator. */
			orientation?: SeparatorOrientation;
			/** Line style. */
			variant?: SeparatorVariant;
			/** Line thickness — number (px) or any CSS length. */
			thickness?: number | string;
			/** Palette name or hex / `rgb(...)` / `r,g,b`. Defaults to a subtle `--text` mix. */
			color?: Color;
			/** Leading inset gutter — `true` = 1.5rem, or any CSS length. */
			inset?: boolean | string;
			/** Where the label sits along the line. Ignored when there is no label. */
			labelPlacement?: SeparatorLabelPlacement;
			/** Purely visual — sets `aria-hidden`, drops the `separator` role. No-op when a label is present. */
			decorative?: boolean;
			/** Render-delegation: receive the merged prop bag and render your own element. Ignored when a label is present. */
			child?: Snippet<[{ props: Record<string, unknown> }]>;
			/** Optional label content. Renders the separator with a centred / inline cap. */
			children?: Snippet;
		} & Omit<HTMLAttributes<HTMLDivElement>, 'children'>
	>;
</script>

<script lang="ts">
	import { createAttachmentKey } from 'svelte/attachments';
	import { rgbTriplet } from '../utils/color';
	import { cn } from '../utils/cn';
	import { attachRef } from '../utils/ref';
	import { boolAttr } from '../utils/attrs';
	import { mergeProps } from '../utils/mergeProps';

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
	}: SeparatorProps = $props();

	const labelId = $props.id();

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

	let verticalProps = $derived(
		mergeProps(rest, {
			class: cn('separator', 'separator--vertical', className),
			role: decorative ? undefined : ('separator' as const),
			'aria-orientation': decorative ? undefined : ('vertical' as const),
			'aria-hidden': decorative ? ('true' as const) : undefined,
			'data-orientation': 'vertical',
			'data-variant': variant,
			'data-decorative': boolAttr(decorative),
			style: styleVars,
			[refKey]: attachRef<HTMLElement>((n) => (ref = n))
		})
	);

	let labelledProps = $derived(
		mergeProps(rest, {
			class: cn('separator', 'separator--labelled', className),
			role: 'separator' as const,
			'aria-orientation': 'horizontal' as const,
			'aria-labelledby': labelId,
			'data-orientation': 'horizontal',
			'data-variant': variant,
			'data-placement': labelPlacement,
			style: styleVars,
			[refKey]: attachRef<HTMLElement>((n) => (ref = n))
		})
	);

	let horizontalProps = $derived(
		mergeProps(rest, {
			class: cn('separator', 'separator--horizontal', className),
			'aria-hidden': decorative ? ('true' as const) : undefined,
			'data-orientation': 'horizontal',
			'data-variant': variant,
			'data-decorative': boolAttr(decorative),
			style: styleVars,
			[refKey]: attachRef<HTMLElement>((n) => (ref = n))
		})
	);
</script>

{#if orientation === 'vertical'}
	{#if child}
		{@render child({ props: verticalProps })}
	{:else}
		<div {...verticalProps}></div>
	{/if}
{:else if hasLabel}
	<div {...labelledProps}>
		<span class="separator__line" aria-hidden="true"></span>
		<span id={labelId} class="separator__label">{@render children?.()}</span>
		<span class="separator__line" aria-hidden="true"></span>
	</div>
{:else if child}
	{@render child({ props: horizontalProps })}
{:else if decorative}
	<div {...horizontalProps}></div>
{:else}
	<hr {...horizontalProps} />
{/if}

<style>
	:where(.separator) {
		--line-color: rgb(var(--text) / 0.12);
		--line-thickness: 1px;
		--line-style: solid;
		--inset: 0;
	}

	:where(.separator--horizontal) {
		border: 0;
		height: var(--line-thickness);
		width: auto;
		margin: 0;
		margin-inline-start: var(--inset);
		background: transparent;
		border-top: var(--line-thickness) var(--line-style) var(--line-color);
	}

	:where(.separator--vertical) {
		display: inline-block;
		align-self: stretch;
		width: var(--line-thickness);
		min-height: 1em;
		border-inline-start: var(--line-thickness) var(--line-style) var(--line-color);
	}

	:where(.separator--labelled) {
		display: flex;
		align-items: center;
		gap: var(--space-6);
		width: 100%;
		color: rgb(var(--text) / 0.7);
		font-size: var(--fs-md);
		line-height: 1;
	}

	.separator__line {
		flex: 1;
		height: var(--line-thickness);
		border-top: var(--line-thickness) var(--line-style) var(--line-color);
		-webkit-user-select: none;
		user-select: none;
	}

	.separator__label {
		flex-shrink: 0;
		white-space: nowrap;
		-webkit-user-select: none;
		user-select: none;
	}

	.separator[data-placement='start'] .separator__line:first-child {
		flex: 0 0 var(--inset);
	}
	.separator[data-placement='start'] .separator__line:last-child {
		flex: 1;
	}

	.separator[data-placement='end'] .separator__line:first-child {
		flex: 1;
	}
	.separator[data-placement='end'] .separator__line:last-child {
		flex: 0 0 var(--inset);
	}
</style>
