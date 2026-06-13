<script lang="ts">
	import { Calendar } from '../../Calendar';
	import { getDtpCtx } from '../context';

	const root = getDtpCtx();

	let calendarColor = $derived<'primary' | 'warning'>(root.color === 'warning' ? 'warning' : 'primary');

	function handle(next: string): void {
		root.emitDateText(next);
	}
</script>

<div class="date-panel">
	<Calendar.Root
		bare
		type="single"
		bind:value={() => root.calendarValue, handle}
		color={calendarColor}
		locale={root.locale}
		weekStart={root.weekStart}
		min={root.min}
		max={root.max}
		disabled={root.disabled}
		readonly={root.readonly}
	/>
</div>

<style>
	.date-panel {
		color: rgb(var(--text));
	}
</style>
