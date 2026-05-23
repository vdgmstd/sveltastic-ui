<script lang="ts" module>
	import type { Color } from '../../../types';
	import type { DateLike, WeekStart } from '../../../utils/date';
	import type { TimeParts } from './types';

	export type DateTimePanelProps = {
		/** ISO `YYYY-MM-DD` (or empty for none). */
		value: string;
		time: TimeParts;
		color?: Color;
		hour12?: boolean;
		showSeconds?: boolean;
		locale?: string;
		weekStart?: WeekStart;
		min?: DateLike;
		max?: DateLike;
		disabled?: boolean;
		onchange: (date: string, time: TimeParts) => void;
	};
</script>

<script lang="ts">
	import Calendar from '../../Calendar/Calendar.svelte';
	import TimePanel from './TimePanel.svelte';

	let {
		value,
		time,
		color = 'primary',
		hour12 = false,
		showSeconds = false,
		locale,
		weekStart,
		min,
		max,
		disabled = false,
		onchange
	}: DateTimePanelProps = $props();

	let calendarColor = $derived<'primary' | 'warning'>(color === 'warning' ? 'warning' : 'primary');

	function pad(n: number): string {
		return String(n).padStart(2, '0');
	}

	let timeLabel = $derived.by(() => {
		const sec = showSeconds ? `:${pad(time.s)}` : '';
		if (hour12) {
			const dh = time.h === 0 ? 12 : time.h > 12 ? time.h - 12 : time.h;
			const period = time.h >= 12 ? 'PM' : 'AM';
			return `${pad(dh)}:${pad(time.m)}${sec} ${period}`;
		}
		return `${pad(time.h)}:${pad(time.m)}${sec}`;
	});

	function handleDate(next: string | { from?: string; to?: string }): void {
		if (typeof next === 'string') onchange(next, time);
	}

	function handleTime(next: TimeParts): void {
		onchange(value, next);
	}
</script>

<div class="datetime-panel">
	<div class="datetime-panel__cal">
		<Calendar
			bare
			mode="single"
			{value}
			color={calendarColor}
			{locale}
			{weekStart}
			{min}
			{max}
			{disabled}
			onchange={handleDate}
		/>
	</div>
	<div class="datetime-panel__time">
		<div class="datetime-panel__time-chip" aria-live="polite">{timeLabel}</div>
		<TimePanel value={time} {color} {hour12} {showSeconds} {disabled} onchange={handleTime} />
	</div>
</div>

<style>
	.datetime-panel {
		display: grid;
		grid-template-columns: auto auto;
		align-items: stretch;
		gap: 12px;
		color: rgb(var(--text));
	}
	.datetime-panel__time {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 10px;
		padding-left: 12px;
		border-left: 1px solid rgb(var(--text) / 0.08);
	}
	.datetime-panel__time-chip {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-height: 28px;
		padding: 0 10px;
		border-radius: 7px;
		background: rgb(var(--text) / 0.05);
		color: rgb(var(--text));
		font-size: 0.78rem;
		font-weight: 500;
		font-variant-numeric: tabular-nums;
		letter-spacing: 0.02em;
	}

	@media (max-width: 480px) {
		.datetime-panel {
			grid-template-columns: 1fr;
			gap: 10px;
		}
		.datetime-panel__time {
			padding-left: 0;
			padding-top: 10px;
			border-left: 0;
			border-top: 1px solid rgb(var(--text) / 0.08);
			min-width: 0;
		}
	}
</style>
