<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import type { Color } from '../../types';

	export type DividerOrientation = 'horizontal' | 'vertical';
	export type DividerVariant = 'solid' | 'dashed' | 'dotted';
	export type DividerLabelPlacement = 'start' | 'center' | 'end';

	export type DividerProps = {
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
		/** Optional label snippet. Renders the divider with a centred / inline cap. */
		children?: Snippet;
	} & Omit<HTMLAttributes<HTMLDivElement>, 'children'>;
</script>

<script lang="ts">
	import { rgbTriplet } from '../../utils/color';
	import { cn } from '../../utils/cn';

	let {
		orientation = 'horizontal',
		variant = 'solid',
		thickness = 1,
		color,
		inset = false,
		labelPlacement = 'center',
		children,
		class: className,
		style: userStyle,
		...rest
	}: DividerProps = $props();

	let triplet = $derived(color ? rgbTriplet(color) : null);
	let lineColor = $derived(triplet ? `rgb(${triplet})` : 'rgb(var(--text) / 0.12)');
	let lineThickness = $derived(typeof thickness === 'number' ? `${thickness}px` : thickness);
	let insetValue = $derived(inset === true ? '1.5rem' : inset || '0');
	let hasLabel = $derived(!!children);
</script>

{#if orientation === 'vertical'}
	<div
		class={cn('divider', 'divider--vertical', className)}
		role="separator"
		aria-orientation="vertical"
		style:--line-color={lineColor}
		style:--line-thickness={lineThickness}
		style:--line-style={variant}
		style={userStyle}
		data-testid="divider"
		{...rest}
	></div>
{:else if hasLabel}
	<div
		class={cn(
			'divider',
			'divider--labelled',
			labelPlacement === 'start' && 'divider--start',
			labelPlacement === 'end' && 'divider--end',
			className
		)}
		role="separator"
		aria-orientation="horizontal"
		style:--line-color={lineColor}
		style:--line-thickness={lineThickness}
		style:--line-style={variant}
		style:--inset={insetValue}
		style={userStyle}
		data-testid="divider"
		{...rest}
	>
		<span class="divider__line"></span>
		<span class="divider__label">{@render children?.()}</span>
		<span class="divider__line"></span>
	</div>
{:else}
	<hr
		class={cn('divider', 'divider--horizontal', className)}
		style:--line-color={lineColor}
		style:--line-thickness={lineThickness}
		style:--line-style={variant}
		style:--inset={insetValue}
		style={userStyle}
		data-testid="divider"
	/>
{/if}

<style>
	:where(.divider) {
		--line-color: rgb(var(--text) / 0.12);
		--line-thickness: 1px;
		--line-style: solid;
		--inset: 0;
	}

	:where(.divider--horizontal) {
		border: 0;
		height: var(--line-thickness);
		width: auto;
		margin: 0;
		margin-inline-start: var(--inset);
		background: transparent;
		border-top: var(--line-thickness) var(--line-style) var(--line-color);
	}

	:where(.divider--vertical) {
		display: inline-block;
		align-self: stretch;
		width: var(--line-thickness);
		min-height: 1em;
		border-inline-start: var(--line-thickness) var(--line-style) var(--line-color);
	}

	:where(.divider--labelled) {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		width: 100%;
		color: rgb(var(--text) / 0.7);
		font-size: 0.8125rem;
		line-height: 1;
	}

	.divider__line {
		flex: 1;
		height: var(--line-thickness);
		border-top: var(--line-thickness) var(--line-style) var(--line-color);
	}

	.divider__label {
		flex-shrink: 0;
		white-space: nowrap;
	}

	.divider--start .divider__line:first-child {
		flex: 0 0 var(--inset, 1.5rem);
	}
	.divider--start .divider__line:last-child {
		flex: 1;
	}

	.divider--end .divider__line:first-child {
		flex: 1;
	}
	.divider--end .divider__line:last-child {
		flex: 0 0 var(--inset, 1.5rem);
	}
</style>
