<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { Color, Size } from '../../types';
	import type { DateRange } from '../../types';
	import type { DateLike, WeekStart } from '../../utils/date';
	import type { CalendarMode, DayState } from '../../primitives/CalendarGrid.svelte';
	import type { Temporal } from '@js-temporal/polyfill';

	/** Calendar's chrome accent — limited to two semantic tones. Per-day colors go through `dayColor`. */
	export type CalendarColor = 'primary' | 'warning';

	export type CalendarProps = {
		/** Selected day (`YYYY-MM-DD`) in `single` mode. */
		value?: string;
		/** Selected range in `range` mode. */
		range?: DateRange;
		/** Selection mode. */
		mode?: CalendarMode;
		/** Locale for weekday / month labels. Defaults to `'en-US'`. */
		locale?: string;
		/** First day of the week. Defaults to the locale's convention. */
		weekStart?: WeekStart;
		/** Lower bound (inclusive). */
		min?: DateLike;
		/** Upper bound (inclusive). */
		max?: DateLike;
		/** Predicate to disable individual days. */
		disabledDate?: (date: Temporal.PlainDate) => boolean;
		/** Disable the entire calendar. */
		disabled?: boolean;
		/** Visual size — matches the kit's `Size` scale. */
		size?: Size;
		/** Drop the calendar's own background, padding, and border-radius — useful when embedded in a surface that already provides chrome (Dialog, Menu, Card). */
		bare?: boolean;
		/** Visual variant. `'transparent'` drops the background only (padding and radius are kept) so the calendar inherits the surface it is placed on. */
		variant?: 'default' | 'transparent';
		/** Calendar chrome accent. Use `dayColor` for per-day overrides. */
		color?: CalendarColor;
		/** Per-day color override. Returning `undefined` keeps the calendar's `color`. */
		dayColor?: (date: Temporal.PlainDate) => Color | undefined;
		/** Show "Today" / "Clear" footer. */
		showFooter?: boolean;
		/** Custom day renderer. */
		day?: Snippet<[Temporal.PlainDate, DayState]>;
		/** Fires when a day is picked. Payload is the ISO string for `single`, `DateRange` for `range`. */
		onchange?: (value: string | DateRange) => void;
		/** Class merged onto the root. */
		class?: string;
		/** Inline style merged onto the root. */
		style?: string;
	};

	type CalendarSizeKey = 'xl' | 'large' | 'medium' | 'small' | 'mini';

	type CalendarMetrics = {
		cellH: number;
		pill: number;
		gap: number;
		iconPx: number;
		caretPx: number;
	};

	const SIZE_METRICS: Record<CalendarSizeKey, CalendarMetrics> = {
		xl:     { cellH: 40, pill: 36, gap: 3, iconPx: 18, caretPx: 13 },
		large:  { cellH: 36, pill: 32, gap: 2, iconPx: 16, caretPx: 12 },
		medium: { cellH: 32, pill: 28, gap: 2, iconPx: 14, caretPx: 11 },
		small:  { cellH: 28, pill: 24, gap: 2, iconPx: 12, caretPx: 10 },
		mini:   { cellH: 24, pill: 20, gap: 2, iconPx: 10, caretPx: 9 }
	};

	function resolveMetrics(s: Size | undefined): CalendarMetrics & { key: CalendarSizeKey } {
		const key = (s && Object.prototype.hasOwnProperty.call(SIZE_METRICS, s)
			? (s as CalendarSizeKey)
			: 'medium');
		return { ...SIZE_METRICS[key], key };
	}
</script>

<script lang="ts">
	import { untrack } from 'svelte';
	import { Tween } from 'svelte/motion';
	import { cubicOut } from 'svelte/easing';
	import { fade, scale } from 'svelte/transition';
	import {
		toPlainDate,
		plainDateToISO,
		resolveLocale,
		localeWeekStart,
		orderRange,
		today as todayFn
	} from '../../utils/date';
	import { rgbTriplet } from '../../utils/color';
	import { cn } from '../../utils/cn';
	import CalendarGrid from '../../primitives/CalendarGrid.svelte';
	import CalendarHeader from '../../primitives/CalendarHeader.svelte';
	import OptionGrid from '../../primitives/OptionGrid.svelte';
	import type { OptionItem } from '../../primitives/OptionGrid.svelte';

	let {
		value = $bindable(),
		range = $bindable(),
		mode = 'single',
		locale,
		weekStart,
		min,
		max,
		disabledDate,
		disabled = false,
		size = 'medium',
		bare = false,
		variant = 'default',
		color = 'primary',
		dayColor,
		showFooter = false,
		day,
		onchange,
		class: className,
		style: userStyle
	}: CalendarProps = $props();

	let metrics = $derived(resolveMetrics(size));

	let resolvedLocale = $derived(resolveLocale(locale));
	let resolvedWeekStart = $derived<WeekStart>(weekStart ?? localeWeekStart(resolvedLocale));
	let triplet = $derived(rgbTriplet(color));

	let minDate = $derived(toPlainDate(min));
	let maxDate = $derived(toPlainDate(max));

	let selectedDate = $derived(toPlainDate(value));
	let rangeFrom = $derived(toPlainDate(range?.from));
	let rangeTo = $derived(toPlainDate(range?.to));

	let viewMonth = $state<Temporal.PlainDate>(
		toPlainDate(value) ?? toPlainDate(range?.from) ?? todayFn()
	);
	let preview = $state<Temporal.PlainDate | null>(null);
	let focusedDate = $state<Temporal.PlainDate | null>(null);
	let view = $state<'days' | 'months' | 'years'>('days');
	let monthDirection = $state<1 | -1>(1);
	const YEARS_PER_PAGE = 12;
	let yearPageStart = $state<number>(untrack(() => viewMonth.year - ((viewMonth.year - 1) % YEARS_PER_PAGE)));

	$effect(() => {
		if (mode === 'single' && selectedDate) viewMonth = selectedDate;
	});

	function shiftMonth(delta: number): void {
		monthDirection = delta > 0 ? 1 : -1;
		viewMonth = viewMonth.add({ months: delta });
	}

	function shiftYear(delta: number): void {
		monthDirection = delta > 0 ? 1 : -1;
		viewMonth = viewMonth.add({ years: delta });
	}

	function shiftYearPage(delta: number): void {
		monthDirection = delta > 0 ? 1 : -1;
		yearPageStart += delta * YEARS_PER_PAGE;
	}

	function goToday(): void {
		viewMonth = todayFn();
		view = 'days';
	}

	function openMonths(): void {
		view = 'months';
	}

	function openYears(): void {
		yearPageStart = viewMonth.year - ((viewMonth.year - 1) % YEARS_PER_PAGE);
		view = 'years';
	}

	function pickMonth(month: number): void {
		viewMonth = viewMonth.with({ month });
		view = 'days';
	}

	function pickYear(year: number): void {
		viewMonth = viewMonth.with({ year });
		view = 'months';
	}

	let monthItems = $derived.by<OptionItem[]>(() => {
		const fmt = new Intl.DateTimeFormat(resolvedLocale, { month: 'short' });
		const todayP = todayFn();
		const items: OptionItem[] = [];
		for (let m = 1; m <= 12; m += 1) {
			const stub = new Date(viewMonth.year, m - 1, 1);
			items.push({
				key: m,
				label: fmt.format(stub),
				selected: m === viewMonth.month,
				current: m === todayP.month && viewMonth.year === todayP.year
			});
		}
		return items;
	});

	let yearItems = $derived.by<OptionItem[]>(() => {
		const todayP = todayFn();
		const items: OptionItem[] = [];
		for (let i = 0; i < YEARS_PER_PAGE; i += 1) {
			const y = yearPageStart + i;
			items.push({
				key: y,
				label: String(y),
				selected: y === viewMonth.year,
				current: y === todayP.year
			});
		}
		return items;
	});

	let monthLabel = $derived(
		new Intl.DateTimeFormat(resolvedLocale, { month: 'long' }).format(
			new Date(viewMonth.year, viewMonth.month - 1, 1)
		)
	);

	let leftTitle = $derived.by<string | undefined>(() => {
		if (view === 'days') return monthLabel;
		if (view === 'months') return undefined;
		return undefined;
	});

	let rightTitle = $derived.by<string | undefined>(() => {
		if (view === 'days') return String(viewMonth.year);
		if (view === 'months') return String(viewMonth.year);
		return `${yearPageStart} – ${yearPageStart + YEARS_PER_PAGE - 1}`;
	});

	function handlePrev(): void {
		if (view === 'days') shiftMonth(-1);
		else if (view === 'months') shiftYear(-1);
		else shiftYearPage(-1);
	}

	function handleNext(): void {
		if (view === 'days') shiftMonth(1);
		else if (view === 'months') shiftYear(1);
		else shiftYearPage(1);
	}

	function handleLeft(): void {
		if (view === 'days') openMonths();
	}

	function handleRight(): void {
		if (view === 'days' || view === 'months') openYears();
	}

	function clearValue(): void {
		if (mode === 'single') {
			value = '';
			onchange?.('');
		} else {
			range = {};
			onchange?.({});
		}
	}

	function pick(d: Temporal.PlainDate): void {
		if (mode === 'single') {
			value = plainDateToISO(d);
			onchange?.(value);
			return;
		}
		if (!rangeFrom || (rangeFrom && rangeTo)) {
			range = { from: plainDateToISO(d) };
			preview = null;
			onchange?.(range);
			return;
		}
		const ordered = orderRange(rangeFrom, d);
		range = { from: plainDateToISO(ordered.from), to: plainDateToISO(ordered.to) };
		preview = null;
		onchange?.(range);
	}

	function handleFocusChange(d: Temporal.PlainDate): void {
		focusedDate = d;
		if (d.year !== viewMonth.year || d.month !== viewMonth.month) viewMonth = d;
		if (mode === 'range' && rangeFrom && !rangeTo) preview = d;
	}

	let bodyEl = $state<HTMLDivElement | null>(null);
	const bodyHeight = new Tween(0, { duration: 280, easing: cubicOut });
	let measured = $state(false);

	function slideIn(_node: HTMLElement, dir: 1 | -1) {
		return {
			duration: 220,
			easing: cubicOut,
			css: (t: number) => `transform: translateX(${(1 - t) * dir * 100}%); opacity: ${t};`
		};
	}
	function slideOut(_node: HTMLElement, dir: 1 | -1) {
		return {
			duration: 180,
			easing: cubicOut,
			css: (t: number) => `transform: translateX(${(1 - t) * -dir * 100}%); opacity: ${t};`
		};
	}

	$effect(() => {
		if (!bodyEl) return;
		const ro = new ResizeObserver((entries) => {
			const next = entries[0]?.contentRect.height ?? 0;
			if (!measured) {
				bodyHeight.set(next, { duration: 0 });
				measured = true;
			} else {
				bodyHeight.target = next;
			}
		});
		ro.observe(bodyEl);
		return () => ro.disconnect();
	});
</script>

<div
	class={cn(
		'calendar',
		`calendar--size-${metrics.key}`,
		`calendar--variant-${variant}`,
		bare && 'calendar--bare',
		disabled && 'calendar--disabled',
		className
	)}
	style:--c={triplet}
	style={userStyle}
	role="group"
	aria-label="Calendar"
	data-testid="calendar"
>
	<CalendarHeader
		{leftTitle}
		{rightTitle}
		{disabled}
		{color}
		iconPx={metrics.iconPx}
		caretPx={metrics.caretPx}
		onprev={handlePrev}
		onnext={handleNext}
		onleft={handleLeft}
		onright={handleRight}
	/>
	<div
		class="calendar__viewport"
		style:height={measured ? `${bodyHeight.current}px` : 'auto'}
	>
		{#key view}
			<div
				class="calendar__view"
				bind:this={bodyEl}
				in:scale={{ duration: 200, start: 0.96, opacity: 0 }}
				out:fade={{ duration: 120 }}
			>
				{#if view === 'days'}
					{#key `${viewMonth.year}-${viewMonth.month}`}
						<div
							class="calendar__slide"
							in:slideIn={monthDirection}
							out:slideOut={monthDirection}
						>
							<CalendarGrid
								{viewMonth}
								{mode}
								value={mode === 'single' ? selectedDate : null}
								from={mode === 'range' ? rangeFrom : null}
								to={mode === 'range' ? rangeTo : null}
								{preview}
								locale={resolvedLocale}
								weekStart={resolvedWeekStart}
								{disabled}
								min={minDate}
								max={maxDate}
								{disabledDate}
								focusedDate={focusedDate}
								{color}
								{dayColor}
								cellH={metrics.cellH}
								pill={metrics.pill}
								gap={metrics.gap}
								{day}
								onselect={pick}
								onpreview={(d) => {
									if (mode === 'range' && rangeFrom && !rangeTo) preview = d;
								}}
								onfocuschange={handleFocusChange}
							/>
						</div>
					{/key}
				{:else if view === 'months'}
					{#key viewMonth.year}
						<div
							class="calendar__slide"
							in:slideIn={monthDirection}
							out:slideOut={monthDirection}
						>
							<OptionGrid items={monthItems} {disabled} {color} columns={3} onselect={pickMonth} />
						</div>
					{/key}
				{:else}
					{#key yearPageStart}
						<div
							class="calendar__slide"
							in:slideIn={monthDirection}
							out:slideOut={monthDirection}
						>
							<OptionGrid items={yearItems} {disabled} {color} columns={3} onselect={pickYear} />
						</div>
					{/key}
				{/if}
			</div>
		{/key}
	</div>
	{#if showFooter}
		<div class="calendar__footer">
			<button type="button" class="calendar__action" onclick={goToday}>Today</button>
			<button type="button" class="calendar__action" onclick={clearValue}>Clear</button>
		</div>
	{/if}
</div>

<style>
	:where(.calendar) {
		/* size — overridable per modifier below */
		--cal-w: 280px;
		--cal-pad: 12px;
		--cal-radius: 20px;
		--cal-root-gap: 4px;
		--cal-header-pad-b: 8px;
		--cal-static-font: 0.85rem;
		--cal-weekday-font: 0.66rem;
		--cal-option-gap: 6px;
		--cal-action-font: 0.78rem;
		--cal-action-pad-y: 6px;
		--cal-action-pad-x: 10px;
		--cal-action-radius: 8px;
		--cal-footer-margin: 8px;
		--cal-focus-ring: 2px;
		/* PickerButton vars (cascaded into primitives) */
		--pb-cell-h: 28px;
		--pb-cell-r: 7px;
		--pb-cell-font: 0.78rem;
		--pb-option-h: 36px;
		--pb-option-font: 0.8rem;
		--pb-option-pad-x: 6px;
		--pb-icon-h: 28px;
		--pb-icon-r: 8px;
		--pb-chip-h: 28px;
		--pb-chip-pad-x: 8px;
		--pb-chip-font: 0.78rem;

		--c: var(--primary);
		/* medium baseline — JS metrics for medium are { cellH: 32, pill: 28, gap: 2 }; keep CSS in sync. */
		--pb-cell-h: 32px;
		--pb-cell-r: 8px;
		--pb-cell-font: 0.82rem;
		display: inline-flex;
		flex-direction: column;
		width: var(--cal-w);
		gap: var(--cal-root-gap);
		padding: var(--cal-pad);
		background: rgb(var(--gray-1));
		border-radius: var(--cal-radius);
		color: rgb(var(--text));
		outline: none;
	}
	.calendar:focus-visible {
		box-shadow: 0 0 0 var(--cal-focus-ring) rgb(var(--c) / 0.4);
	}
	:where(.calendar--disabled) { opacity: 0.5; pointer-events: none; }

	:where(.calendar--bare) {
		background: transparent;
		border-radius: 0;
		padding: 0;
		max-width: 100%;
	}

	:where(.calendar--variant-transparent) {
		background: transparent;
	}

	:where(.calendar--size-xl) {
		--cal-w: 360px;
		--cal-pad: 18px;
		--cal-radius: 24px;
		--cal-root-gap: 6px;
		--cal-header-pad-b: 12px;
		--cal-static-font: 1rem;
		--cal-weekday-font: 0.78rem;
		--cal-option-gap: 8px;
		--cal-action-font: 0.92rem;
		--cal-action-pad-y: 8px;
		--cal-action-pad-x: 14px;
		--cal-action-radius: 11px;
		--cal-footer-margin: 12px;
		--pb-cell-h: 40px;
		--pb-cell-r: 10px;
		--pb-cell-font: 0.95rem;
		--pb-option-h: 44px;
		--pb-option-font: 0.95rem;
		--pb-option-pad-x: 8px;
		--pb-icon-h: 32px;
		--pb-icon-r: 10px;
		--pb-chip-h: 32px;
		--pb-chip-pad-x: 10px;
		--pb-chip-font: 0.95rem;
	}
	:where(.calendar--size-large) {
		--cal-w: 320px;
		--cal-pad: 14px;
		--cal-radius: 22px;
		--cal-root-gap: 5px;
		--cal-header-pad-b: 10px;
		--cal-static-font: 0.92rem;
		--cal-weekday-font: 0.72rem;
		--cal-option-gap: 7px;
		--cal-action-font: 0.85rem;
		--cal-action-pad-y: 7px;
		--cal-action-pad-x: 12px;
		--cal-action-radius: 10px;
		--cal-footer-margin: 10px;
		--pb-cell-h: 36px;
		--pb-cell-r: 9px;
		--pb-cell-font: 0.88rem;
		--pb-option-h: 40px;
		--pb-option-font: 0.88rem;
		--pb-option-pad-x: 7px;
		--pb-icon-h: 30px;
		--pb-icon-r: 9px;
		--pb-chip-h: 30px;
		--pb-chip-pad-x: 9px;
		--pb-chip-font: 0.88rem;
	}
	/* medium = base values (set on .calendar root) */
	:where(.calendar--size-small) {
		--cal-w: 244px;
		--cal-pad: 10px;
		--cal-radius: 16px;
		--cal-root-gap: 3px;
		--cal-header-pad-b: 6px;
		--cal-static-font: 0.78rem;
		--cal-weekday-font: 0.6rem;
		--cal-option-gap: 5px;
		--cal-action-font: 0.7rem;
		--cal-action-pad-y: 5px;
		--cal-action-pad-x: 9px;
		--cal-action-radius: 7px;
		--cal-footer-margin: 6px;
		--pb-cell-h: 28px;
		--pb-cell-r: 7px;
		--pb-cell-font: 0.74rem;
		--pb-option-h: 32px;
		--pb-option-font: 0.74rem;
		--pb-option-pad-x: 5px;
		--pb-icon-h: 24px;
		--pb-icon-r: 7px;
		--pb-chip-h: 24px;
		--pb-chip-pad-x: 7px;
		--pb-chip-font: 0.72rem;
	}
	:where(.calendar--size-mini) {
		--cal-w: 212px;
		--cal-pad: 8px;
		--cal-radius: 12px;
		--cal-root-gap: 2px;
		--cal-header-pad-b: 5px;
		--cal-static-font: 0.7rem;
		--cal-weekday-font: 0.55rem;
		--cal-option-gap: 4px;
		--cal-action-font: 0.62rem;
		--cal-action-pad-y: 4px;
		--cal-action-pad-x: 7px;
		--cal-action-radius: 6px;
		--cal-footer-margin: 5px;
		--pb-cell-h: 24px;
		--pb-cell-r: 6px;
		--pb-cell-font: 0.66rem;
		--pb-option-h: 28px;
		--pb-option-font: 0.66rem;
		--pb-option-pad-x: 4px;
		--pb-icon-h: 22px;
		--pb-icon-r: 6px;
		--pb-chip-h: 22px;
		--pb-chip-pad-x: 6px;
		--pb-chip-font: 0.66rem;
	}
	.calendar__viewport {
		position: relative;
		overflow: hidden;
	}
	.calendar__view {
		display: grid;
		grid-template-areas: 'stage';
		width: 100%;
	}
	:global(.calendar__view + .calendar__view) {
		position: absolute;
		inset: 0;
	}
	.calendar__slide {
		grid-area: stage;
		min-width: 0;
		will-change: transform, opacity;
	}
	.calendar__footer {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 8px;
		margin-top: var(--cal-footer-margin);
		padding-top: var(--cal-footer-margin);
		border-top: 1px solid rgb(var(--text) / 0.08);
	}
	.calendar__action {
		padding: var(--cal-action-pad-y) var(--cal-action-pad-x);
		background: transparent;
		border: 0;
		border-radius: var(--cal-action-radius);
		color: rgb(var(--c));
		font: inherit;
		font-size: var(--cal-action-font);
		cursor: pointer;
		transition: background-color 150ms cubic-bezier(0.4, 0, 0.2, 1);
	}
	.calendar__action:hover { background: rgb(var(--c) / 0.12); }
</style>
