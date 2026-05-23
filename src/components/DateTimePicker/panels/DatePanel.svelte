<script lang="ts" module>
	import type { Color } from '../../../types';
	import type { DateLike, WeekStart } from '../../../utils/date';

	export type DatePanelProps = {
		/** ISO `YYYY-MM-DD` (or empty for none). */
		value: string;
		color?: Color;
		locale?: string;
		weekStart?: WeekStart;
		min?: DateLike;
		max?: DateLike;
		disabled?: boolean;
		onchange: (next: string) => void;
	};
</script>

<script lang="ts">
	import Calendar from '../../Calendar/Calendar.svelte';

	let {
		value,
		color = 'primary',
		locale,
		weekStart,
		min,
		max,
		disabled = false,
		onchange
	}: DatePanelProps = $props();

	let calendarColor = $derived<'primary' | 'warning'>(color === 'warning' ? 'warning' : 'primary');

	function handle(next: string | { from?: string; to?: string }): void {
		if (typeof next === 'string') onchange(next);
	}
</script>

<div class="date-panel">
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
		onchange={handle}
	/>
</div>

<style>
	.date-panel {
		color: rgb(var(--text));
	}
</style>
