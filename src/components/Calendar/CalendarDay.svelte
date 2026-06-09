<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { Color } from '../../types';
	import type { WithElementRef } from '../../types';

	export type CalendarDayProps = WithElementRef<
		{
			/** The day this button represents — drives every `data-*` state from root state. */
			date: Temporal.PlainDate;
			/** Per-day accent override. Falls back to the root `color`. */
			color?: Color;
			children?: Snippet;
			/** Render-delegation snippet (bits-ui `asChild`). */
			child?: Snippet<[{ props: Record<string, unknown> }]>;
			class?: string;
		},
		HTMLButtonElement
	>;
</script>

<script lang="ts">
	import type { Temporal } from '@js-temporal/polyfill';
	import { createAttachmentKey } from 'svelte/attachments';
	import { ripple } from '../../actions/ripple.svelte';
	import { rgbTriplet } from '../../utils/color';
	import { boolAttr } from '../../utils/attrs';
	import { mergeProps } from '../../utils/mergeProps';
	import { attachRef } from '../../utils/ref';
	import { isSameDay } from '../../utils/date';
	import { getCalendarCtx } from './context';

	let {
		date,
		color,
		ref = $bindable(null),
		children,
		child,
		class: className,
		...rest
	}: CalendarDayProps = $props();

	const root = getCalendarCtx();
	const refKey = createAttachmentKey();

	let accent = $derived(color ?? root.dayColor?.(date) ?? root.color);
	let triplet = $derived(rgbTriplet(accent));

	let s = $derived(root.dayState(date));
	let hasRangeBody = $derived(root.hasRangeBody);

	let selected = $derived(
		(root.type === 'single' && s.isSelected) ||
			(root.type === 'range' && !hasRangeBody && s.isRangeStart)
	);
	let inRange = $derived(s.isInRange && !s.isRangeStart && !s.isRangeEnd);
	let rangeStart = $derived(s.isRangeStart && hasRangeBody);
	let rangeEnd = $derived(s.isRangeEnd && hasRangeBody);
	let isRoving = $derived(isSameDay(date, root.rovingDate));

	function handleClick(e: MouseEvent): void {
		root.pick(date, root.pillSize, e);
	}

	let attrs = $derived({
		type: 'button',
		role: 'gridcell',
		'data-selected': boolAttr(selected),
		'data-current': boolAttr(s.isToday),
		'data-in-range': boolAttr(inRange),
		'data-range-start': boolAttr(rangeStart),
		'data-range-end': boolAttr(rangeEnd),
		'data-preview': boolAttr(s.isPreview),
		'data-muted': boolAttr(!s.isCurrentMonth),
		'data-disabled': boolAttr(s.isDisabled),
		'data-value': date.toString(),
		disabled: s.isDisabled,
		tabindex: isRoving ? 0 : -1,
		'aria-selected': s.isSelected,
		'aria-current': s.isToday ? ('date' as const) : undefined,
		'aria-disabled': s.isDisabled,
		onclick: handleClick,
		onpointerenter: () => root.previewDay(date),
		onfocus: () => root.previewDay(date)
	});

	let dayStyle = $derived(`--c:${triplet};--ps:1`);

	let merged = $derived(
		mergeProps(rest, attrs, {
			class: ['picker-btn', 'picker-btn--cell', className],
			style: dayStyle,
			[refKey]: attachRef<HTMLButtonElement>((n) => (ref = n))
		})
	);
</script>

{#if child}
	{@render child({ props: merged })}
{:else}
	<button
		{...merged}
		use:ripple={{ disabled: s.isDisabled, soft: true, textColor: 'currentColor', color: accent, radius: 'var(--pb-cell-r, var(--rad-sm))' }}
	>
		<span class="picker-btn__label">
			{#if children}{@render children()}{:else}{date.day}{/if}
		</span>
	</button>
{/if}

<style>
	.picker-btn {
		--h: 32px;
		--w: auto;
		--r: var(--rad-sm);
		--c-text: rgb(var(--c));
		position: relative;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: var(--space-2);
		width: var(--w);
		height: var(--h);
		min-width: var(--h);
		padding: 0 var(--space-4);
		border: 0;
		background: transparent;
		color: inherit;
		font: inherit;
		font-size: var(--pb-font, var(--fs-sm));
		font-weight: 400;
		line-height: var(--line-height);
		border-radius: var(--r);
		cursor: pointer;
		-webkit-user-select: none;
		user-select: none;
		transform: scale(var(--ps, 1));
		transform-origin: center;
		transition:
			background-color 320ms var(--ease-soft),
			box-shadow 320ms var(--ease-soft);
	}

	.picker-btn__label {
		position: relative;
		z-index: 1001;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: inherit;
		pointer-events: none;
	}

	.picker-btn--cell {
		--h: var(--pb-cell-h, 28px);
		--w: var(--pb-cell-h, 28px);
		--r: var(--pb-cell-r, var(--rad-sm));
		padding: 0;
		font-size: var(--pb-cell-font, var(--fs-sm));
	}

	.picker-btn:hover:not([data-disabled]):not([data-selected]):not([data-range-start]):not([data-range-end]) {
		background: rgb(var(--c) / 0.12);
		color: var(--c-text);
	}

	.picker-btn[data-muted] { color: rgb(var(--text) / 0.32); }

	.picker-btn[data-current] {
		box-shadow: inset 0 0 0 1px rgb(var(--c));
		color: var(--c-text);
	}

	.picker-btn--cell[data-in-range],
	.picker-btn--cell[data-preview] {
		color: var(--c-text);
	}

	.picker-btn--cell[data-selected],
	.picker-btn--cell[data-range-start],
	.picker-btn--cell[data-range-end] {
		color: rgb(255 255 255);
	}

	.picker-btn[data-disabled] {
		opacity: 0.35;
		cursor: not-allowed;
	}

	.picker-btn:focus-visible {
		outline: 2px solid rgb(var(--c) / 0.6);
		outline-offset: -2px;
	}
</style>
