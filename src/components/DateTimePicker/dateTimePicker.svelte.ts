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
	pad,
	parseTimeParts,
	timePartsToISO,
	formatTimeParts,
	toPlainDate,
	toPlainDateTime,
	plainDateToISO,
	plainDateTimeToISO
} from '../../utils/date';
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

function parseDateText(text: string): Temporal.PlainDate | null {
	const trimmed = (text ?? '').trim();
	if (!trimmed) return null;
	const m = trimmed.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
	if (!m) return toPlainDate(trimmed);
	try {
		return Temporal.PlainDate.from({ year: +m[1], month: +m[2], day: +m[3] });
	} catch {
		return null;
	}
}

function parseDateTimeText(text: string): Temporal.PlainDateTime | null {
	const trimmed = (text ?? '').trim();
	if (!trimmed) return null;
	const m = trimmed.match(/^(\d{4})-(\d{1,2})-(\d{1,2})[T\s](\d{1,2}):(\d{1,2})(?::(\d{1,2}))?$/);
	if (!m) return toPlainDateTime(trimmed);
	try {
		return Temporal.PlainDateTime.from({
			year: +m[1], month: +m[2], day: +m[3],
			hour: +m[4], minute: +m[5], second: m[6] ? +m[6] : 0
		});
	} catch {
		return null;
	}
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
		if (this.isDate) return this.parsedDate ? plainDateToISO(this.parsedDate) : '';
		const parts = this.#dateTimePartsFromValue(this.value);
		if (!parts.date) return '';
		const date = `${parts.date.year}-${pad(parts.date.month)}-${pad(parts.date.day)}`;
		return `${date} ${formatTimeParts(parts.time, { withSeconds: showSeconds, hour12 })}`;
	});

	readonly resolvedMask = $derived.by<MaskOptions | undefined>(() => {
		if (this.#cfg.mask !== undefined) return this.#cfg.mask;
		const showSeconds = this.#cfg.showSeconds;
		const hour12 = this.#cfg.hour12;
		if (this.isTime) {
			if (hour12)
				return showSeconds
					? { mask: '##:##:## @@', tokens: PERIOD_TOKENS }
					: { mask: '##:## @@', tokens: PERIOD_TOKENS };
			return showSeconds ? '##:##:##' : '##:##';
		}
		if (this.isDate) return '####-##-##';
		const timePart = hour12
			? (showSeconds ? '##:##:## @@' : '##:## @@')
			: (showSeconds ? '##:##:##' : '##:##');
		const pattern = `####-##-## ${timePart}`;
		return hour12 ? { mask: pattern, tokens: PERIOD_TOKENS } : pattern;
	});

	/**
	 * Fixed-width shape of a fully-typed entry. The live-typing path commits only on an exact match,
	 * so half-typed text (`1992-12-2`) can never parse as a complete date and get padded back into the mask.
	 */
	readonly #completePattern = $derived.by<RegExp>(() => {
		if (this.isDate) return /^\d{4}-\d{2}-\d{2}$/;
		const seconds = this.#cfg.showSeconds ? ':\\d{2}' : '';
		const period = this.#cfg.hour12 ? ' [AP]M' : '';
		const time = `\\d{2}:\\d{2}${seconds}${period}`;
		if (this.isTime) return new RegExp(`^${time}$`);
		return new RegExp(`^\\d{4}-\\d{2}-\\d{2}[T ]${time}$`);
	});

	readonly placeholderText = $derived.by(() => {
		if (this.#cfg.placeholder !== undefined) return this.#cfg.placeholder;
		const datePart = 'YYYY-MM-DD';
		const showSeconds = this.#cfg.showSeconds;
		const hour12 = this.#cfg.hour12;
		const timePart = hour12
			? showSeconds ? 'HH:MM:SS AM' : 'HH:MM AM'
			: showSeconds ? 'HH:MM:SS' : 'HH:MM';
		if (this.isTime) return timePart;
		if (this.isDate) return datePart;
		return `${datePart} ${timePart}`;
	});

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
		// Read both dependencies before any early return so the calling effect keeps tracking them.
		const target = this.display;
		const isOpen = this.open;
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

	/** Commit the current field text with the lenient parser (blur / Enter / paste-then-leave), then re-render it canonically. */
	commitInput(): void {
		if (this.isTime) {
			const t = parseTimeParts(this.inputValue);
			if (t) this.emitTime(t);
		} else if (this.isDate) {
			const d = parseDateText(this.inputValue);
			if (d && this.#inBound(d)) this.emitDate(d);
		} else {
			const dt = parseDateTimeText(this.inputValue);
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
				const d = parseDateText(v);
				if (d && this.#inBound(d)) this.emitDate(d, false);
			} else {
				const dt = parseDateTimeText(v);
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
