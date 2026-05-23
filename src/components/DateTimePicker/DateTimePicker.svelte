<script lang="ts" module>
	import type { Snippet, Component } from 'svelte';
	import type { Color } from '../../types';
	import type { DateLike, WeekStart } from '../../utils/date';
	import type { MaskOptions } from '../../actions/mask';
	import type { InputLabelStyle } from '../Input/Input.svelte';
	import type { PopoverPlacement } from '../../primitives/Popover.svelte';

	export type DateTimePickerType = 'time' | 'date' | 'datetime';

	export type DateTimePickerProps = {
		/** What kind of value the picker captures. */
		type?: DateTimePickerType;
		/** Bound value for `'time'` (`HH:MM[:SS]`), `'date'` (`YYYY-MM-DD`), `'datetime'` (`YYYY-MM-DDTHH:MM[:SS]`). */
		value?: string;
		/** Bindable open state of the dropdown. */
		open?: boolean;
		/** Close the dropdown when the user clicks outside. */
		closeOnClickOutside?: boolean;
		/** Show the seconds wheel + segment (time-bearing types). */
		showSeconds?: boolean;
		/** Render the AM/PM toggle and display in 12-hour mode. The bound value remains 24-hour ISO. */
		hour12?: boolean;
		/** Calendar locale (date-bearing types). Defaults to `'en-US'`. */
		locale?: string;
		/** First day of the week (date-bearing types). Defaults to the locale's convention. */
		weekStart?: WeekStart;
		/** Lower bound (date-bearing types, inclusive). */
		min?: DateLike;
		/** Upper bound (date-bearing types, inclusive). */
		max?: DateLike;
		/** Standard disabled. */
		disabled?: boolean;
		/** Read-only — input + panel both inert. */
		readonly?: boolean;
		/** Palette accent. */
		color?: Color;
		/** Placeholder for the trigger input. */
		placeholder?: string;
		/** Field label. */
		label?: string;
		/** Label placement / behaviour, matches `Input` (`'default' | 'placeholder' | 'inline'`). */
		labelStyle?: InputLabelStyle;
		/** Stretch the trigger to its container. */
		block?: boolean;
		/** Dropdown placement relative to the trigger. */
		placement?: PopoverPlacement;
		/** Side of the field where the icon sits. Defaults to `'after'`. */
		iconPosition?: 'before' | 'after';
		/** Override the input mask. Defaults are derived from `type`, `showSeconds`, and `hour12`. */
		mask?: MaskOptions;
		/** Custom icon glyph snippet. Falls back to a clock (time) or calendar (date / datetime). */
		icon?: Snippet;
		/** Fires on every committed value change. */
		onchange?: (value: string) => void;
		/** Fires when the dropdown open state changes. */
		onopenchange?: (open: boolean) => void;
		/** Class merged onto the trigger wrapper. */
		class?: string;
		/** Inline style merged onto the trigger wrapper. */
		style?: string;
	};
</script>

<script lang="ts">
	import { untrack } from 'svelte';
	import { CalendarBlankIcon, ClockIcon } from 'phosphor-svelte';
	import { Temporal } from '@js-temporal/polyfill';
	import { rgbTriplet } from '../../utils/color';
	import {
		toPlainDate,
		toPlainDateTime,
		plainDateToISO,
		plainDateTimeToISO
	} from '../../utils/date';
	import Input from '../Input/Input.svelte';
	import Popover from '../../primitives/Popover.svelte';
	import type { TimeParts } from './panels/types';

	function preserveFocus(node: HTMLElement) {
		const handler = (e: MouseEvent) => e.preventDefault();
		node.addEventListener('mousedown', handler);
		return { destroy: () => node.removeEventListener('mousedown', handler) };
	}

	let {
		type = 'time',
		value = $bindable(''),
		open = $bindable(false),
		closeOnClickOutside = true,
		showSeconds = false,
		hour12 = false,
		locale,
		weekStart,
		min,
		max,
		disabled = false,
		readonly = false,
		color = 'primary',
		placeholder,
		label,
		labelStyle,
		block = false,
		placement = 'bottom-start',
		iconPosition = 'after',
		mask,
		icon,
		onchange,
		onopenchange,
		class: className,
		style: userStyle
	}: DateTimePickerProps = $props();

	let triplet = $derived(rgbTriplet(color));

	let isTime = $derived(type === 'time');
	let isDate = $derived(type === 'date');
	let isDateTime = $derived(type === 'datetime');

	function pad(n: number): string {
		return String(n).padStart(2, '0');
	}

	const ZERO_TIME: TimeParts = { h: 0, m: 0, s: 0 };

	function parseTime(text: string): TimeParts | null {
		const trimmed = (text ?? '').trim();
		if (!trimmed) return null;
		const m = trimmed.match(/^(\d{1,2})(?:[:.\s](\d{1,2}))?(?:[:.\s](\d{1,2}))?\s*(am|pm)?$/i);
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

	function formatTimeISO(p: TimeParts): string {
		return showSeconds ? `${pad(p.h)}:${pad(p.m)}:${pad(p.s)}` : `${pad(p.h)}:${pad(p.m)}`;
	}

	function formatTimeDisplay(p: TimeParts): string {
		const sec = showSeconds ? `:${pad(p.s)}` : '';
		if (hour12) {
			const dh = p.h === 0 ? 12 : p.h > 12 ? p.h - 12 : p.h;
			const period = p.h >= 12 ? 'PM' : 'AM';
			return `${pad(dh)}:${pad(p.m)}${sec} ${period}`;
		}
		return `${pad(p.h)}:${pad(p.m)}${sec}`;
	}

	function formatDateTimeISOFromParts(date: Temporal.PlainDate, t: TimeParts): string {
		const dt = Temporal.PlainDateTime.from({
			year: date.year, month: date.month, day: date.day,
			hour: t.h, minute: t.m, second: t.s
		});
		return plainDateTimeToISO(dt, showSeconds);
	}

	function dateTimePartsFromValue(v: string): {
		date: Temporal.PlainDate | null;
		time: TimeParts;
	} {
		const dt = parseDateTimeText(v);
		if (dt) return { date: dt.toPlainDate(), time: { h: dt.hour, m: dt.minute, s: dt.second } };
		return { date: toPlainDate(v), time: ZERO_TIME };
	}

	let pendingTime = $state<TimeParts>({ h: 0, m: 0, s: 0 });

	$effect(() => {
		if (!isDateTime) return;
		const parts = dateTimePartsFromValue(value);
		if (!parts.date) return;
		const next = parts.time;
		untrack(() => {
			if (pendingTime.h !== next.h || pendingTime.m !== next.m || pendingTime.s !== next.s) {
				pendingTime = next;
			}
		});
	});

	let parsedTime = $derived.by<TimeParts>(() => {
		if (isTime) return parseTime(value) ?? ZERO_TIME;
		if (isDateTime) {
			const parts = dateTimePartsFromValue(value);
			return parts.date ? parts.time : pendingTime;
		}
		return ZERO_TIME;
	});
	let parsedDate = $derived(
		isDate ? parseDateText(value) : isDateTime ? dateTimePartsFromValue(value).date : null
	);
	let calendarValue = $derived(parsedDate ? plainDateToISO(parsedDate) : '');

	let hasValue = $derived.by(() => {
		if (isTime) return !!value && parseTime(value) !== null;
		if (isDate) return !!parsedDate;
		if (isDateTime) return !!dateTimePartsFromValue(value).date;
		return false;
	});

	let display = $derived.by(() => {
		if (!hasValue) return '';
		if (isTime) return formatTimeDisplay(parsedTime);
		if (isDate) return parsedDate ? plainDateToISO(parsedDate) : '';
		if (isDateTime) {
			const parts = dateTimePartsFromValue(value);
			if (!parts.date) return '';
			const date = `${parts.date.year}-${pad(parts.date.month)}-${pad(parts.date.day)}`;
			return `${date} ${formatTimeDisplay(parts.time)}`;
		}
		return '';
	});

	let resolvedMask = $derived.by<MaskOptions | undefined>(() => {
		if (mask !== undefined) return mask;
		const periodTokens = {
			'@': { pattern: /[AaPpMm]/, transform: (c: string) => c.toUpperCase() }
		};
		if (isTime) {
			if (hour12)
				return showSeconds
					? { mask: '##:##:## @@', tokens: periodTokens }
					: { mask: '##:## @@', tokens: periodTokens };
			return showSeconds ? '##:##:##' : '##:##';
		}
		if (isDate) return '####-##-##';
		if (isDateTime) {
			const timePart = hour12
				? (showSeconds ? '##:##:## @@' : '##:## @@')
				: (showSeconds ? '##:##:##' : '##:##');
			const pattern = `####-##-## ${timePart}`;
			return hour12 ? { mask: pattern, tokens: periodTokens } : pattern;
		}
		return undefined;
	});

	let defaultPlaceholder = $derived.by(() => {
		const datePart = 'YYYY-MM-DD';
		const timePart = hour12
			? showSeconds ? 'HH:MM:SS AM' : 'HH:MM AM'
			: showSeconds ? 'HH:MM:SS' : 'HH:MM';
		if (isTime) return timePart;
		if (isDate) return datePart;
		return `${datePart} ${timePart}`;
	});

	let inputValue = $state('');
	let lastSync = 0;
	let pendingTimer: number | undefined;

	$effect(() => {
		const target = display;
		if (!open) {
			if (pendingTimer !== undefined) {
				window.clearTimeout(pendingTimer);
				pendingTimer = undefined;
			}
			inputValue = target;
			lastSync = performance.now();
			return;
		}
		const now = performance.now();
		const elapsed = now - lastSync;
		if (elapsed >= 500) {
			inputValue = target;
			lastSync = now;
		} else if (pendingTimer === undefined) {
			pendingTimer = window.setTimeout(() => {
				pendingTimer = undefined;
				inputValue = display;
				lastSync = performance.now();
			}, 500 - elapsed);
		}
	});

	$effect(() => () => {
		if (pendingTimer !== undefined) {
			window.clearTimeout(pendingTimer);
			pendingTimer = undefined;
		}
	});

	let lastOpen = open;
	$effect(() => {
		if (open !== lastOpen) {
			lastOpen = open;
			onopenchange?.(open);
		}
	});

	function emitTime(p: TimeParts): void {
		const out = formatTimeISO(p);
		value = out;
		onchange?.(out);
	}
	function emitDate(d: Temporal.PlainDate | null): void {
		const out = d ? plainDateToISO(d) : '';
		value = out;
		onchange?.(out);
		if (d) open = false;
	}
	function emitDateTime(d: Temporal.PlainDate | null, t: TimeParts): void {
		pendingTime = t;
		if (!d) {
			if (value !== '') {
				value = '';
				onchange?.('');
			}
			return;
		}
		const out = formatDateTimeISOFromParts(d, t);
		value = out;
		onchange?.(out);
	}

	function commitInput(): void {
		if (isTime) {
			const t = parseTime(inputValue);
			if (t) emitTime(t);
			else inputValue = display;
			return;
		}
		if (isDate) {
			const d = parseDateText(inputValue);
			if (d) emitDate(d);
			else inputValue = display;
			return;
		}
		if (isDateTime) {
			const dt = parseDateTimeText(inputValue);
			if (dt) emitDateTime(dt.toPlainDate(), { h: dt.hour, m: dt.minute, s: dt.second });
			else inputValue = display;
		}
	}

	function handleInput(e: Event): void {
		const v = (e.currentTarget as HTMLInputElement).value;
		inputValue = v;
		if (isTime) {
			const t = parseTime(v);
			if (t) emitTime(t);
		} else if (isDate) {
			const d = parseDateText(v);
			if (d) emitDate(d);
		} else if (isDateTime) {
			const dt = parseDateTimeText(v);
			if (dt) emitDateTime(dt.toPlainDate(), { h: dt.hour, m: dt.minute, s: dt.second });
		}
	}

	function handleKeydown(e: KeyboardEvent): void {
		if (e.key === 'Enter') {
			commitInput();
			(e.currentTarget as HTMLInputElement).blur();
		} else if (e.key === 'Escape') {
			inputValue = display;
			(e.currentTarget as HTMLInputElement).blur();
		}
	}

	function onFieldFocus(): void {
		if (disabled || readonly) return;
		open = true;
	}
	function onFieldBlur(): void {
		commitInput();
	}

	const ariaLabel = $derived(
		isTime ? 'Time' : isDate ? 'Date' : 'Date and time'
	);

	type AnyComponent = Component<Record<string, unknown>, Record<string, unknown>>;
	type LoadedPanel = { default: AnyComponent };

	const panelLoaders = {
		time: () => import('./panels/TimePanel.svelte') as unknown as Promise<LoadedPanel>,
		date: () => import('./panels/DatePanel.svelte') as unknown as Promise<LoadedPanel>,
		datetime: () => import('./panels/DateTimePanel.svelte') as unknown as Promise<LoadedPanel>
	};

	let panelPromise = $derived(panelLoaders[type]());

	let panelProps = $derived.by<Record<string, unknown>>(() => {
		if (isTime)
			return {
				value: parsedTime,
				color, hour12, showSeconds, disabled,
				onchange: emitTime
			};
		if (isDate)
			return {
				value: calendarValue,
				color, locale, weekStart, min, max, disabled,
				onchange: (next: string) => emitDate(parseDateText(next))
			};
		return {
			value: calendarValue,
			time: parsedTime,
			color, hour12, showSeconds, locale, weekStart, min, max, disabled,
			onchange: (date: string, time: TimeParts) => emitDateTime(parseDateText(date), time)
		};
	});
</script>

<Popover
	bind:open
	triggerOn="manual"
	popupRole="dialog"
	autoFocus={false}
	{placement}
	closeOnSelect={false}
	closeOnEsc={closeOnClickOutside}
	{closeOnClickOutside}
	{block}
	class={className}
	style={userStyle}
>
	{#snippet trigger()}
		<Input
			type="text"
			value={inputValue}
			{label}
			{labelStyle}
			placeholder={placeholder ?? defaultPlaceholder}
			{color}
			iconColor={color}
			{disabled}
			{readonly}
			{block}
			icon={iconSnippet}
			{iconPosition}
			mask={resolvedMask}
			oninput={handleInput}
			onkeydown={handleKeydown}
			onfocus={onFieldFocus}
			onblur={onFieldBlur}
			aria-haspopup="dialog"
			aria-expanded={open}
			data-testid="datetime-picker"
		/>
	{/snippet}

	{#snippet children()}
		<div
			class="dtp-shell"
			style:--c={triplet}
			aria-label={ariaLabel}
			use:preserveFocus
		>
			{#await panelPromise}
				<div class="dtp-shell__loading" aria-hidden="true"></div>
			{:then mod}
				{@const Panel = mod.default}
				<Panel {...panelProps} />
			{/await}
		</div>
	{/snippet}
</Popover>

{#snippet iconSnippet()}
	<span class="dtp-icon" role="presentation" onmousedown={(e: MouseEvent) => e.preventDefault()}>
		{#if icon}
			{@render icon()}
		{:else if isTime}
			<ClockIcon size={18} weight="regular" />
		{:else}
			<CalendarBlankIcon size={18} weight="regular" />
		{/if}
	</span>
{/snippet}

<style>
	.dtp-shell {
		display: inline-flex;
		min-height: 64px;
		max-width: calc(100vw - 16px);
		padding: 12px;
		color: rgb(var(--text));
		box-sizing: border-box;
	}
	@media (max-width: 480px) {
		.dtp-shell { padding: 10px; }
	}
	.dtp-shell__loading {
		flex: 1 1 auto;
		min-height: 64px;
		opacity: 0.4;
		background: linear-gradient(90deg, transparent, rgb(var(--text) / 0.08), transparent);
		background-size: 200% 100%;
		animation: dtp-shimmer 1.2s linear infinite;
	}
	@keyframes dtp-shimmer {
		from { background-position: 200% 0; }
		to { background-position: -200% 0; }
	}
</style>
