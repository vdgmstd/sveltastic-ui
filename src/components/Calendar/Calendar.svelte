<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import type { Color, Size } from '../../types';
	import type { DateRange, WithElementRef } from '../../types';
	import type { DateLike, WeekStart } from '../../utils/date';
	import type { Temporal } from '@js-temporal/polyfill';
	import type {
		CalendarType,
		CalendarDayState,
		CalendarWeekdayFormat
	} from './calendarState.svelte';

	/** Calendar's chrome accent — limited to two semantic tones. Per-day colors go through `dayColor`. */
	export type CalendarColor = 'primary' | 'warning';

	type CalendarRootBaseProps = WithElementRef<
		Omit<HTMLAttributes<HTMLDivElement>, 'class' | 'style' | 'children'> & {
			/** Controlled view month (`YYYY-MM-DD`); two-way bindable. Drives which month/year the grid shows. */
			placeholder?: DateLike;
			/** Locale for weekday / month labels. Defaults to `'en-US'`. */
			locale?: string;
			/** First day of the week. Defaults to the locale's convention. */
			weekStart?: WeekStart;
			/** Weekday header label width. */
			weekdayFormat?: CalendarWeekdayFormat;
			/** Lower bound (inclusive). */
			min?: DateLike;
			/** Upper bound (inclusive). */
			max?: DateLike;
			/** Predicate to disable individual days. */
			disabledDate?: (date: Temporal.PlainDate) => boolean;
			/** Disable the entire calendar. */
			disabled?: boolean;
			/** Block selection while keeping the calendar interactive for navigation. */
			readonly?: boolean;
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
			/** Footer "Today" button label. */
			todayLabel?: string;
			/** Footer "Clear" button label. */
			clearLabel?: string;
			/** Accessible label for the calendar group. */
			ariaLabel?: string;
			/** Custom day renderer. */
			day?: Snippet<[Temporal.PlainDate, CalendarDayState]>;
			/** Fires when the view month changes. */
			onPlaceholderChange?: (value: string) => void;
			/** Compound parts (`Calendar.Header`/`Calendar.Grid`/…). When omitted, the default month view renders. */
			children?: Snippet;
			/** Class merged onto the root. */
			class?: string;
			/** Inline style merged onto the root. */
			style?: string;
		},
		HTMLDivElement
	>;

	/** Compound Calendar root, discriminated on `type` (single day vs date range). */
	export type CalendarRootProps =
		| (CalendarRootBaseProps & {
				type?: 'single';
				/** Bound day (`YYYY-MM-DD`). */
				value?: string;
				onValueChange?: (value: string) => void;
				/** Fires after the selection pill / slide settles. */
				onValueChangeComplete?: (value: string) => void;
		  })
		| (CalendarRootBaseProps & {
				type: 'range';
				/** Bound range. */
				value?: DateRange;
				onValueChange?: (value: DateRange) => void;
				/** Fires after the selection pill / slide settles. */
				onValueChangeComplete?: (value: DateRange) => void;
		  });

	type CalendarSizeKey = 'xl' | 'large' | 'medium' | 'small' | 'mini';

	type CalendarMetrics = {
		cellH: number;
		pill: number;
		gap: number;
		iconPx: number;
		caretPx: number;
	};

	type CalendarVars = Record<string, string>;

	const SIZE_METRICS: Record<CalendarSizeKey, CalendarMetrics> = {
		xl:     { cellH: 40, pill: 36, gap: 3, iconPx: 18, caretPx: 13 },
		large:  { cellH: 36, pill: 32, gap: 2, iconPx: 16, caretPx: 12 },
		medium: { cellH: 32, pill: 28, gap: 2, iconPx: 14, caretPx: 11 },
		small:  { cellH: 28, pill: 24, gap: 2, iconPx: 12, caretPx: 10 },
		mini:   { cellH: 24, pill: 20, gap: 2, iconPx: 10, caretPx: 9 }
	};

	const SIZE_VARS: Record<CalendarSizeKey, CalendarVars> = {
		xl: {
			'--cal-w': '360px', '--cal-pad': 'var(--space-7)', '--cal-radius': 'var(--rad-2xl)', '--cal-root-gap': 'var(--space-3)',
			'--cal-header-pad-b': 'var(--space-6)', '--cal-static-font': 'var(--fs-lg)', '--cal-weekday-font': 'var(--fs-sm)',
			'--cal-option-gap': 'var(--space-4)', '--cal-action-font': 'var(--fs-lg)', '--cal-action-pad-y': 'var(--space-4)',
			'--cal-action-pad-x': 'var(--space-7)', '--cal-action-radius': 'var(--rad-md)', '--cal-footer-margin': 'var(--space-6)',
			'--cal-focus-ring': '2px', '--pb-cell-h': '40px', '--pb-cell-r': '10px', '--pb-cell-font': 'var(--fs-lg)',
			'--pb-option-h': '44px', '--pb-option-font': 'var(--fs-lg)', '--pb-option-pad-x': 'var(--space-4)',
			'--pb-icon-h': '32px', '--pb-icon-r': '10px', '--pb-chip-h': '32px', '--pb-chip-pad-x': 'var(--space-5)',
			'--pb-chip-font': 'var(--fs-lg)'
		},
		large: {
			'--cal-w': '320px', '--cal-pad': '14px', '--cal-radius': '22px', '--cal-root-gap': '5px',
			'--cal-header-pad-b': 'var(--space-5)', '--cal-static-font': '0.92rem', '--cal-weekday-font': '0.72rem',
			'--cal-option-gap': '7px', '--cal-action-font': 'var(--fs-md)', '--cal-action-pad-y': '7px',
			'--cal-action-pad-x': 'var(--space-6)', '--cal-action-radius': '10px', '--cal-footer-margin': 'var(--space-5)',
			'--cal-focus-ring': '2px', '--pb-cell-h': '36px', '--pb-cell-r': '9px', '--pb-cell-font': 'var(--fs-md)',
			'--pb-option-h': '40px', '--pb-option-font': 'var(--fs-md)', '--pb-option-pad-x': '7px',
			'--pb-icon-h': '30px', '--pb-icon-r': '9px', '--pb-chip-h': '30px', '--pb-chip-pad-x': '9px',
			'--pb-chip-font': 'var(--fs-md)'
		},
		medium: {
			'--cal-w': '280px', '--cal-pad': 'var(--space-6)', '--cal-radius': 'var(--rad-xl)', '--cal-root-gap': 'var(--space-2)',
			'--cal-header-pad-b': 'var(--space-4)', '--cal-static-font': 'var(--fs-md)', '--cal-weekday-font': 'var(--fs-xs)',
			'--cal-option-gap': 'var(--space-3)', '--cal-action-font': 'var(--fs-sm)', '--cal-action-pad-y': 'var(--space-3)',
			'--cal-action-pad-x': 'var(--space-5)', '--cal-action-radius': 'var(--rad-sm)', '--cal-footer-margin': 'var(--space-4)',
			'--cal-focus-ring': '2px', '--pb-cell-h': '32px', '--pb-cell-r': 'var(--rad-sm)', '--pb-cell-font': '0.82rem',
			'--pb-option-h': '36px', '--pb-option-font': 'var(--fs-sm)', '--pb-option-pad-x': 'var(--space-3)',
			'--pb-icon-h': '28px', '--pb-icon-r': 'var(--rad-sm)', '--pb-chip-h': '28px', '--pb-chip-pad-x': 'var(--space-4)',
			'--pb-chip-font': 'var(--fs-sm)'
		},
		small: {
			'--cal-w': '244px', '--cal-pad': 'var(--space-5)', '--cal-radius': 'var(--rad-lg)', '--cal-root-gap': '3px',
			'--cal-header-pad-b': 'var(--space-3)', '--cal-static-font': 'var(--fs-sm)', '--cal-weekday-font': '0.6rem',
			'--cal-option-gap': '5px', '--cal-action-font': 'var(--fs-xs)', '--cal-action-pad-y': '5px',
			'--cal-action-pad-x': 'var(--space-4)', '--cal-action-radius': '7px', '--cal-footer-margin': 'var(--space-3)',
			'--cal-focus-ring': '2px', '--pb-cell-h': '28px', '--pb-cell-r': '7px', '--pb-cell-font': 'var(--fs-sm)',
			'--pb-option-h': '32px', '--pb-option-font': '0.74rem', '--pb-option-pad-x': '5px',
			'--pb-icon-h': '24px', '--pb-icon-r': '7px', '--pb-chip-h': '24px', '--pb-chip-pad-x': '7px',
			'--pb-chip-font': '0.72rem'
		},
		mini: {
			'--cal-w': '212px', '--cal-pad': 'var(--space-4)', '--cal-radius': 'var(--rad-md)', '--cal-root-gap': 'var(--space-1)',
			'--cal-header-pad-b': '5px', '--cal-static-font': 'var(--fs-xs)', '--cal-weekday-font': '0.55rem',
			'--cal-option-gap': 'var(--space-2)', '--cal-action-font': '0.62rem', '--cal-action-pad-y': 'var(--space-2)',
			'--cal-action-pad-x': 'var(--space-3)', '--cal-action-radius': 'var(--rad-xs)', '--cal-footer-margin': 'var(--space-2)',
			'--cal-focus-ring': '2px', '--pb-cell-h': '24px', '--pb-cell-r': 'var(--rad-xs)', '--pb-cell-font': 'var(--fs-xs)',
			'--pb-option-h': '28px', '--pb-option-font': 'var(--fs-xs)', '--pb-option-pad-x': 'var(--space-2)',
			'--pb-icon-h': '22px', '--pb-icon-r': 'var(--rad-xs)', '--pb-chip-h': '22px', '--pb-chip-pad-x': 'var(--space-3)',
			'--pb-chip-font': 'var(--fs-xs)'
		}
	};

	function resolveSizeKey(s: Size | undefined): CalendarSizeKey {
		return s && Object.prototype.hasOwnProperty.call(SIZE_METRICS, s)
			? (s as CalendarSizeKey)
			: 'medium';
	}
</script>

<script lang="ts">
	import { Tween } from 'svelte/motion';
	import { cubicOut } from 'svelte/easing';
	import { fade, scale } from 'svelte/transition';
	import { cn } from '../../utils/cn';
	import { boolAttr } from '../../utils/attrs';
	import { attachRef } from '../../utils/ref';
	import { setCalendarCtx } from './context';
	import { CalendarRootState } from './calendarState.svelte';
	import Header from './CalendarHeader.svelte';
	import Grid from './CalendarGrid.svelte';
	import OptionGrid from './CalendarOptionGrid.svelte';

	let {
		type = 'single',
		value = $bindable(),
		placeholder = $bindable(),
		locale,
		weekStart,
		weekdayFormat = 'short',
		min,
		max,
		disabledDate,
		disabled = false,
		readonly = false,
		size = 'medium',
		bare = false,
		variant = 'default',
		color = 'primary',
		dayColor,
		showFooter = false,
		todayLabel = 'Today',
		clearLabel = 'Clear',
		ariaLabel = 'Calendar',
		day,
		onValueChange,
		onValueChangeComplete,
		onPlaceholderChange,
		ref = $bindable(null),
		class: className,
		style: userStyle,
		children,
		...rest
	}: CalendarRootProps = $props();

	let sizeKey = $derived(resolveSizeKey(size));
	let metrics = $derived(SIZE_METRICS[sizeKey]);
	let sizeVars = $derived(SIZE_VARS[sizeKey]);
	let sizeStyle = $derived(Object.entries(sizeVars).map(([k, v]) => `${k}:${v}`).join(';'));

	const root = setCalendarCtx(
		new CalendarRootState(
			{
				getType: () => type,
				getValue: () => value,
				setValueProp: (v) => { value = v as typeof value; },
				getPlaceholder: () => placeholder,
				setPlaceholderProp: (v) => { placeholder = v; },
				onValueChange: () =>
					onValueChange as ((value: string | DateRange) => void) | undefined,
				onValueChangeComplete: () =>
					onValueChangeComplete as ((value: string | DateRange) => void) | undefined,
				onPlaceholderChange: () => onPlaceholderChange,
				locale: () => locale,
				weekStart: () => weekStart,
				weekdayFormat: () => weekdayFormat,
				min: () => min,
				max: () => max,
				disabledDate: () => disabledDate,
				disabled: () => disabled,
				readonly: () => readonly,
				color: () => color,
				dayColor: () => dayColor
			}
		)
	);

	$effect(() => {
		root.pillSize = metrics.pill;
		root.iconPx = metrics.iconPx;
		root.caretPx = metrics.caretPx;
	});

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
	class={cn('calendar', `calendar--variant-${variant}`, bare && 'calendar--bare', className)}
	data-disabled={boolAttr(disabled)}
	data-readonly={boolAttr(readonly)}
	data-view={root.view}
	data-type={type}
	style:--c={root.triplet}
	style={`${sizeStyle};${userStyle ?? ''}`}
	role="group"
	aria-label={ariaLabel}
	data-testid="calendar"
	{@attach attachRef<HTMLDivElement>((n) => (ref = n))}
	{...rest}
>
	{#if children}
		{@render children()}
	{:else}
		<Header />
		<div class="calendar__viewport" style:height={measured ? `${bodyHeight.current}px` : 'auto'}>
			{#key root.view}
				<div
					class="calendar__view"
					bind:this={bodyEl}
					in:scale={{ duration: 200, start: 0.96, opacity: 0 }}
					out:fade={{ duration: 120 }}
				>
					{#if root.view === 'days'}
						{#key `${root.viewMonth.year}-${root.viewMonth.month}`}
							<div class="calendar__slide" in:slideIn={root.monthDirection} out:slideOut={root.monthDirection}>
								<Grid gap={metrics.gap} cellH={metrics.cellH} pill={metrics.pill} {day} />
							</div>
						{/key}
					{:else if root.view === 'months'}
						{#key root.viewMonth.year}
							<div class="calendar__slide" in:slideIn={root.monthDirection} out:slideOut={root.monthDirection}>
								<OptionGrid items={root.monthItems} {disabled} {color} columns={3} onselect={(m) => root.pickMonth(m)} />
							</div>
						{/key}
					{:else}
						{#key root.yearPageStart}
							<div class="calendar__slide" in:slideIn={root.monthDirection} out:slideOut={root.monthDirection}>
								<OptionGrid items={root.yearItems} {disabled} {color} columns={3} onselect={(y) => root.pickYear(y)} />
							</div>
						{/key}
					{/if}
				</div>
			{/key}
		</div>
		{#if showFooter}
			<div class="calendar__footer">
				<button type="button" class="calendar__action" onclick={() => root.goToday()}>{todayLabel}</button>
				<button type="button" class="calendar__action" onclick={() => root.clear()}>{clearLabel}</button>
			</div>
		{/if}
	{/if}
</div>

<style>
	:where(.calendar) {
		--c: var(--primary);
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
	:where(.calendar[data-disabled]) { opacity: 0.5; pointer-events: none; }

	:where(.calendar--bare) {
		background: transparent;
		border-radius: 0;
		padding: 0;
		max-width: 100%;
	}

	:where(.calendar--variant-transparent) {
		background: transparent;
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
		gap: var(--space-4);
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
		transition: background-color var(--dur-fast) var(--ease-standard);
	}
	.calendar__action:hover { background: rgb(var(--c) / 0.12); }
	.calendar__action:focus-visible {
		outline: 2px solid rgb(var(--c) / 0.6);
		outline-offset: 2px;
	}
</style>
