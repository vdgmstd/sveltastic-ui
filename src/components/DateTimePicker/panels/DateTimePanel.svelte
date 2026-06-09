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
	import { formatTimeParts } from '../../../utils/date';
	import { Calendar } from '../../Calendar';
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

	let timeLabel = $derived(formatTimeParts(time, { withSeconds: showSeconds, hour12 }));

	function handleDate(next: string): void {
		onchange(next, time);
	}

	function handleTime(next: TimeParts): void {
		onchange(value, next);
	}
</script>

<div class="datetime-panel">
	<div class="datetime-panel__cal">
		<Calendar.Root
			bare
			type="single"
			bind:value={() => value, handleDate}
			color={calendarColor}
			{locale}
			{weekStart}
			{min}
			{max}
			{disabled}
		/>
	</div>
	<div class="datetime-panel__time">
		<div class="datetime-panel__time-chip" aria-live="polite">{timeLabel}</div>
		<TimePanel onTimeChange={handleTime} />
	</div>
</div>

<style>
	.datetime-panel {
		display: grid;
		grid-template-columns: auto auto;
		align-items: stretch;
		gap: var(--space-6);
		color: rgb(var(--text));
	}
	.datetime-panel__time {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: var(--space-5);
		padding-left: var(--space-6);
		border-left: 1px solid rgb(var(--text) / 0.08);
	}
	.datetime-panel__time-chip {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-height: 28px;
		padding: 0 var(--space-5);
		border-radius: var(--rad-sm);
		background: rgb(var(--text) / 0.05);
		color: rgb(var(--text));
		font-size: var(--fs-sm);
		font-weight: 500;
		font-variant-numeric: tabular-nums;
		letter-spacing: 0.02em;
	}

	@media (max-width: 480px) {
		.datetime-panel {
			grid-template-columns: 1fr;
			gap: var(--space-5);
		}
		.datetime-panel__time {
			padding-left: 0;
			padding-top: var(--space-5);
			border-left: 0;
			border-top: 1px solid rgb(var(--text) / 0.08);
			min-width: 0;
		}
	}
</style>
