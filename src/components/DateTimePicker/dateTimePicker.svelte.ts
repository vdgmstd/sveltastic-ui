import { untrack } from 'svelte';
import { Temporal } from '@js-temporal/polyfill';
import type { Color } from '../../types';
import type { MaskOptions } from '../../actions/mask';
import type { WeekStart } from '../../utils/date';
import { rgbTriplet } from '../../utils/color';
import { boolAttr, dataState } from '../../utils/attrs';
import {
	type TimeParts,
	type DateLike,
	type DateFormat,
	ISO_DATE_FORMAT,
	parseDateFormat,
	formatDateByPattern,
	dateFormatMask,
	dateFormatCompleteSource,
	parseDateByPattern,
	parseDateTimeByPattern,
	parseTimeParts,
	timePartsToISO,
	formatTimeParts,
	toPlainDate,
	toPlainDateTime,
	plainDateToISO,
	plainDateTimeToISO
} from '../../utils/date';
import { devWarn } from '../../utils/dom';
import type { DateTimePickerType, DateTimePickerCommitMode } from './DateTimePicker.svelte';

const ZERO_TIME: TimeParts = { h: 0, m: 0, s: 0 };
const INPUT_SYNC_MS = 500;

/** Reactive inputs the root state reads — getters keep them live across the prop boundary. */
export type DateTimePickerConfig = {
	getValue: () => string;
	setValueProp: (v: string) => void;
	getOpen: () => boolean;
	setOpenProp: (v: boolean) => void;
	readonly type: DateTimePickerType;
	readonly commitMode: DateTimePickerCommitMode;
	readonly showSeconds: boolean;
	readonly hour12: boolean;
	readonly mask: MaskOptions | undefined;
	readonly format: string | undefined;
	readonly placeholder: string | undefined;
	readonly label: string | undefined;
	readonly ariaLabel: string | undefined;
	readonly color: Color;
	readonly disabled: boolean;
	readonly readonly: boolean;
	readonly locale: string | undefined;
	readonly weekStart: WeekStart | undefined;
	readonly min: DateLike | undefined;
	readonly max: DateLike | undefined;
	onValueChange?: (value: string) => void;
	onOpenChange?: (open: boolean) => void;
};

const PERIOD_TOKENS = {
	'@': { pattern: /[AaPpMm]/, transform: (c: string) => c.toUpperCase() }
} as const;

/**
 * Parse date text in `format` (defaults to ISO — the shape `value` always carries).
 * The generic Temporal fallback is reserved for ISO: under a custom token order it would silently
 * re-read `1992-12-25` as if the consumer's format did not apply.
 */
function parseDateText(text: string, format: DateFormat = ISO_DATE_FORMAT): Temporal.PlainDate | null {
	const trimmed = (text ?? '').trim();
	if (!trimmed) return null;
	const parsed = parseDateByPattern(trimmed, format);
	if (parsed) return parsed;
	return format.pattern === ISO_DATE_FORMAT.pattern ? toPlainDate(trimmed) : null;
}

function parseDateTimeText(
	text: string,
	format: DateFormat = ISO_DATE_FORMAT
): Temporal.PlainDateTime | null {
	const trimmed = (text ?? '').trim();
	if (!trimmed) return null;
	const parsed = parseDateTimeByPattern(trimmed, format);
	if (parsed) return parsed;
	return format.pattern === ISO_DATE_FORMAT.pattern ? toPlainDateTime(trimmed) : null;
}

/** The single literal pattern behind a mask option — `null` for function masks and multi-alternative arrays. */
function maskPattern(opts: MaskOptions): string | null {
	const raw = typeof opts === 'string' || Array.isArray(opts) ? opts : opts.mask;
	if (typeof raw === 'string') return raw;
	if (Array.isArray(raw)) return raw.length === 1 ? (raw[0] ?? null) : null;
	return null;
}

/** Shared DateTimePicker state: value/open proxied to the bindable props, parse/format deriveds, the field-text debounce, managed focus, and per-part attribute bags. */
export class DateTimePickerRootState {
	#cfg: DateTimePickerConfig;

	/** Time held while a `datetime` value has no date yet (so the wheels stay set). */
	pendingTime = $state<TimeParts>({ h: 0, m: 0, s: 0 });
	/** Text shown in the trigger field — debounced while open, synced immediately when closed. */
	inputValue = $state('');
	#syncTimer: number | undefined;
	#lastSync = 0;
	/** True when the last value change came from typing in the field (vs a panel pick) — gates the input reflection. */
	#fieldDriven = false;
	#lastFormatPattern: string | undefined;

	readonly fieldId: string;
	fieldEl = $state<HTMLInputElement | null>(null);
	shellEl = $state<HTMLElement | null>(null);
	#wasOpen = false;
	#restoringFocus = false;

	constructor(cfg: DateTimePickerConfig, fieldId: string) {
		this.#cfg = cfg;
		this.fieldId = fieldId;
	}

	get type(): DateTimePickerType { return this.#cfg.type; }
	get isTime(): boolean { return this.#cfg.type === 'time'; }
	get isDate(): boolean { return this.#cfg.type === 'date'; }
	get isDateTime(): boolean { return this.#cfg.type === 'datetime'; }

	get value(): string { return this.#cfg.getValue(); }
	get open(): boolean { return this.#cfg.getOpen(); }
	get disabled(): boolean { return this.#cfg.disabled; }
	get readonly(): boolean { return this.#cfg.readonly; }
	get color(): Color { return this.#cfg.color; }
	get showSeconds(): boolean { return this.#cfg.showSeconds; }
	get hour12(): boolean { return this.#cfg.hour12; }
	get locale(): string | undefined { return this.#cfg.locale; }
	get weekStart(): WeekStart | undefined { return this.#cfg.weekStart; }
	get min(): DateLike | undefined { return this.#cfg.min; }
	get max(): DateLike | undefined { return this.#cfg.max; }

	get triplet(): string { return rgbTriplet(this.#cfg.color); }

	/** The validated entry/display format. Falls back to ISO when `format` is unset, malformed, or the type is `time`. */
	readonly dateFormat = $derived.by<DateFormat>(() => {
		const raw = this.#cfg.format;
		if (raw === undefined || this.isTime) return ISO_DATE_FORMAT;
		return parseDateFormat(raw) ?? ISO_DATE_FORMAT;
	});

	get fallbackName(): string {
		return this.isTime ? 'Time' : this.isDate ? 'Date' : 'Date and time';
	}
	get resolvedAriaLabel(): string | undefined {
		return this.#cfg.label ? undefined : this.#cfg.ariaLabel ?? this.fallbackName;
	}
	get dialogAriaLabel(): string {
		return this.#cfg.label ?? this.#cfg.ariaLabel ?? this.fallbackName;
	}

	setValue(next: string): void {
		if (this.readonly) return;
		// Default: change is panel/programmatic-driven; handleInputText re-flags it as field-driven after.
		this.#fieldDriven = false;
		if (next === this.value) return;
		this.#cfg.setValueProp(next);
		this.#cfg.onValueChange?.(next);
	}
	setOpen(next: boolean): void {
		if (this.open === next) return;
		this.#cfg.setOpenProp(next);
	}

	get minDate(): Temporal.PlainDate | null { return toPlainDate(this.#cfg.min); }
	get maxDate(): Temporal.PlainDate | null { return toPlainDate(this.#cfg.max); }

	#inBound(d: Temporal.PlainDate): boolean {
		if (this.minDate && Temporal.PlainDate.compare(d, this.minDate) < 0) return false;
		if (this.maxDate && Temporal.PlainDate.compare(d, this.maxDate) > 0) return false;
		return true;
	}

	#dateTimePartsFromValue(v: string): { date: Temporal.PlainDate | null; time: TimeParts } {
		const dt = parseDateTimeText(v);
		if (dt) return { date: dt.toPlainDate(), time: { h: dt.hour, m: dt.minute, s: dt.second } };
		return { date: toPlainDate(v), time: ZERO_TIME };
	}

	readonly parsedTime = $derived.by<TimeParts>(() => {
		if (this.isTime) return parseTimeParts(this.value) ?? ZERO_TIME;
		if (this.isDateTime) {
			const parts = this.#dateTimePartsFromValue(this.value);
			return parts.date ? parts.time : this.pendingTime;
		}
		return ZERO_TIME;
	});

	readonly parsedDate = $derived.by<Temporal.PlainDate | null>(() => {
		if (this.isDate) return parseDateText(this.value);
		if (this.isDateTime) return this.#dateTimePartsFromValue(this.value).date;
		return null;
	});

	readonly calendarValue = $derived(this.parsedDate ? plainDateToISO(this.parsedDate) : '');

	readonly hasValue = $derived.by(() => {
		if (this.isTime) return !!this.value && parseTimeParts(this.value) !== null;
		if (this.isDate) return !!this.parsedDate;
		if (this.isDateTime) return !!this.#dateTimePartsFromValue(this.value).date;
		return false;
	});

	readonly display = $derived.by(() => {
		if (!this.hasValue) return '';
		const showSeconds = this.#cfg.showSeconds;
		const hour12 = this.#cfg.hour12;
		if (this.isTime) return formatTimeParts(this.parsedTime, { withSeconds: showSeconds, hour12 });
		if (this.isDate)
			return this.parsedDate ? formatDateByPattern(this.parsedDate, this.dateFormat) : '';
		const parts = this.#dateTimePartsFromValue(this.value);
		if (!parts.date) return '';
		const date = formatDateByPattern(parts.date, this.dateFormat);
		if (!date) return '';
		return `${date} ${formatTimeParts(parts.time, { withSeconds: showSeconds, hour12 })}`;
	});

	/** Mask implied by `type`, `format`, `showSeconds` and `hour12`. An explicit `mask` prop replaces it wholesale. */
	readonly #derivedMask = $derived.by<MaskOptions>(() => {
		const showSeconds = this.#cfg.showSeconds;
		const hour12 = this.#cfg.hour12;
		if (this.isTime) {
			if (hour12)
				return showSeconds
					? { mask: '##:##:## @@', tokens: PERIOD_TOKENS }
					: { mask: '##:## @@', tokens: PERIOD_TOKENS };
			return showSeconds ? '##:##:##' : '##:##';
		}
		if (this.isDate) return dateFormatMask(this.dateFormat);
		const timePart = hour12
			? (showSeconds ? '##:##:## @@' : '##:## @@')
			: (showSeconds ? '##:##:##' : '##:##');
		const pattern = `${dateFormatMask(this.dateFormat)} ${timePart}`;
		return hour12 ? { mask: pattern, tokens: PERIOD_TOKENS } : pattern;
	});

	readonly resolvedMask = $derived.by<MaskOptions | undefined>(() =>
		this.#cfg.mask !== undefined ? this.#cfg.mask : this.#derivedMask
	);

	/**
	 * Fixed-width shape of a fully-typed entry. The live-typing path commits only on an exact match,
	 * so half-typed text (`1992-12-2`) can never parse as a complete date and get padded back into the mask.
	 */
	readonly #completePattern = $derived.by<RegExp>(() => {
		const date = dateFormatCompleteSource(this.dateFormat);
		if (this.isDate) return new RegExp(`^${date}$`);
		const seconds = this.#cfg.showSeconds ? ':\\d{2}' : '';
		const period = this.#cfg.hour12 ? ' [AP]M' : '';
		const time = `\\d{2}:\\d{2}${seconds}${period}`;
		if (this.isTime) return new RegExp(`^${time}$`);
		return new RegExp(`^${date}[T ]${time}$`);
	});

	/** Letter template for the time half — same width as its mask, so it can stand in as a ghost. */
	readonly #timeTemplate = $derived.by(() =>
		this.#cfg.hour12
			? this.#cfg.showSeconds ? 'HH:MM:SS AM' : 'HH:MM AM'
			: this.#cfg.showSeconds ? 'HH:MM:SS' : 'HH:MM'
	);

	readonly placeholderText = $derived.by(() => {
		if (this.#cfg.placeholder !== undefined) return this.#cfg.placeholder;
		if (this.isTime) return this.#timeTemplate;
		if (this.isDate) return this.dateFormat.pattern;
		return `${this.dateFormat.pattern} ${this.#timeTemplate}`;
	});

	/**
	 * Ghost template spelling out the token order, for a picker whose consumer chose the order explicitly.
	 * `undefined` unless `format` was passed, so a format-less field keeps the mask-derived zeros.
	 * Its length equals the derived mask's by construction — every token is the same width as its slots.
	 */
	readonly maskHintText = $derived.by<string | undefined>(() => {
		if (this.#cfg.format === undefined || this.isTime) return undefined;
		if (this.isDate) return this.dateFormat.pattern;
		return `${this.dateFormat.pattern} ${this.#timeTemplate}`;
	});

	/**
	 * Dev-only diagnostics for `format` — ignored on `type="time"`, malformed patterns fall back to ISO,
	 * and an explicit `mask` contradicting `format` can never commit. Call from an `$effect`.
	 */
	syncFormatWarning(): void {
		const raw = this.#cfg.format;
		if (raw === undefined) return;
		if (this.isTime) {
			devWarn(`DateTimePicker: "format" is ignored for type="time" (got ${JSON.stringify(raw)}).`);
			return;
		}
		if (parseDateFormat(raw) === null) {
			devWarn(
				`DateTimePicker: invalid "format" ${JSON.stringify(raw)} — expected one YYYY, one MM and one DD ` +
					`joined by single "-", ".", "/" or space separators. Falling back to "${ISO_DATE_FORMAT.pattern}".`
			);
		}
		const explicit = this.#cfg.mask;
		if (explicit === undefined) return;
		const typed = maskPattern(explicit);
		const expected = maskPattern(this.#derivedMask);
		if (typed !== null && expected !== null && typed !== expected) {
			devWarn(
				`DateTimePicker: "mask" ${JSON.stringify(typed)} contradicts "format" ${JSON.stringify(raw)} ` +
					`(which needs ${JSON.stringify(expected)}) — text shaped by the mask can never parse in the format, ` +
					`so the field never commits. "mask" and "format" are mutually exclusive.`
			);
		}
	}

	/** Mirror `pendingTime` from the value when a `datetime` value carries a date. */
	syncPendingTime(): void {
		if (!this.isDateTime) return;
		const parts = this.#dateTimePartsFromValue(this.value);
		if (!parts.date) return;
		const next = parts.time;
		untrack(() => {
			if (this.pendingTime.h !== next.h || this.pendingTime.m !== next.m || this.pendingTime.s !== next.s) {
				this.pendingTime = next;
			}
		});
	}

	/**
	 * True while the user's own keystrokes own the field text. Reflecting `display` then resets the caret
	 * and leaves the mask holding a full buffer, which swallows the next keypress.
	 * Panel picks clear `#fieldDriven`, so they always reflect even though the field keeps focus.
	 */
	#isFieldTyping(): boolean {
		return this.#fieldDriven && !!this.fieldEl && document.activeElement === this.fieldEl;
	}

	/** Reflect `display` into the field: instant while closed, debounced while open. */
	syncInput(): void {
		// Read every dependency before any early return so the calling effect keeps tracking them.
		const target = this.display;
		const isOpen = this.open;
		const pattern = this.dateFormat.pattern;
		// A format switch strands the text the user owns in the previous order, under a mask that already changed.
		if (pattern !== this.#lastFormatPattern) {
			this.#lastFormatPattern = pattern;
			this.#fieldDriven = false;
		}
		if (this.#isFieldTyping()) return;
		if (!isOpen) {
			this.#clearSyncTimer();
			untrack(() => {
				this.inputValue = target;
				this.#lastSync = performance.now();
			});
			return;
		}
		const now = performance.now();
		const elapsed = now - this.#lastSync;
		if (elapsed >= INPUT_SYNC_MS) {
			untrack(() => {
				this.inputValue = target;
				this.#lastSync = now;
			});
		} else if (this.#syncTimer === undefined) {
			this.#syncTimer = window.setTimeout(() => {
				this.#syncTimer = undefined;
				if (this.#isFieldTyping()) return;
				this.inputValue = this.display;
				this.#lastSync = performance.now();
			}, INPUT_SYNC_MS - elapsed);
		}
	}

	#clearSyncTimer(): void {
		if (this.#syncTimer === undefined) return;
		window.clearTimeout(this.#syncTimer);
		this.#syncTimer = undefined;
	}

	/** Return focus to the field when the panel closes while focus is inside it. */
	syncFocusReturn(): void {
		if (this.open === this.#wasOpen) return;
		if (!this.open) {
			const active = document.activeElement;
			if (!active || active === document.body || (this.shellEl?.contains(active) ?? false)) {
				this.#restoringFocus = true;
				this.fieldEl?.focus({ preventScroll: true });
				this.#restoringFocus = false;
			}
		}
		this.#wasOpen = this.open;
		this.#cfg.onOpenChange?.(this.open);
	}

	focusGrid(): void {
		const target =
			this.shellEl?.querySelector<HTMLElement>('[tabindex="0"]') ??
			this.shellEl?.querySelector<HTMLElement>('button:not([disabled]),[role="option"]');
		target?.focus({ preventScroll: true });
	}

	destroy(): void {
		this.#clearSyncTimer();
	}

	emitTime = (p: TimeParts): void => {
		this.setValue(timePartsToISO(p, this.#cfg.showSeconds));
	};

	emitDate = (d: Temporal.PlainDate | null, closePanel = true): void => {
		this.setValue(d ? plainDateToISO(d) : '');
		if (d && closePanel) this.setOpen(false);
	};

	emitDateTime = (d: Temporal.PlainDate | null, t: TimeParts): void => {
		this.pendingTime = t;
		if (!d) {
			if (this.value !== '') this.setValue('');
			return;
		}
		const dt = Temporal.PlainDateTime.from({
			year: d.year, month: d.month, day: d.day,
			hour: t.h, minute: t.m, second: t.s
		});
		this.setValue(plainDateTimeToISO(dt, this.#cfg.showSeconds));
	};

	emitDateText = (next: string): void => {
		this.emitDate(parseDateText(next));
	};

	emitDateTimeText = (date: string, time: TimeParts): void => {
		this.emitDateTime(parseDateText(date), time);
	};

	/**
	 * Commit the current field text with the lenient parser (blur / Enter / paste-then-leave), then re-render it canonically.
	 * The leniency is position-dependent by design: a trailing `MM`/`DD` may still be one digit, so a truncated
	 * `1992-12-2` commits as `1992-12-02` under `YYYY-MM-DD`, while the same truncation under `DD-MM-YYYY`
	 * (`25-12-199`) leaves the year short, commits nothing, and the field resets to the last committed value.
	 */
	commitInput(): void {
		if (this.isTime) {
			const t = parseTimeParts(this.inputValue);
			if (t) this.emitTime(t);
		} else if (this.isDate) {
			const d = parseDateText(this.inputValue, this.dateFormat);
			if (d && this.#inBound(d)) this.emitDate(d);
		} else {
			const dt = parseDateTimeText(this.inputValue, this.dateFormat);
			if (dt && this.#inBound(dt.toPlainDate()))
				this.emitDateTime(dt.toPlainDate(), { h: dt.hour, m: dt.minute, s: dt.second });
		}
		this.#fieldDriven = false;
		this.inputValue = this.display;
	}

	/** Live parse on every keystroke — commits only a complete fixed-width entry, and only under `commitMode: 'input'`. */
	handleInputText(v: string): void {
		this.inputValue = v;
		if (this.#cfg.commitMode === 'input' && this.#completePattern.test(v.trim())) {
			if (this.isTime) {
				const t = parseTimeParts(v);
				if (t) this.emitTime(t);
			} else if (this.isDate) {
				const d = parseDateText(v, this.dateFormat);
				if (d && this.#inBound(d)) this.emitDate(d, false);
			} else {
				const dt = parseDateTimeText(v, this.dateFormat);
				if (dt && this.#inBound(dt.toPlainDate()))
					this.emitDateTime(dt.toPlainDate(), { h: dt.hour, m: dt.minute, s: dt.second });
			}
		}
		// Mark field-driven AFTER the emit (which routes through setValue and clears the flag).
		this.#fieldDriven = true;
	}

	handleFieldKeydown(e: KeyboardEvent): void {
		if (e.key === 'Enter') {
			this.commitInput();
			(e.currentTarget as HTMLInputElement).blur();
		} else if (e.key === 'Escape') {
			this.#fieldDriven = false;
			this.inputValue = this.display;
		} else if (e.key === 'ArrowDown') {
			e.preventDefault();
			if (!this.open) this.setOpen(true);
			requestAnimationFrame(() => this.focusGrid());
		}
	}

	handleFieldFocus = (e: FocusEvent): void => {
		this.fieldEl = e.currentTarget as HTMLInputElement;
		if (this.#restoringFocus) return;
		if (this.disabled || this.readonly) return;
		this.setOpen(true);
	};

	readonly fieldProps = $derived({
		'aria-haspopup': 'dialog' as const,
		'aria-expanded': this.open,
		'aria-label': this.resolvedAriaLabel,
		'data-state': dataState(this.open ? 'open' : 'closed'),
		'data-disabled': boolAttr(this.disabled),
		'data-readonly': boolAttr(this.readonly)
	});

	readonly contentProps = $derived({
		'data-state': dataState(this.open ? 'open' : 'closed'),
		'data-type': this.type
	});
}
