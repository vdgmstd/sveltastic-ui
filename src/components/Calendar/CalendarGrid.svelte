<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { Temporal } from '@js-temporal/polyfill';
	import type { WithElementRef } from '../../types';
	import type { CalendarDayState } from './calendarState.svelte';

	export type CalendarGridProps = WithElementRef<
		{
			/** Per-cell gap in px (drives pill geometry). */
			gap?: number;
			/** Row height in px. */
			cellH?: number;
			/** Selection-pill width in px. */
			pill?: number;
			/** Custom day renderer, forwarded to the grid body. */
			day?: Snippet<[Temporal.PlainDate, CalendarDayState]>;
			children?: Snippet;
			/** Render-delegation snippet (bits-ui `asChild`). */
			child?: Snippet<[{ props: Record<string, unknown> }]>;
			class?: string;
		},
		HTMLDivElement
	>;
</script>

<script lang="ts">
	import { createAttachmentKey } from 'svelte/attachments';
	import { boolAttr } from '../../utils/attrs';
	import { mergeProps } from '../../utils/mergeProps';
	import { attachRef } from '../../utils/ref';
	import { getCalendarCtx } from './context';
	import GridBody from './CalendarGridBody.svelte';

	let {
		gap = 2,
		cellH = 32,
		pill = 28,
		day,
		ref = $bindable(null),
		children,
		child,
		class: className,
		...rest
	}: CalendarGridProps = $props();

	const root = getCalendarCtx();
	const refKey = createAttachmentKey();

	let attrs = $derived({
		role: 'grid',
		'aria-label': root.monthLabel,
		'aria-readonly': root.readonly ? ('true' as const) : undefined,
		'aria-disabled': root.disabled ? ('true' as const) : undefined,
		'data-disabled': boolAttr(root.disabled),
		onkeydown: (e: KeyboardEvent) => root.handleGridKeydown(e, pill)
	});

	let gridStyle = $derived(
		`--cell-h:${cellH}px;--cell-gap:${gap}px;--pill:${pill}px;` +
			`--ep-top:${(cellH - pill) / 2}px;--ep-h:${pill}px;` +
			`--body-top:${(cellH - (pill - 2)) / 2}px;--body-h:${pill - 2}px;` +
			`--cell-r:${Math.round(pill / 4)}px`
	);

	let merged = $derived(
		mergeProps(rest, attrs, {
			class: ['calendar-grid', className],
			style: gridStyle,
			[refKey]: attachRef<HTMLDivElement>((n) => (ref = n))
		})
	);

	$effect(() => {
		root.pillSize = pill;
	});
</script>

{#if child}
	{@render child({ props: merged })}
{:else}
	<div {...merged}>
		{#if children}
			{@render children()}
		{:else}
			<div class="calendar-grid__weekdays" aria-hidden="true">
				{#each root.weekdays as label, i (i)}
					<span class="calendar-grid__weekday">{label}</span>
				{/each}
			</div>
			<GridBody {gap} {cellH} {pill} {day} />
		{/if}
	</div>
{/if}

<style>
	.calendar-grid {
		display: flex;
		flex-direction: column;
		gap: var(--cell-gap, var(--space-1));
		-webkit-user-select: none;
		user-select: none;
	}
	.calendar-grid__weekdays {
		display: grid;
		grid-template-columns: repeat(7, 1fr);
		padding: 0 var(--space-1) var(--space-2);
	}
	.calendar-grid__weekday {
		font-size: var(--cal-weekday-font, var(--fs-xs));
		text-align: center;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		color: rgb(var(--text) / 0.5);
		padding: var(--space-2) 0;
	}
</style>
