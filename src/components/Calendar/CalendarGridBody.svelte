<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { Temporal } from '@js-temporal/polyfill';
	import type { CalendarDayState } from './calendarState.svelte';

	export type CalendarGridBodyProps = {
		/** Per-cell gap in px (drives pill geometry). */
		gap?: number;
		/** Row height in px. */
		cellH?: number;
		/** Selection-pill width in px. */
		pill?: number;
		/** Custom day renderer. */
		day?: Snippet<[Temporal.PlainDate, CalendarDayState]>;
	};
</script>

<script lang="ts">
	import { fade } from 'svelte/transition';
	import { getCalendarCtx } from './context';
	import Day from './CalendarDay.svelte';

	let { gap = 2, cellH = 32, pill = 28, day }: CalendarGridBodyProps = $props();

	const root = getCalendarCtx();

	let rowsEl = $state<HTMLDivElement>();
	let rowsW = $state(0);
	let cellW = $derived(rowsW > 0 ? (rowsW - 6 * gap) / 7 : 0);

	$effect(() => {
		root.setRowsEl(rowsEl ?? null);
	});

	$effect(() => {
		root.setCellWidth(cellW);
	});

	$effect(() => {
		if (!rowsEl) return;
		const ro = new ResizeObserver(() => {
			rowsW = rowsEl!.clientWidth;
		});
		ro.observe(rowsEl);
		return () => ro.disconnect();
	});

	$effect(() => {
		root.syncGeometry(pill, cellH, gap);
	});

	$effect(() => {
		if (!root.focusedDate) return;
		root.focusRovingCell();
	});
</script>

<div role="rowgroup" class="calendar-grid__rows" bind:this={rowsEl}>
	<div class="calendar-grid__layer" aria-hidden="true">
		{#each root.bodySlots as slot, r (r)}
			{#if root.bodyShown[r]}
				<div
					class="calendar-grid__body"
					class:calendar-grid__body--round-l={root.bodyCorners[r].left}
					class:calendar-grid__body--round-r={root.bodyCorners[r].right}
					style:--x="{slot.x.current}px"
					style:--y="{slot.y.current}px"
					style:--w="{slot.w.current}px"
					transition:fade={{ duration: 180 }}
				></div>
			{/if}
		{/each}
		{#if root.primaryShown}
			<div
				class="calendar-grid__ep"
				style:--x="{root.epPrimary.x.current}px"
				style:--y="{root.epPrimary.y.current}px"
				style:--w="{root.epPrimary.w.current}px"
				style:--ips={root.primaryPress.scale}
				style:--c={root.primaryColor}
				in:fade={{ duration: 180 }}
				out:fade={{ duration: 140 }}
			>
				<span
					class="calendar-grid__ep-pulse"
					style:--ps={root.primaryPulseScale.current}
					style:--pop={root.primaryPulseOpacity.current}
					style:--px="{root.primaryPulseX}px"
					style:--py="{root.primaryPulseY}px"
				></span>
			</div>
		{/if}
		{#if root.secondaryShown}
			<div
				class="calendar-grid__ep"
				style:--x="{root.epSecondary.x.current}px"
				style:--y="{root.epSecondary.y.current}px"
				style:--w="{root.epSecondary.w.current}px"
				style:--ips={root.secondaryPress.scale}
				style:--c={root.secondaryColor}
				in:fade={{ duration: 180 }}
				out:fade={{ duration: 140 }}
			>
				<span
					class="calendar-grid__ep-pulse"
					style:--ps={root.secondaryPulseScale.current}
					style:--pop={root.secondaryPulseOpacity.current}
					style:--px="{root.secondaryPulseX}px"
					style:--py="{root.secondaryPulseY}px"
				></span>
			</div>
		{/if}
	</div>
	{#each root.weeks as row, ri (ri)}
		<div role="row" class="calendar-grid__row">
			{#each row as d (d.toString())}
				<Day date={d}>
					{#if day}{@render day(d, root.dayState(d))}{:else}{d.day}{/if}
				</Day>
			{/each}
		</div>
	{/each}
</div>

<style>
	.calendar-grid__rows {
		position: relative;
		display: flex;
		flex-direction: column;
		gap: var(--cell-gap, var(--space-1));
		-webkit-user-select: none;
		user-select: none;
	}
	.calendar-grid__row {
		display: grid;
		grid-template-columns: repeat(7, 1fr);
		gap: var(--cell-gap, var(--space-1));
		justify-items: center;
		align-items: center;
		height: var(--cell-h, 32px);
	}
	.calendar-grid__layer {
		position: absolute;
		inset: 0;
		pointer-events: none;
	}
	.calendar-grid__body {
		position: absolute;
		top: var(--body-top, 3px);
		left: 0;
		width: var(--w);
		height: var(--body-h, 26px);
		transform: translate(var(--x), var(--y));
		background: rgb(var(--c) / 0.16);
		transition: border-radius 220ms var(--ease-soft);
		will-change: transform, width;
	}
	.calendar-grid__body--round-l {
		border-top-left-radius: var(--cell-r, var(--rad-sm));
		border-bottom-left-radius: var(--cell-r, var(--rad-sm));
	}
	.calendar-grid__body--round-r {
		border-top-right-radius: var(--cell-r, var(--rad-sm));
		border-bottom-right-radius: var(--cell-r, var(--rad-sm));
	}
	.calendar-grid__ep {
		position: absolute;
		top: var(--ep-top, 2px);
		left: 0;
		width: var(--w);
		height: var(--ep-h, 28px);
		transform: translate(var(--x), var(--y)) scale(var(--ips, 1));
		transform-origin: center;
		background: rgb(var(--c));
		border-radius: var(--cell-r, var(--rad-sm));
		box-shadow: var(--shadow-accent-sm);
		overflow: hidden;
		will-change: transform;
	}
	.calendar-grid__ep-pulse {
		position: absolute;
		left: var(--px, 14px);
		top: var(--py, 14px);
		width: 80px;
		height: 80px;
		border-radius: var(--rad-circle);
		transform: translate(-50%, -50%) scale(var(--ps, 0));
		background: radial-gradient(circle,
			color-mix(in oklab, rgb(var(--c)), white 52%) 0%,
			color-mix(in oklab, rgb(var(--c)), white 32%) 35%,
			color-mix(in oklab, rgb(var(--c)), white 14%) 70%,
			rgb(var(--c)) 100%);
		opacity: var(--pop, 0);
		pointer-events: none;
		will-change: transform, opacity;
	}
</style>
