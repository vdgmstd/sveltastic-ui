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

/** Fixed-width date-format token. `D` / `M` / `YY` are deliberately absent — variable widths break complete-match typing. */
export type DateFormatToken = 'YYYY' | 'MM' | 'DD';

/** A validated date format: the source pattern, its token order, and the two literal separators between the tokens. */
export type DateFormat = {
	pattern: string;
	order: readonly [DateFormatToken, DateFormatToken, DateFormatToken];
	separators: readonly [string, string];
};

/** The kit default — plain ISO. Also the fallback for an unset or malformed format pattern. */
export const ISO_DATE_FORMAT: DateFormat = {
	pattern: 'YYYY-MM-DD',
	order: ['YYYY', 'MM', 'DD'],
	separators: ['-', '-']
};

const DATE_FORMAT_SEPARATORS = new Set(['-', '.', '/', ' ']);
const DATE_FORMAT_WIDTH: Record<DateFormatToken, number> = { YYYY: 4, MM: 2, DD: 2 };
const DATE_FORMAT_LENIENT: Record<DateFormatToken, string> = {
	YYYY: '(\\d{4})',
	MM: '(\\d{1,2})',
	DD: '(\\d{1,2})'
};
const LENIENT_TIME_SOURCE = '(\\d{1,2}:\\d{1,2}(?::\\d{1,2})?(?:\\s*[AaPp][Mm])?)';

function escapeRegExp(s: string): string {
	return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Validate a date-format pattern — a permutation of exactly one `YYYY`, one `MM` and one `DD`,
 * joined by single `-`, `.`, `/` or space separators. Returns `null` for anything else; never throws.
 */
export function parseDateFormat(pattern: string): DateFormat | null {
	if (!pattern) return null;
	const order: DateFormatToken[] = [];
	const separators: string[] = [];
	let i = 0;
	while (i < pattern.length) {
		if (order.length === 3) return null;
		const token: DateFormatToken | null = pattern.startsWith('YYYY', i)
			? 'YYYY'
			: pattern.startsWith('MM', i)
				? 'MM'
				: pattern.startsWith('DD', i)
					? 'DD'
					: null;
		if (token === null || order.includes(token)) return null;
		order.push(token);
		i += DATE_FORMAT_WIDTH[token];
		if (i >= pattern.length) break;
		if (!DATE_FORMAT_SEPARATORS.has(pattern[i])) return null;
		separators.push(pattern[i]);
		i += 1;
	}
	if (order.length !== 3 || separators.length !== 2) return null;
	return {
		pattern,
		order: [order[0], order[1], order[2]],
		separators: [separators[0], separators[1]]
	};
}

/** Outside ISO's four-digit year range, where only the signed six-digit expanded form can represent the year. */
function isExpandedYear(year: number): boolean {
	return year < 0 || year > 9999;
}

/** Year as ISO 8601 renders it — four digits inside 0…9999, the signed six-digit expanded form outside. */
function isoYearSegment(year: number): string {
	if (!isExpandedYear(year)) return String(year).padStart(4, '0');
	return (year < 0 ? '-' : '+') + String(Math.abs(year)).padStart(6, '0');
}

/**
 * Render a date in the format's token order, every segment padded to its fixed width.
 * ISO keeps an expanded year (outside 0…9999) in its signed six-digit form; any other format renders the
 * empty string, because the seven characters cannot survive the four-digit `YYYY` slot — the mask would
 * reshape them into a different, plausible date that then commits over the value.
 */
export function formatDateByPattern(date: Temporal.PlainDate, format: DateFormat): string {
	if (isExpandedYear(date.year) && format.pattern !== ISO_DATE_FORMAT.pattern) return '';
	const segment = (token: DateFormatToken): string =>
		token === 'YYYY' ? isoYearSegment(date.year) : pad(token === 'MM' ? date.month : date.day);
	const [a, b, c] = format.order;
	return segment(a) + format.separators[0] + segment(b) + format.separators[1] + segment(c);
}

/** `maska` pattern matching the format's fixed widths — e.g. `'##-##-####'` for `DD-MM-YYYY`. */
export function dateFormatMask(format: DateFormat): string {
	const [a, b, c] = format.order;
	const slot = (token: DateFormatToken): string => '#'.repeat(DATE_FORMAT_WIDTH[token]);
	return slot(a) + format.separators[0] + slot(b) + format.separators[1] + slot(c);
}

/** Unanchored regex source matching a fully-typed date in this format — each segment at its exact width. */
export function dateFormatCompleteSource(format: DateFormat): string {
	const [a, b, c] = format.order;
	const segment = (token: DateFormatToken): string => `\\d{${DATE_FORMAT_WIDTH[token]}}`;
	return (
		segment(a) +
		escapeRegExp(format.separators[0]) +
		segment(b) +
		escapeRegExp(format.separators[1]) +
		segment(c)
	);
}

/** Unanchored regex source with three capture groups in token order — day/month 1–2 digits, year always 4. */
function dateFormatLenientSource(format: DateFormat): string {
	const [a, b, c] = format.order;
	return (
		DATE_FORMAT_LENIENT[a] +
		escapeRegExp(format.separators[0]) +
		DATE_FORMAT_LENIENT[b] +
		escapeRegExp(format.separators[1]) +
		DATE_FORMAT_LENIENT[c]
	);
}

function dateFieldsFromGroups(
	format: DateFormat,
	groups: RegExpMatchArray
): Record<DateFormatToken, number> {
	const fields: Record<DateFormatToken, number> = { YYYY: 0, MM: 0, DD: 0 };
	format.order.forEach((token, i) => {
		fields[token] = parseInt(groups[i + 1], 10);
	});
	return fields;
}

/**
 * Parse date text written in `format` — day/month may be 1–2 digits, the year is always 4.
 * `null` when it does not match, and `overflow: 'reject'` keeps an out-of-range field (month 25,
 * 31 February) from silently committing a constrained date the user never typed.
 */
export function parseDateByPattern(text: string, format: DateFormat): Temporal.PlainDate | null {
	const trimmed = (text ?? '').trim();
	if (!trimmed) return null;
	const m = trimmed.match(new RegExp(`^${dateFormatLenientSource(format)}$`));
	if (!m) return null;
	const f = dateFieldsFromGroups(format, m);
	try {
		return Temporal.PlainDate.from(
			{ year: f.YYYY, month: f.MM, day: f.DD },
			{ overflow: 'reject' }
		);
	} catch {
		return null;
	}
}

/** Parse `<date in format><T or space><HH:MM[:SS][ am/pm]>` text. Same leniency and rejection rules as `parseDateByPattern`. */
export function parseDateTimeByPattern(
	text: string,
	format: DateFormat
): Temporal.PlainDateTime | null {
	const trimmed = (text ?? '').trim();
	if (!trimmed) return null;
	const m = trimmed.match(
		new RegExp(`^${dateFormatLenientSource(format)}[T\\s]${LENIENT_TIME_SOURCE}$`)
	);
	if (!m) return null;
	const f = dateFieldsFromGroups(format, m);
	const t = parseTimeParts(m[4]);
	if (!t) return null;
	try {
		return Temporal.PlainDateTime.from(
			{
				year: f.YYYY, month: f.MM, day: f.DD,
				hour: t.h, minute: t.m, second: t.s
			},
			{ overflow: 'reject' }
		);
	} catch {
		return null;
	}
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

/**
 * CLDR week data — the regions whose week does not start on Monday (the CLDR `001` default), transcribed from
 * ICU 76 / CLDR 46. Mirroring what `getWeekInfo()` reports is what keeps the two paths below from answering
 * differently for the same locale (an SSR-renders-on-Node / hydrates-on-old-browser mismatch).
 */
const SUNDAY_FIRST_REGIONS = new Set([
	'AG', 'AS', 'BD', 'BR', 'BS', 'BT', 'BW', 'BZ', 'CA', 'CO', 'DM', 'DO',
	'ET', 'GT', 'GU', 'HK', 'HN', 'ID', 'IL', 'IN', 'IS', 'JM', 'JP', 'KE',
	'KH', 'KR', 'LA', 'MH', 'MM', 'MO', 'MT', 'MX', 'MZ', 'NI', 'NP', 'PA',
	'PE', 'PH', 'PK', 'PR', 'PT', 'PY', 'SA', 'SG', 'SV', 'TH', 'TT', 'TW',
	'UM', 'US', 'VE', 'VI', 'WS', 'YE', 'ZA', 'ZW'
]);
const SATURDAY_FIRST_REGIONS = new Set([
	'AF', 'BH', 'DJ', 'DZ', 'EG', 'IQ', 'IR', 'JO', 'KW', 'LY', 'OM', 'QA', 'SD', 'SY'
]);
const FRIDAY_FIRST_REGIONS = new Set(['MV']);

/** `Intl.Locale.getWeekInfo` is ES2024 — absent from the ES2022 lib types this package compiles against. */
type LocaleWithWeekInfo = Intl.Locale & { getWeekInfo?: () => { firstDay: number } };

/** The locale's first weekday — 0 (Sunday) … 6 (Saturday). Useful as a default for `weekStart`. */
export function localeWeekStart(locale: string): WeekStart {
	try {
		const resolved = new Intl.Locale(locale);
		const firstDay = (resolved as LocaleWithWeekInfo).getWeekInfo?.().firstDay;
		// getWeekInfo reports ISO day numbers (1 = Monday … 7 = Sunday); WeekStart is 0 = Sunday.
		if (firstDay !== undefined && firstDay >= 1 && firstDay <= 7) return (firstDay % 7) as WeekStart;
		// Region-less tags ('ru', 'de') carry no region until maximized — without it every such locale reads as US.
		const region = resolved.maximize().region ?? 'US';
		if (SUNDAY_FIRST_REGIONS.has(region)) return 0;
		if (SATURDAY_FIRST_REGIONS.has(region)) return 6;
		if (FRIDAY_FIRST_REGIONS.has(region)) return 5;
		return 1;
	} catch {
		return 1;
	}
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
