<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import { Temporal } from '@js-temporal/polyfill';
	import type { Color } from '../types';
	import type { WeekStart } from '../utils/date';

	export type CalendarMode = 'single' | 'range';

	export type CalendarGridProps = {
		viewMonth: Temporal.PlainDate;
		mode?: CalendarMode;
		value?: Temporal.PlainDate | null;
		from?: Temporal.PlainDate | null;
		to?: Temporal.PlainDate | null;
		preview?: Temporal.PlainDate | null;
		locale: string;
		weekStart?: WeekStart;
		disabled?: boolean;
		min?: Temporal.PlainDate | null;
		max?: Temporal.PlainDate | null;
		disabledDate?: (date: Temporal.PlainDate) => boolean;
		focusedDate?: Temporal.PlainDate | null;
		todayDate?: Temporal.PlainDate | null;
		/** Default cell accent (overrides Calendar.color for the day grid). */
		color?: Color;
		/** Per-day accent override. Returning `undefined` keeps `color`. */
		dayColor?: (date: Temporal.PlainDate) => Color | undefined;
		/** Row height in px — drives selection-pill animation math. */
		cellH?: number;
		/** Selected-day pill / range-endpoint width in px. */
		pill?: number;
		/** Inter-cell gap in px (horizontal and vertical). */
		gap?: number;
		day?: Snippet<[Temporal.PlainDate, DayState]>;
		onselect?: (date: Temporal.PlainDate) => void;
		onpreview?: (date: Temporal.PlainDate | null) => void;
		onfocuschange?: (date: Temporal.PlainDate) => void;
	};

	export type DayState = {
		isCurrentMonth: boolean;
		isToday: boolean;
		isSelected: boolean;
		isRangeStart: boolean;
		isRangeEnd: boolean;
		isInRange: boolean;
		isPreview: boolean;
		isDisabled: boolean;
		isFocused: boolean;
	};
</script>

<script lang="ts">
	import { Tween } from 'svelte/motion';
	import { cubicOut, backOut } from 'svelte/easing';
	import { fade } from 'svelte/transition';
	import {
		isSameDay,
		isSameMonth,
		isInRange,
		monthMatrix,
		weekdayLabels,
		today as todayFn
	} from '../utils/date';
	import { rgbTriplet } from '../utils/color';
	import PickerButton from './PickerButton.svelte';

	let {
		viewMonth,
		mode = 'single',
		value = null,
		from = null,
		to = null,
		preview = null,
		locale,
		weekStart = 1,
		disabled = false,
		min = null,
		max = null,
		disabledDate,
		focusedDate = null,
		todayDate = null,
		color = 'primary',
		dayColor,
		cellH: CELL_H = 32,
		pill: PILL = 28,
		gap: GAP = 2,
		day,
		onselect,
		onpreview,
		onfocuschange
	}: CalendarGridProps = $props();

	let weeks = $derived(monthMatrix(viewMonth, weekStart));
	let labels = $derived(weekdayLabels(locale, weekStart, 'short'));
	let realToday = $derived(todayDate ?? todayFn());

	function isDayDisabled(d: Temporal.PlainDate): boolean {
		if (disabled) return true;
		if (min && Temporal.PlainDate.compare(d, min) < 0) return true;
		if (max && Temporal.PlainDate.compare(d, max) > 0) return true;
		return disabledDate ? disabledDate(d) : false;
	}

	function dayState(d: Temporal.PlainDate): DayState {
		const isCurrentMonth = isSameMonth(d, viewMonth);
		const isToday = isSameDay(d, realToday);
		const isFocused = !!focusedDate && isSameDay(d, focusedDate);
		const isDis = isDayDisabled(d);

		if (mode === 'single') {
			const isSelected = !!value && isSameDay(d, value);
			return {
				isCurrentMonth,
				isToday,
				isSelected,
				isRangeStart: false,
				isRangeEnd: false,
				isInRange: false,
				isPreview: false,
				isDisabled: isDis,
				isFocused
			};
		}

		const start = from;
		const end = to;
		const isRangeStart = !!start && isSameDay(d, start);
		const isRangeEnd = !!end && isSameDay(d, end);
		const inSelected = isInRange(d, start, end);
		const inPreview = !end && !!start && !!preview ? isInRange(d, start, preview) : false;
		const isPreviewEnd = !end && !!preview && isSameDay(d, preview);

		return {
			isCurrentMonth,
			isToday,
			isSelected: isRangeStart || isRangeEnd,
			isRangeStart,
			isRangeEnd: isRangeEnd || (!end && isPreviewEnd),
			isInRange: inSelected || inPreview,
			isPreview: inPreview && !inSelected,
			isDisabled: isDis,
			isFocused
		};
	}

	function pick(d: Temporal.PlainDate, e?: MouseEvent): void {
		if (isDayDisabled(d)) return;
		const completing = mode === 'range' && !!from && !to;

		let px = PILL / 2;
		let py = PILL / 2;
		if (e) {
			const target = e.currentTarget as HTMLElement;
			const r = target.getBoundingClientRect();
			px = e.clientX - r.left;
			py = e.clientY - r.top;
		}

		onselect?.(d);

		if (completing) {
			secondaryPulseX = px;
			secondaryPulseY = py;
			void pulse(secondaryPulseScale, secondaryPulseOpacity);
			void runEpPress('secondary');
		} else {
			primaryPulseX = px;
			primaryPulseY = py;
			void pulse(primaryPulseScale, primaryPulseOpacity);
			void runEpPress('primary');
		}
	}

	let primaryPulseX = $state(14);
	let primaryPulseY = $state(14);
	let secondaryPulseX = $state(14);
	let secondaryPulseY = $state(14);

	const primaryPulseScale = new Tween(0, { duration: 0 });
	const primaryPulseOpacity = new Tween(0, { duration: 0 });
	const secondaryPulseScale = new Tween(0, { duration: 0 });
	const secondaryPulseOpacity = new Tween(0, { duration: 0 });

	const primaryPress = new Tween(1, { duration: 110, easing: cubicOut });
	const secondaryPress = new Tween(1, { duration: 110, easing: cubicOut });
	let primaryPressToken = 0;
	let secondaryPressToken = 0;

	async function runEpPress(target: 'primary' | 'secondary'): Promise<void> {
		const tween = target === 'primary' ? primaryPress : secondaryPress;
		const token = target === 'primary' ? ++primaryPressToken : ++secondaryPressToken;
		tween.set(1, { duration: 0 });
		await tween.set(0.85, { duration: 110, easing: cubicOut });
		const current = target === 'primary' ? primaryPressToken : secondaryPressToken;
		if (token !== current) return;
		await tween.set(1, { duration: 460, easing: backOut });
	}

	async function pulse(scaleT: Tween<number>, opacityT: Tween<number>): Promise<void> {
		scaleT.set(0, { duration: 0 });
		opacityT.set(0, { duration: 0 });
		await Promise.all([
			opacityT.set(0.78, { duration: 160, easing: cubicOut }),
			scaleT.set(1, { duration: 520, easing: cubicOut })
		]);
		await Promise.all([
			opacityT.set(0, { duration: 680, easing: cubicOut }),
			scaleT.set(1.6, { duration: 680, easing: cubicOut })
		]);
	}

	let rowsEl = $state<HTMLDivElement>();
	let rowsW = $state(0);
	let cellW = $derived(rowsW > 0 ? (rowsW - 6 * GAP) / 7 : 0);

	$effect(() => {
		if (!rowsEl) return;
		const ro = new ResizeObserver(() => {
			rowsW = rowsEl!.clientWidth;
		});
		ro.observe(rowsEl);
		return () => ro.disconnect();
	});

	type RowSeg = { row: number; colStart: number; colEnd: number; isStart: boolean; isEnd: boolean };

	function findCellPos(matrix: Temporal.PlainDate[][], date: Temporal.PlainDate | null): { row: number; col: number } | null {
		if (!date) return null;
		for (let r = 0; r < matrix.length; r += 1) {
			for (let c = 0; c < 7; c += 1) {
				if (isSameDay(matrix[r][c], date)) return { row: r, col: c };
			}
		}
		return null;
	}

	function computeBodyRows(matrix: Temporal.PlainDate[][], a: Temporal.PlainDate, b: Temporal.PlainDate): RowSeg[] {
		let s = a;
		let e = b;
		if (Temporal.PlainDate.compare(s, e) > 0) [s, e] = [e, s];
		const out: RowSeg[] = [];
		for (let r = 0; r < matrix.length; r += 1) {
			const week = matrix[r];
			const wStart = week[0];
			const wEnd = week[6];
			if (Temporal.PlainDate.compare(e, wStart) < 0) continue;
			if (Temporal.PlainDate.compare(s, wEnd) > 0) continue;
			let colStart = 0;
			for (let c = 0; c < 7; c += 1) {
				if (Temporal.PlainDate.compare(week[c], s) >= 0) { colStart = c; break; }
			}
			let colEnd = 6;
			for (let c = 6; c >= 0; c -= 1) {
				if (Temporal.PlainDate.compare(week[c], e) <= 0) { colEnd = c; break; }
			}
			out.push({
				row: r,
				colStart, colEnd,
				isStart: isSameDay(week[colStart], s),
				isEnd: isSameDay(week[colEnd], e)
			});
		}
		return out;
	}

	let effEnd = $derived<Temporal.PlainDate | null>(mode === 'range' ? (to ?? preview ?? null) : null);

	let primaryDate = $derived<Temporal.PlainDate | null>(
		mode === 'single' ? (value ?? null) : (mode === 'range' ? (from ?? null) : null)
	);
	let secondaryDate = $derived<Temporal.PlainDate | null>(
		mode === 'range' && from && effEnd && !isSameDay(from, effEnd) ? effEnd : null
	);

	let primaryPos = $derived(findCellPos(weeks, primaryDate));
	let secondaryPos = $derived(findCellPos(weeks, secondaryDate));
	let bodyRows = $derived<RowSeg[]>(
		mode === 'range' && from && effEnd && !isSameDay(from, effEnd)
			? computeBodyRows(weeks, from, effEnd)
			: []
	);

	let primaryColor = $derived(primaryDate ? rgbTriplet(dayColor?.(primaryDate) ?? color) : null);
	let secondaryColor = $derived(secondaryDate ? rgbTriplet(dayColor?.(secondaryDate) ?? color) : null);

	let bodyCorners = $derived.by(() => {
		const out: { left: boolean; right: boolean }[] = Array.from({ length: 6 }, () => ({ left: false, right: false }));
		for (const br of bodyRows) {
			out[br.row] = { left: br.isStart, right: br.isEnd };
		}
		return out;
	});

	class TweenedRect {
		x = new Tween(0, { duration: 280, easing: cubicOut });
		y = new Tween(0, { duration: 280, easing: cubicOut });
		w = new Tween(0, { duration: 280, easing: cubicOut });
		primed = false;

		set(x: number, y: number, w: number): void {
			if (this.primed) {
				this.x.target = x;
				this.y.target = y;
				this.w.target = w;
			} else {
				this.x.set(x, { duration: 0 });
				this.y.set(y, { duration: 0 });
				this.w.set(w, { duration: 0 });
				this.primed = true;
			}
		}
		unprime(): void { this.primed = false; }
	}

	const epPrimary = new TweenedRect();
	const epSecondary = new TweenedRect();
	const bodySlots = Array.from({ length: 6 }, () => new TweenedRect());

	let primaryShown = $state(false);
	let secondaryShown = $state(false);
	let bodyShown = $state<boolean[]>(Array(6).fill(false));

	$effect(() => {
		if (!cellW) return;
		const offset = (cellW - PILL) / 2;
		const pp = primaryPos;
		const sp = secondaryPos;
		const brs = bodyRows;

		if (pp) {
			epPrimary.set(pp.col * (cellW + GAP) + offset, pp.row * (CELL_H + GAP), PILL);
			primaryShown = true;
		} else {
			primaryShown = false;
			epPrimary.unprime();
		}

		if (sp) {
			epSecondary.set(sp.col * (cellW + GAP) + offset, sp.row * (CELL_H + GAP), PILL);
			secondaryShown = true;
		} else {
			secondaryShown = false;
			epSecondary.unprime();
		}

		const next = Array(6).fill(false) as boolean[];
		const byRow = new Map<number, RowSeg>();
		for (const br of brs) byRow.set(br.row, br);
		for (let r = 0; r < 6; r += 1) {
			const br = byRow.get(r);
			if (br) {
				const span = br.colEnd - br.colStart;
				bodySlots[r].set(
					br.colStart * (cellW + GAP) + offset,
					br.row * (CELL_H + GAP),
					span * (cellW + GAP) + PILL
				);
				next[r] = true;
			} else {
				bodySlots[r].unprime();
			}
		}
		bodyShown = next;
	});

	function handleKeydown(e: KeyboardEvent): void {
		if (disabled) return;
		const cursor = focusedDate ?? value ?? to ?? from ?? viewMonth;
		let next: Temporal.PlainDate | null = null;
		switch (e.key) {
			case 'ArrowLeft':  next = cursor.subtract({ days: 1 }); break;
			case 'ArrowRight': next = cursor.add({ days: 1 }); break;
			case 'ArrowUp':    next = cursor.subtract({ days: 7 }); break;
			case 'ArrowDown':  next = cursor.add({ days: 7 }); break;
			case 'PageUp':     next = cursor.subtract(e.shiftKey ? { years: 1 } : { months: 1 }); break;
			case 'PageDown':   next = cursor.add(e.shiftKey ? { years: 1 } : { months: 1 }); break;
			case 'Home':       next = cursor.subtract({ days: (cursor.dayOfWeek - weekStart + 7) % 7 }); break;
			case 'End':        next = cursor.add({ days: 6 - ((cursor.dayOfWeek - weekStart + 7) % 7) }); break;
			case 'Enter':
			case ' ':          if (cursor) { e.preventDefault(); pick(cursor); } return;
			default: return;
		}
		if (!next) return;
		e.preventDefault();
		onfocuschange?.(next);
	}
</script>

<div
	class="calendar-grid"
	aria-disabled={disabled}
	style:--cell-h="{CELL_H}px"
	style:--cell-gap="{GAP}px"
	style:--pill="{PILL}px"
	style:--ep-top="{(CELL_H - PILL) / 2}px"
	style:--ep-h="{PILL}px"
	style:--body-top="{(CELL_H - (PILL - 2)) / 2}px"
	style:--body-h="{PILL - 2}px"
	style:--cell-r="{Math.round(PILL / 4)}px"
>
	<div class="calendar-grid__weekdays" aria-hidden="true">
		{#each labels as label, i (i)}
			<span class="calendar-grid__weekday">{label}</span>
		{/each}
	</div>
	<div role="grid" tabindex={-1} class="calendar-grid__rows" bind:this={rowsEl} onkeydown={handleKeydown}>
		<div class="calendar-grid__layer" aria-hidden="true">
			{#each bodySlots as slot, r (r)}
				{#if bodyShown[r]}
					<div
						class="calendar-grid__body"
						class:calendar-grid__body--round-l={bodyCorners[r].left}
						class:calendar-grid__body--round-r={bodyCorners[r].right}
						style:--x="{slot.x.current}px"
						style:--y="{slot.y.current}px"
						style:--w="{slot.w.current}px"
						transition:fade={{ duration: 180 }}
					></div>
				{/if}
			{/each}
			{#if primaryShown}
				<div
					class="calendar-grid__ep"
					style:--x="{epPrimary.x.current}px"
					style:--y="{epPrimary.y.current}px"
					style:--w="{epPrimary.w.current}px"
					style:--ips={primaryPress.current}
					style:--c={primaryColor}
					in:fade={{ duration: 180 }}
					out:fade={{ duration: 140 }}
				>
					<span
						class="calendar-grid__ep-pulse"
						style:--ps={primaryPulseScale.current}
						style:--pop={primaryPulseOpacity.current}
						style:--px="{primaryPulseX}px"
						style:--py="{primaryPulseY}px"
					></span>
				</div>
			{/if}
			{#if secondaryShown}
				<div
					class="calendar-grid__ep"
					style:--x="{epSecondary.x.current}px"
					style:--y="{epSecondary.y.current}px"
					style:--w="{epSecondary.w.current}px"
					style:--ips={secondaryPress.current}
					style:--c={secondaryColor}
					in:fade={{ duration: 180 }}
					out:fade={{ duration: 140 }}
				>
					<span
						class="calendar-grid__ep-pulse"
						style:--ps={secondaryPulseScale.current}
						style:--pop={secondaryPulseOpacity.current}
						style:--px="{secondaryPulseX}px"
						style:--py="{secondaryPulseY}px"
					></span>
				</div>
			{/if}
		</div>
		{#each weeks as row, ri (ri)}
			<div role="row" class="calendar-grid__row">
				{#each row as d (d.toString())}
					{@const s = dayState(d)}
					{@const hasRangeBody = mode === 'range' && !!from && (!!to || !!preview)}
					<PickerButton
						variant="cell"
						color={dayColor?.(d) ?? color}
						role="gridcell"
						selected={(mode === 'single' && s.isSelected) || (mode === 'range' && !hasRangeBody && s.isRangeStart)}
						current={s.isToday}
						inRange={s.isInRange && !s.isRangeStart && !s.isRangeEnd}
						rangeStart={s.isRangeStart && hasRangeBody}
						rangeEnd={s.isRangeEnd && hasRangeBody}
						preview={s.isPreview}
						muted={!s.isCurrentMonth}
						disabled={s.isDisabled}
						focused={s.isFocused}
						ariaSelected={s.isSelected}
						ariaCurrent={s.isToday ? 'date' : undefined}
						ariaDisabled={s.isDisabled}
						onclick={(e) => pick(d, e)}
						onpointerenter={() => onpreview?.(d)}
						onfocus={() => onpreview?.(d)}
					>
						{#if day}{@render day(d, s)}{:else}{d.day}{/if}
					</PickerButton>
				{/each}
			</div>
		{/each}
	</div>
</div>

<style>
	.calendar-grid { display: flex; flex-direction: column; gap: var(--cell-gap, 2px); }
	.calendar-grid__weekdays {
		display: grid;
		grid-template-columns: repeat(7, 1fr);
		padding: 0 2px 4px;
	}
	.calendar-grid__weekday {
		font-size: var(--cal-weekday-font, 0.66rem);
		text-align: center;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		color: rgb(var(--text) / 0.5);
		padding: 4px 0;
	}
	.calendar-grid__rows {
		position: relative;
		display: flex;
		flex-direction: column;
		gap: var(--cell-gap, 2px);
	}
	.calendar-grid__row {
		display: grid;
		grid-template-columns: repeat(7, 1fr);
		gap: var(--cell-gap, 2px);
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
		transition: border-radius 220ms cubic-bezier(0.215, 0.61, 0.355, 1);
		will-change: transform, width;
	}
	.calendar-grid__body--round-l {
		border-top-left-radius: var(--cell-r, 7px);
		border-bottom-left-radius: var(--cell-r, 7px);
	}
	.calendar-grid__body--round-r {
		border-top-right-radius: var(--cell-r, 7px);
		border-bottom-right-radius: var(--cell-r, 7px);
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
		border-radius: var(--cell-r, 7px);
		box-shadow: 0 6px 18px -6px rgb(var(--c) / 0.55);
		overflow: hidden;
		will-change: transform;
	}
	.calendar-grid__ep-pulse {
		position: absolute;
		left: var(--px, 14px);
		top: var(--py, 14px);
		width: 80px;
		height: 80px;
		border-radius: 50%;
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
