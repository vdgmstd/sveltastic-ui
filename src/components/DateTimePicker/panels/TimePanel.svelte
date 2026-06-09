<script lang="ts">
	import { pad } from '../../../utils/date';
	import TimeWheel from '../../../primitives/TimeWheel.svelte';
	import type { TimeWheelItem } from '../../../primitives/TimeWheel.svelte';
	import { Segmented } from '../../Segmented';
	import type { TimeParts } from '../../../utils/date';
	import { getDtpCtx } from '../context';

	let { onTimeChange }: { onTimeChange?: (next: TimeParts) => void } = $props();

	const root = getDtpCtx();

	let value = $derived<TimeParts>(root.parsedTime);
	let hour12 = $derived(root.hour12);
	let showSeconds = $derived(root.showSeconds);

	let displayHour = $derived(
		hour12 ? (value.h === 0 ? 12 : value.h > 12 ? value.h - 12 : value.h) : value.h
	);
	let isPM = $derived(value.h >= 12);

	function emit(next: TimeParts): void {
		if (onTimeChange) onTimeChange(next);
		else root.emitTime(next);
	}

	function setHour(h: number): void {
		let actual = h;
		if (hour12) {
			const base = h === 12 ? 0 : h;
			actual = isPM ? base + 12 : base;
		}
		emit({ h: actual, m: value.m, s: value.s });
	}

	function setMinute(m: number): void {
		emit({ h: value.h, m, s: value.s });
	}

	function setSecond(s: number): void {
		emit({ h: value.h, m: value.m, s });
	}

	function setPeriod(p: 'am' | 'pm'): void {
		const wantPM = p === 'pm';
		if (wantPM === isPM) return;
		let h = value.h;
		if (wantPM && h < 12) h += 12;
		else if (!wantPM && h >= 12) h -= 12;
		emit({ h, m: value.m, s: value.s });
	}

	let hourItems = $derived.by<TimeWheelItem[]>(() => {
		if (hour12) return Array.from({ length: 12 }, (_, i) => ({ key: i + 1, label: pad(i + 1) }));
		return Array.from({ length: 24 }, (_, h) => ({ key: h, label: pad(h) }));
	});
	let minuteItems = $derived<TimeWheelItem[]>(
		Array.from({ length: 60 }, (_, m) => ({ key: m, label: pad(m) }))
	);
	let secondItems = $derived<TimeWheelItem[]>(
		Array.from({ length: 60 }, (_, s) => ({ key: s, label: pad(s) }))
	);
	const periodItems = [
		{ value: 'am', label: 'AM' },
		{ value: 'pm', label: 'PM' }
	] as const;
</script>

<div class="time-panel" style:--c={root.triplet}>
	<div class="time-panel__wheels">
		<TimeWheel
			value={displayHour}
			items={hourItems}
			color={root.color}
			disabled={root.disabled}
			ariaLabel="Hours"
			onchange={setHour}
		/>
		<span class="time-panel__sep" aria-hidden="true">:</span>
		<TimeWheel
			value={value.m}
			items={minuteItems}
			color={root.color}
			disabled={root.disabled}
			ariaLabel="Minutes"
			onchange={setMinute}
		/>
		{#if showSeconds}
			<span class="time-panel__sep" aria-hidden="true">:</span>
			<TimeWheel
				value={value.s}
				items={secondItems}
				color={root.color}
				disabled={root.disabled}
				ariaLabel="Seconds"
				onchange={setSecond}
			/>
		{/if}
	</div>
	{#if hour12}
		<div class="time-panel__period">
			<Segmented.Root
				value={isPM ? 'pm' : 'am'}
				color={root.color}
				disabled={root.disabled}
				onValueChange={setPeriod}
			>
				{#each periodItems as item (item.value)}
					<Segmented.Item value={item.value}>{item.label}</Segmented.Item>
				{/each}
			</Segmented.Root>
		</div>
	{/if}
</div>

<style>
	.time-panel {
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
		padding: var(--space-4) var(--space-2) var(--space-2);
		color: rgb(var(--text));
	}
	.time-panel__wheels {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: var(--space-2);
	}
	.time-panel__sep {
		font-size: var(--fs-xl);
		font-weight: 600;
		color: rgb(var(--text) / 0.55);
		font-variant-numeric: tabular-nums;
		padding-bottom: var(--space-1);
	}
	.time-panel__period {
		display: flex;
		justify-content: center;
		padding: var(--space-2);
	}
</style>
