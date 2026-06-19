import { Temporal } from '@js-temporal/polyfill';

export type PlainDate = Temporal.PlainDate;
export type PlainTime = Temporal.PlainTime;
export type PlainDateTime = Temporal.PlainDateTime;

/** Anything the kit accepts as a date input — ISO string `YYYY-MM-DD`, native `Date`, or `Temporal.PlainDate`. */
export type DateLike = string | Date | Temporal.PlainDate;

/** Anything the kit accepts as a time input — ISO string `HH:MM[:SS]`, native `Date`, or `Temporal.PlainTime`. */
export type TimeLike = string | Date | Temporal.PlainTime;

/** Anything the kit accepts as a date+time input — ISO string, native `Date`, or `Temporal.PlainDateTime`. */
export type DateTimeLike = string | Date | Temporal.PlainDateTime;

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const ISO_DATETIME = /^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}/;

function dateFromJsDate(d: Date): Temporal.PlainDate {
	return Temporal.PlainDate.from({
		year: d.getFullYear(),
		month: d.getMonth() + 1,
		day: d.getDate()
	});
}

function dateTimeFromJsDate(d: Date): Temporal.PlainDateTime {
	return Temporal.PlainDateTime.from({
		year: d.getFullYear(),
		month: d.getMonth() + 1,
		day: d.getDate(),
		hour: d.getHours(),
		minute: d.getMinutes(),
		second: d.getSeconds()
	});
}

/** Coerce a date-like to `PlainDate`. Returns `null` for unparseable input — pickers treat that as "no value". */
export function toPlainDate(input: DateLike | null | undefined): Temporal.PlainDate | null {
	if (input == null || input === '') return null;
	if (input instanceof Temporal.PlainDate) return input;
	if (input instanceof Date) return Number.isNaN(input.getTime()) ? null : dateFromJsDate(input);
	if (typeof input === 'string') {
		try {
			if (ISO_DATE.test(input)) return Temporal.PlainDate.from(input);
			if (ISO_DATETIME.test(input)) return Temporal.PlainDateTime.from(input).toPlainDate();
			return Temporal.PlainDate.from(input);
		} catch {
			return null;
		}
	}
	return null;
}

export function toPlainTime(input: TimeLike | null | undefined): Temporal.PlainTime | null {
	if (input == null || input === '') return null;
	if (input instanceof Temporal.PlainTime) return input;
	if (input instanceof Date) return Number.isNaN(input.getTime())
		? null
		: Temporal.PlainTime.from({ hour: input.getHours(), minute: input.getMinutes(), second: input.getSeconds() });
	if (typeof input === 'string') {
		try {
			return Temporal.PlainTime.from(input);
		} catch {
			return null;
		}
	}
	return null;
}

export function toPlainDateTime(input: DateTimeLike | null | undefined): Temporal.PlainDateTime | null {
	if (input == null || input === '') return null;
	if (input instanceof Temporal.PlainDateTime) return input;
	if (input instanceof Date)
		return Number.isNaN(input.getTime()) ? null : dateTimeFromJsDate(input);
	if (typeof input === 'string') {
		try {
			return Temporal.PlainDateTime.from(input);
		} catch {
			return null;
		}
	}
	return null;
}

export function plainDateToISO(date: Temporal.PlainDate | null | undefined): string {
	return date ? date.toString() : '';
}

export function plainTimeToISO(
	time: Temporal.PlainTime | null | undefined,
	withSeconds = false
): string {
	if (!time) return '';
	const hh = String(time.hour).padStart(2, '0');
	const mm = String(time.minute).padStart(2, '0');
	if (!withSeconds) return `${hh}:${mm}`;
	const ss = String(time.second).padStart(2, '0');
	return `${hh}:${mm}:${ss}`;
}

export function plainDateTimeToISO(
	dt: Temporal.PlainDateTime | null | undefined,
	withSeconds = false
): string {
	if (!dt) return '';
	const date = plainDateToISO(dt.toPlainDate());
	const time = plainTimeToISO(dt.toPlainTime(), withSeconds);
	return `${date}T${time}`;
}

/** Hour / minute / second triple — the parsed time used by the time picker. */
export type TimeParts = { h: number; m: number; s: number };

/** Zero-pad a number to two digits. */
export function pad(n: number): string {
	return String(n).padStart(2, '0');
}

const TIME_PARTS = /^(\d{1,2})(?:[:.\s](\d{1,2}))?(?:[:.\s](\d{1,2}))?\s*(am|pm)?$/i;

/** Parse loose time text (`HH:MM[:SS]`, dotted, with optional `am`/`pm`) to a 24-hour triple, or `null`. */
export function parseTimeParts(text: string): TimeParts | null {
	const trimmed = (text ?? '').trim();
	if (!trimmed) return null;
	const m = trimmed.match(TIME_PARTS);
	if (!m) return null;
	let h = parseInt(m[1] ?? '0', 10);
	const min = parseInt(m[2] ?? '0', 10);
	const sec = parseInt(m[3] ?? '0', 10);
	const period = m[4]?.toLowerCase();
	if (period === 'pm' && h < 12) h += 12;
	if (period === 'am' && h === 12) h = 0;
	if (h > 23 || min > 59 || sec > 59) return null;
	return { h, m: min, s: sec };
}

/** ISO time string (`HH:MM` or `HH:MM:SS`) from a 24-hour triple. */
export function timePartsToISO(p: TimeParts, withSeconds = false): string {
	return withSeconds ? `${pad(p.h)}:${pad(p.m)}:${pad(p.s)}` : `${pad(p.h)}:${pad(p.m)}`;
}

/** Display string for a time triple, honoring 12-hour mode and optional seconds. */
export function formatTimeParts(
	p: TimeParts,
	{ withSeconds = false, hour12 = false }: { withSeconds?: boolean; hour12?: boolean } = {}
): string {
	const sec = withSeconds ? `:${pad(p.s)}` : '';
	if (hour12) {
		const dh = p.h === 0 ? 12 : p.h > 12 ? p.h - 12 : p.h;
		const period = p.h >= 12 ? 'PM' : 'AM';
		return `${pad(dh)}:${pad(p.m)}${sec} ${period}`;
	}
	return `${pad(p.h)}:${pad(p.m)}${sec}`;
}

/** Today as `PlainDate` in the host's timezone (fallback to UTC under SSR). */
export function today(timeZone?: string): Temporal.PlainDate {
	try {
		return Temporal.Now.plainDateISO(timeZone);
	} catch {
		return Temporal.Now.plainDateISO('UTC');
	}
}

export function isSameDay(a: Temporal.PlainDate, b: Temporal.PlainDate): boolean {
	return a.equals(b);
}

export function isSameMonth(a: Temporal.PlainDate, b: Temporal.PlainDate): boolean {
	return a.year === b.year && a.month === b.month;
}

/** Inclusive range check. `from`/`to` may be reversed — caller orders them. */
export function isInRange(
	d: Temporal.PlainDate,
	from: Temporal.PlainDate | null,
	to: Temporal.PlainDate | null
): boolean {
	if (!from || !to) return false;
	const lo = Temporal.PlainDate.compare(from, to) <= 0 ? from : to;
	const hi = Temporal.PlainDate.compare(from, to) <= 0 ? to : from;
	return Temporal.PlainDate.compare(d, lo) >= 0 && Temporal.PlainDate.compare(d, hi) <= 0;
}

export function clampDate(
	d: Temporal.PlainDate,
	min: Temporal.PlainDate | null,
	max: Temporal.PlainDate | null
): Temporal.PlainDate {
	if (min && Temporal.PlainDate.compare(d, min) < 0) return min;
	if (max && Temporal.PlainDate.compare(d, max) > 0) return max;
	return d;
}

/** Order a (potentially reversed) range so `from` ≤ `to`. */
export function orderRange(
	from: Temporal.PlainDate | null,
	to: Temporal.PlainDate | null
): { from: Temporal.PlainDate | null; to: Temporal.PlainDate | null } {
	if (!from || !to) return { from, to };
	return Temporal.PlainDate.compare(from, to) <= 0 ? { from, to } : { from: to, to: from };
}

export type WeekStart = 0 | 1 | 2 | 3 | 4 | 5 | 6;

/**
 * 6×7 matrix of `PlainDate` covering the month containing `anchor`,
 * padded with leading / trailing days from neighbouring months.
 * `weekStart` — 0 (Sun) … 6 (Sat). Defaults to 1 (Mon) — ISO 8601.
 */
export function monthMatrix(
	anchor: Temporal.PlainDate,
	weekStart: WeekStart = 1
): Temporal.PlainDate[][] {
	const first = anchor.with({ day: 1 });
	const offset = (first.dayOfWeek - weekStart + 7) % 7;
	const start = first.subtract({ days: offset });
	const weeks: Temporal.PlainDate[][] = [];
	for (let w = 0; w < 6; w += 1) {
		const row: Temporal.PlainDate[] = [];
		for (let d = 0; d < 7; d += 1) row.push(start.add({ days: w * 7 + d }));
		weeks.push(row);
	}
	return weeks;
}

/** Localized weekday short labels (e.g. `Mon Tue …`) honoring `weekStart`. */
export function weekdayLabels(
	locale: string,
	weekStart: WeekStart = 1,
	format: 'narrow' | 'short' | 'long' = 'short'
): string[] {
	const fmt = new Intl.DateTimeFormat(locale, { weekday: format });
	const out: string[] = [];
	const ref = new Date(2024, 0, 1);
	const refDow = ref.getDay();
	for (let i = 0; i < 7; i += 1) {
		const offset = (i + weekStart - refDow + 7) % 7;
		const d = new Date(ref);
		d.setDate(ref.getDate() + offset);
		out.push(fmt.format(d));
	}
	return out;
}

/** Default locale — `'en-US'` unless an explicit locale is passed in. */
export function resolveLocale(explicit?: string): string {
	return explicit ?? 'en-US';
}

/** Whether the locale starts the week on Sunday — useful as a default for `weekStart`. */
export function localeWeekStart(locale: string): WeekStart {
	const region = new Intl.Locale(locale).region ?? 'US';
	const sundayFirst = new Set([
		'US', 'CA', 'MX', 'JP', 'IL', 'PH', 'ZA', 'BR', 'CO', 'PE', 'VE', 'KR'
	]);
	return sundayFirst.has(region) ? 0 : 1;
}

export function formatDate(
	date: Temporal.PlainDate,
	locale: string,
	options?: Intl.DateTimeFormatOptions
): string {
	const opts: Intl.DateTimeFormatOptions = options ?? {
		year: 'numeric',
		month: 'short',
		day: 'numeric'
	};
	return new Intl.DateTimeFormat(locale, opts).format(toJsDate(date));
}

export function formatTime(
	time: Temporal.PlainTime,
	locale: string,
	options?: Intl.DateTimeFormatOptions
): string {
	const opts: Intl.DateTimeFormatOptions = options ?? {
		hour: '2-digit',
		minute: '2-digit'
	};
	const stub = new Date();
	stub.setHours(time.hour, time.minute, time.second);
	return new Intl.DateTimeFormat(locale, opts).format(stub);
}

export function formatDateTime(
	dt: Temporal.PlainDateTime,
	locale: string,
	options?: Intl.DateTimeFormatOptions
): string {
	const opts: Intl.DateTimeFormatOptions = options ?? {
		year: 'numeric',
		month: 'short',
		day: 'numeric',
		hour: '2-digit',
		minute: '2-digit'
	};
	return new Intl.DateTimeFormat(locale, opts).format(toJsDate(dt));
}

export function formatMonthYear(
	date: Temporal.PlainDate,
	locale: string,
	options?: Intl.DateTimeFormatOptions
): string {
	const opts: Intl.DateTimeFormatOptions = options ?? { month: 'long', year: 'numeric' };
	return new Intl.DateTimeFormat(locale, opts).format(toJsDate(date));
}

/** Whether the active locale uses 12-hour clock (am/pm). */
export function localeUses12Hour(locale: string): boolean {
	const parts = new Intl.DateTimeFormat(locale, { hour: 'numeric' }).formatToParts(new Date());
	return parts.some((p) => p.type === 'dayPeriod');
}

function toJsDate(d: Temporal.PlainDate | Temporal.PlainDateTime): Date {
	if (d instanceof Temporal.PlainDateTime)
		return new Date(d.year, d.month - 1, d.day, d.hour, d.minute, d.second);
	return new Date(d.year, d.month - 1, d.day);
}
