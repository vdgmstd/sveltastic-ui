import { Tween } from 'svelte/motion';
import { cubicOut } from 'svelte/easing';
import { Temporal } from '@js-temporal/polyfill';
import type { Color } from '../../types';
import type { DateRange } from '../../types';
import type { DateLike, WeekStart } from '../../utils/date';
import {
	toPlainDate,
	plainDateToISO,
	resolveLocale,
	localeWeekStart,
	orderRange,
	isSameDay,
	isSameMonth,
	isInRange,
	monthMatrix,
	weekdayLabels,
	today as todayFn
} from '../../utils/date';
import { rgbTriplet } from '../../utils/color';
import { pressBounce } from '../../actions/pressBounce.svelte';

export type CalendarType = 'single' | 'range';
export type CalendarView = 'days' | 'months' | 'years';
export type CalendarWeekdayFormat = 'narrow' | 'short' | 'long';

export type CalendarDayState = {
	isCurrentMonth: boolean;
	isToday: boolean;
	isSelected: boolean;
	isRangeStart: boolean;
	isRangeEnd: boolean;
	isInRange: boolean;
	isPreview: boolean;
	isDisabled: boolean;
};

export type CalendarOptionItem = {
	key: number;
	label: string;
	disabled?: boolean;
	selected?: boolean;
	current?: boolean;
};

type RowSeg = { row: number; colStart: number; colEnd: number; isStart: boolean; isEnd: boolean };

const YEARS_PER_PAGE = 12;

export type CalendarRootOptions = {
	getType: () => CalendarType;
	getValue: () => string | DateRange | undefined;
	setValueProp: (v: string | DateRange) => void;
	getPlaceholder: () => DateLike | undefined;
	setPlaceholderProp: (v: string) => void;
	onValueChange?: () => ((value: string | DateRange) => void) | undefined;
	onValueChangeComplete?: () => ((value: string | DateRange) => void) | undefined;
	onPlaceholderChange?: () => ((value: string) => void) | undefined;
	locale: () => string | undefined;
	weekStart: () => WeekStart | undefined;
	weekdayFormat: () => CalendarWeekdayFormat;
	min: () => DateLike | undefined;
	max: () => DateLike | undefined;
	disabledDate: () => ((date: Temporal.PlainDate) => boolean) | undefined;
	disabled: () => boolean;
	readonly: () => boolean;
	color: () => Color;
	dayColor: () => ((date: Temporal.PlainDate) => Color | undefined) | undefined;
};

/** Root state for the Calendar compound: selection, view machine, ARIA ids, and the selection-pill geometry tweens. */
export class CalendarRootState {
	#opts: CalendarRootOptions;

	view = $state<CalendarView>('days');
	monthDirection = $state<1 | -1>(1);
	preview = $state<Temporal.PlainDate | null>(null);
	focusedDate = $state<Temporal.PlainDate | null>(null);

	#viewMonthInternal = $state<Temporal.PlainDate | null>(null);
	yearPageStart = $state<number>(0);

	#cellW = $state(0);
	#rowsEl = $state<HTMLElement | null>(null);
	pillSize = $state(28);
	iconPx = $state(14);
	caretPx = $state(11);

	primaryPulseX = $state(14);
	primaryPulseY = $state(14);
	secondaryPulseX = $state(14);
	secondaryPulseY = $state(14);

	readonly primaryPulseScale = new Tween(0, { duration: 0 });
	readonly primaryPulseOpacity = new Tween(0, { duration: 0 });
	readonly secondaryPulseScale = new Tween(0, { duration: 0 });
	readonly secondaryPulseOpacity = new Tween(0, { duration: 0 });

	readonly primaryPress = pressBounce();
	readonly secondaryPress = pressBounce();

	readonly epPrimary = new TweenedRect();
	readonly epSecondary = new TweenedRect();
	readonly bodySlots = Array.from({ length: 6 }, () => new TweenedRect());

	primaryShown = $state(false);
	secondaryShown = $state(false);
	bodyShown = $state<boolean[]>(Array(6).fill(false));

	constructor(opts: CalendarRootOptions) {
		this.#opts = opts;
		const rawValue = opts.getValue();
		const seed =
			toPlainDate(opts.getPlaceholder()) ??
			toPlainDate(typeof rawValue === 'string' ? rawValue : undefined) ??
			toPlainDate(typeof rawValue === 'object' ? rawValue?.from : undefined) ??
			todayFn();
		this.#viewMonthInternal = seed;
		this.yearPageStart = seed.year - ((seed.year - 1) % YEARS_PER_PAGE);
	}

	get type(): CalendarType { return this.#opts.getType(); }
	get disabled(): boolean { return this.#opts.disabled(); }
	get readonly(): boolean { return this.#opts.readonly(); }
	get color(): Color { return this.#opts.color(); }
	get dayColor() { return this.#opts.dayColor(); }

	readonly resolvedLocale = $derived.by(() => resolveLocale(this.#opts.locale()));
	readonly resolvedWeekStart = $derived.by<WeekStart>(
		() => this.#opts.weekStart() ?? localeWeekStart(this.resolvedLocale)
	);
	readonly triplet = $derived.by(() => rgbTriplet(this.#opts.color()));

	readonly minDate = $derived.by(() => toPlainDate(this.#opts.min()));
	readonly maxDate = $derived.by(() => toPlainDate(this.#opts.max()));

	readonly #rawValue = $derived.by(() => this.#opts.getValue());
	readonly #singleValue = $derived.by(() =>
		typeof this.#rawValue === 'string' ? this.#rawValue : undefined
	);
	readonly #rangeValue = $derived.by(() =>
		this.#rawValue && typeof this.#rawValue === 'object' ? this.#rawValue : undefined
	);
	readonly selectedDate = $derived.by(() => toPlainDate(this.#singleValue));
	readonly rangeFrom = $derived.by(() => toPlainDate(this.#rangeValue?.from));
	readonly rangeTo = $derived.by(() => toPlainDate(this.#rangeValue?.to));

	readonly placeholderDate = $derived.by(() => toPlainDate(this.#opts.getPlaceholder()));

	readonly viewMonth = $derived.by(
		() =>
			this.placeholderDate ??
			this.#viewMonthInternal ??
			(this.type === 'single' ? this.selectedDate : null) ??
			todayFn()
	);

	readonly weeks = $derived.by(() => monthMatrix(this.viewMonth, this.resolvedWeekStart));
	readonly weekdays = $derived.by(() =>
		weekdayLabels(this.resolvedLocale, this.resolvedWeekStart, this.#opts.weekdayFormat())
	);
	readonly realToday = $derived.by(() => todayFn());

	readonly monthLabel = $derived.by(() =>
		new Intl.DateTimeFormat(this.resolvedLocale, { month: 'long' }).format(
			new Date(this.viewMonth.year, this.viewMonth.month - 1, 1)
		)
	);

	readonly leftTitle = $derived.by<string | undefined>(() => {
		if (this.view === 'days') return this.monthLabel;
		return undefined;
	});

	readonly rightTitle = $derived.by<string | undefined>(() => {
		if (this.view === 'days') return String(this.viewMonth.year);
		if (this.view === 'months') return String(this.viewMonth.year);
		return `${this.yearPageStart} – ${this.yearPageStart + YEARS_PER_PAGE - 1}`;
	});

	readonly monthItems = $derived.by<CalendarOptionItem[]>(() => {
		const fmt = new Intl.DateTimeFormat(this.resolvedLocale, { month: 'short' });
		const todayP = this.realToday;
		const items: CalendarOptionItem[] = [];
		for (let m = 1; m <= 12; m += 1) {
			const stub = new Date(this.viewMonth.year, m - 1, 1);
			items.push({
				key: m,
				label: fmt.format(stub),
				selected: m === this.viewMonth.month,
				current: m === todayP.month && this.viewMonth.year === todayP.year
			});
		}
		return items;
	});

	readonly yearItems = $derived.by<CalendarOptionItem[]>(() => {
		const todayP = this.realToday;
		const items: CalendarOptionItem[] = [];
		for (let i = 0; i < YEARS_PER_PAGE; i += 1) {
			const y = this.yearPageStart + i;
			items.push({
				key: y,
				label: String(y),
				selected: y === this.viewMonth.year,
				current: y === todayP.year
			});
		}
		return items;
	});

	readonly rovingDate = $derived.by(() => {
		for (const c of [this.focusedDate, this.selectedDate, this.rangeFrom, this.rangeTo]) {
			if (c && isSameMonth(c, this.viewMonth)) return c;
		}
		return isSameMonth(this.realToday, this.viewMonth) ? this.realToday : this.viewMonth;
	});

	setRowsEl(el: HTMLElement | null): void { this.#rowsEl = el; }
	setCellWidth(w: number): void { this.#cellW = w; }

	focusRovingCell(): void {
		this.#rowsEl
			?.querySelector<HTMLElement>('[role="gridcell"][tabindex="0"]')
			?.focus({ preventScroll: true });
	}

	#setViewMonth(d: Temporal.PlainDate): void {
		this.#viewMonthInternal = d;
		if (this.placeholderDate !== null || this.#opts.getPlaceholder() !== undefined) {
			this.#opts.setPlaceholderProp(plainDateToISO(d));
			this.#opts.onPlaceholderChange?.()?.(plainDateToISO(d));
		}
	}

	isDayDisabled(d: Temporal.PlainDate): boolean {
		if (this.disabled) return true;
		if (this.minDate && Temporal.PlainDate.compare(d, this.minDate) < 0) return true;
		if (this.maxDate && Temporal.PlainDate.compare(d, this.maxDate) > 0) return true;
		const fn = this.#opts.disabledDate();
		return fn ? fn(d) : false;
	}

	dayState(d: Temporal.PlainDate): CalendarDayState {
		const isCurrentMonth = isSameMonth(d, this.viewMonth);
		const isToday = isSameDay(d, this.realToday);
		const isDis = this.isDayDisabled(d);

		if (this.type === 'single') {
			const isSelected = !!this.selectedDate && isSameDay(d, this.selectedDate);
			return {
				isCurrentMonth,
				isToday,
				isSelected,
				isRangeStart: false,
				isRangeEnd: false,
				isInRange: false,
				isPreview: false,
				isDisabled: isDis
			};
		}

		const start = this.rangeFrom;
		const end = this.rangeTo;
		const isRangeStart = !!start && isSameDay(d, start);
		const isRangeEnd = !!end && isSameDay(d, end);
		const inSelected = isInRange(d, start, end);
		const inPreview =
			!end && !!start && !!this.preview ? isInRange(d, start, this.preview) : false;
		const isPreviewEnd = !end && !!this.preview && isSameDay(d, this.preview);

		return {
			isCurrentMonth,
			isToday,
			isSelected: isRangeStart || isRangeEnd,
			isRangeStart,
			isRangeEnd: isRangeEnd || (!end && isPreviewEnd),
			isInRange: inSelected || inPreview,
			isPreview: inPreview && !inSelected,
			isDisabled: isDis
		};
	}

	get hasRangeBody(): boolean {
		return this.type === 'range' && !!this.rangeFrom && (!!this.rangeTo || !!this.preview);
	}

	#emitValue(v: string | DateRange): void {
		this.#opts.onValueChange?.()?.(v);
	}

	pick(d: Temporal.PlainDate, pillSize: number, e?: MouseEvent): void {
		if (this.isDayDisabled(d) || this.readonly) return;
		const completing = this.type === 'range' && !!this.rangeFrom && !this.rangeTo;

		let px = pillSize / 2;
		let py = pillSize / 2;
		if (e) {
			const target = e.currentTarget as HTMLElement;
			const r = target.getBoundingClientRect();
			px = e.clientX - r.left;
			py = e.clientY - r.top;
		}

		let committed: string | DateRange;
		if (this.type === 'single') {
			const iso = plainDateToISO(d);
			this.#opts.setValueProp(iso);
			this.#emitValue(iso);
			committed = iso;
		} else if (!this.rangeFrom || (this.rangeFrom && this.rangeTo)) {
			const next: DateRange = { from: plainDateToISO(d) };
			this.#opts.setValueProp(next);
			this.preview = null;
			this.#emitValue(next);
			committed = next;
		} else {
			const ordered = orderRange(this.rangeFrom, d);
			const next: DateRange = { from: plainDateToISO(ordered.from), to: plainDateToISO(ordered.to) };
			this.#opts.setValueProp(next);
			this.preview = null;
			this.#emitValue(next);
			committed = next;
		}

		if (completing) {
			this.secondaryPulseX = px;
			this.secondaryPulseY = py;
			void this.pulse(this.secondaryPulseScale, this.secondaryPulseOpacity).then(() =>
				this.#opts.onValueChangeComplete?.()?.(committed)
			);
			void this.secondaryPress.press();
		} else {
			this.primaryPulseX = px;
			this.primaryPulseY = py;
			void this.pulse(this.primaryPulseScale, this.primaryPulseOpacity).then(() =>
				this.#opts.onValueChangeComplete?.()?.(committed)
			);
			void this.primaryPress.press();
		}
	}

	async pulse(scaleT: Tween<number>, opacityT: Tween<number>): Promise<void> {
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

	clear(): void {
		if (this.readonly) return;
		if (this.type === 'single') {
			this.#opts.setValueProp('');
			this.#emitValue('');
		} else {
			const empty: DateRange = {};
			this.#opts.setValueProp(empty);
			this.#emitValue(empty);
		}
	}

	goToday(): void {
		this.#setViewMonth(todayFn());
		this.view = 'days';
	}

	#shiftMonth(delta: number): void {
		this.monthDirection = delta > 0 ? 1 : -1;
		this.#setViewMonth(this.viewMonth.add({ months: delta }));
	}

	#shiftYear(delta: number): void {
		this.monthDirection = delta > 0 ? 1 : -1;
		this.#setViewMonth(this.viewMonth.add({ years: delta }));
	}

	#shiftYearPage(delta: number): void {
		this.monthDirection = delta > 0 ? 1 : -1;
		this.yearPageStart += delta * YEARS_PER_PAGE;
	}

	openMonths(): void { this.view = 'months'; }

	openYears(): void {
		this.yearPageStart = this.viewMonth.year - ((this.viewMonth.year - 1) % YEARS_PER_PAGE);
		this.view = 'years';
	}

	pickMonth(month: number): void {
		this.#setViewMonth(this.viewMonth.with({ month }));
		this.view = 'days';
	}

	pickYear(year: number): void {
		this.#setViewMonth(this.viewMonth.with({ year }));
		this.view = 'months';
	}

	handlePrev(): void {
		if (this.view === 'days') this.#shiftMonth(-1);
		else if (this.view === 'months') this.#shiftYear(-1);
		else this.#shiftYearPage(-1);
	}

	handleNext(): void {
		if (this.view === 'days') this.#shiftMonth(1);
		else if (this.view === 'months') this.#shiftYear(1);
		else this.#shiftYearPage(1);
	}

	handleLeft(): void {
		if (this.view === 'days') this.openMonths();
	}

	handleRight(): void {
		if (this.view === 'days' || this.view === 'months') this.openYears();
	}

	#focusChange(d: Temporal.PlainDate): void {
		this.focusedDate = d;
		if (d.year !== this.viewMonth.year || d.month !== this.viewMonth.month) this.#setViewMonth(d);
		if (this.type === 'range' && this.rangeFrom && !this.rangeTo) this.preview = d;
	}

	previewDay(d: Temporal.PlainDate): void {
		if (this.type === 'range' && this.rangeFrom && !this.rangeTo) this.preview = d;
	}

	handleGridKeydown(e: KeyboardEvent, pillSize: number): void {
		if (this.disabled) return;
		const cursor = this.rovingDate;
		const ws = this.resolvedWeekStart;
		let next: Temporal.PlainDate | null = null;
		switch (e.key) {
			case 'ArrowLeft':  next = cursor.subtract({ days: 1 }); break;
			case 'ArrowRight': next = cursor.add({ days: 1 }); break;
			case 'ArrowUp':    next = cursor.subtract({ days: 7 }); break;
			case 'ArrowDown':  next = cursor.add({ days: 7 }); break;
			case 'PageUp':     next = cursor.subtract(e.shiftKey ? { years: 1 } : { months: 1 }); break;
			case 'PageDown':   next = cursor.add(e.shiftKey ? { years: 1 } : { months: 1 }); break;
			case 'Home':       next = cursor.subtract({ days: (cursor.dayOfWeek - ws + 7) % 7 }); break;
			case 'End':        next = cursor.add({ days: 6 - ((cursor.dayOfWeek - ws + 7) % 7) }); break;
			case 'Enter':
			case ' ':          e.preventDefault(); this.pick(cursor, pillSize); return;
			default: return;
		}
		if (!next) return;
		e.preventDefault();
		this.#focusChange(next);
	}

	#findCellPos(
		matrix: Temporal.PlainDate[][],
		date: Temporal.PlainDate | null
	): { row: number; col: number } | null {
		if (!date) return null;
		for (let r = 0; r < matrix.length; r += 1) {
			for (let c = 0; c < 7; c += 1) {
				if (isSameDay(matrix[r][c], date)) return { row: r, col: c };
			}
		}
		return null;
	}

	#computeBodyRows(
		matrix: Temporal.PlainDate[][],
		a: Temporal.PlainDate,
		b: Temporal.PlainDate
	): RowSeg[] {
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
				colStart,
				colEnd,
				isStart: isSameDay(week[colStart], s),
				isEnd: isSameDay(week[colEnd], e)
			});
		}
		return out;
	}

	readonly effEnd = $derived<Temporal.PlainDate | null>(
		this.type === 'range' ? (this.rangeTo ?? this.preview ?? null) : null
	);

	readonly primaryDate = $derived<Temporal.PlainDate | null>(
		this.type === 'single' ? (this.selectedDate ?? null) : (this.rangeFrom ?? null)
	);
	readonly secondaryDate = $derived<Temporal.PlainDate | null>(
		this.type === 'range' && this.rangeFrom && this.effEnd && !isSameDay(this.rangeFrom, this.effEnd)
			? this.effEnd
			: null
	);

	readonly primaryPos = $derived(this.#findCellPos(this.weeks, this.primaryDate));
	readonly secondaryPos = $derived(this.#findCellPos(this.weeks, this.secondaryDate));
	readonly bodyRows = $derived<RowSeg[]>(
		this.type === 'range' && this.rangeFrom && this.effEnd && !isSameDay(this.rangeFrom, this.effEnd)
			? this.#computeBodyRows(this.weeks, this.rangeFrom, this.effEnd)
			: []
	);

	readonly primaryColor = $derived(
		this.primaryDate ? rgbTriplet(this.dayColor?.(this.primaryDate) ?? this.color) : null
	);
	readonly secondaryColor = $derived(
		this.secondaryDate ? rgbTriplet(this.dayColor?.(this.secondaryDate) ?? this.color) : null
	);

	readonly bodyCorners = $derived.by(() => {
		const out: { left: boolean; right: boolean }[] = Array.from({ length: 6 }, () => ({
			left: false,
			right: false
		}));
		for (const br of this.bodyRows) {
			out[br.row] = { left: br.isStart, right: br.isEnd };
		}
		return out;
	});

	syncGeometry(pill: number, cellH: number, gap: number): void {
		const cellW = this.#cellW;
		if (!cellW) return;
		const offset = (cellW - pill) / 2;
		const pp = this.primaryPos;
		const sp = this.secondaryPos;
		const brs = this.bodyRows;

		if (pp) {
			this.epPrimary.set(pp.col * (cellW + gap) + offset, pp.row * (cellH + gap), pill);
			this.primaryShown = true;
		} else {
			this.primaryShown = false;
			this.epPrimary.unprime();
		}

		if (sp) {
			this.epSecondary.set(sp.col * (cellW + gap) + offset, sp.row * (cellH + gap), pill);
			this.secondaryShown = true;
		} else {
			this.secondaryShown = false;
			this.epSecondary.unprime();
		}

		const next = Array(6).fill(false) as boolean[];
		const byRow = new Map<number, RowSeg>();
		for (const br of brs) byRow.set(br.row, br);
		for (let r = 0; r < 6; r += 1) {
			const br = byRow.get(r);
			if (br) {
				const span = br.colEnd - br.colStart;
				this.bodySlots[r].set(
					br.colStart * (cellW + gap) + offset,
					br.row * (cellH + gap),
					span * (cellW + gap) + pill
				);
				next[r] = true;
			} else {
				this.bodySlots[r].unprime();
			}
		}
		this.bodyShown = next;
	}
}

class TweenedRect {
	x = new Tween(0, { duration: 280, easing: cubicOut });
	y = new Tween(0, { duration: 280, easing: cubicOut });
	w = new Tween(0, { duration: 280, easing: cubicOut });
	primed = false;

	set(x: number, y: number, w: number): void {
		if (this.primed) {
			const o = undefined;
			this.x.set(x, o);
			this.y.set(y, o);
			this.w.set(w, o);
		} else {
			this.x.set(x, { duration: 0 });
			this.y.set(y, { duration: 0 });
			this.w.set(w, { duration: 0 });
			this.primed = true;
		}
	}

	unprime(): void { this.primed = false; }
}
