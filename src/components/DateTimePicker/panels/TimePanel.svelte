<script lang="ts" module>
	import type { Color } from '../../../types';
	import type { TimeParts } from './types';

	export type TimePanelProps = {
		value: TimeParts;
		color?: Color;
		hour12?: boolean;
		showSeconds?: boolean;
		disabled?: boolean;
		onchange: (next: TimeParts) => void;
	};
</script>

<script lang="ts">
	import { rgbTriplet } from '../../../utils/color';
	import TimeWheel from '../../../primitives/TimeWheel.svelte';
	import type { TimeWheelItem } from '../../../primitives/TimeWheel.svelte';
	import Segmented from '../../Segmented/Segmented.svelte';

	let {
		value,
		color = 'primary',
		hour12 = false,
		showSeconds = false,
		disabled = false,
		onchange
	}: TimePanelProps = $props();

	let triplet = $derived(rgbTriplet(color));

	function pad(n: number): string {
		return String(n).padStart(2, '0');
	}

	let displayHour = $derived(
		hour12 ? (value.h === 0 ? 12 : value.h > 12 ? value.h - 12 : value.h) : value.h
	);
	let isPM = $derived(value.h >= 12);

	function setHour(h: number): void {
		let actual = h;
		if (hour12) {
			const base = h === 12 ? 0 : h;
			actual = isPM ? base + 12 : base;
		}
		onchange({ h: actual, m: value.m, s: value.s });
	}

	function setMinute(m: number): void {
		onchange({ h: value.h, m, s: value.s });
	}

	function setSecond(s: number): void {
		onchange({ h: value.h, m: value.m, s });
	}

	function setPeriod(p: 'am' | 'pm'): void {
		const wantPM = p === 'pm';
		if (wantPM === isPM) return;
		let h = value.h;
		if (wantPM && h < 12) h += 12;
		else if (!wantPM && h >= 12) h -= 12;
		onchange({ h, m: value.m, s: value.s });
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

<div class="time-panel" style:--c={triplet}>
	<div class="time-panel__wheels">
		<TimeWheel
			value={displayHour}
			items={hourItems}
			{color}
			{disabled}
			ariaLabel="Hours"
			onchange={setHour}
		/>
		<span class="time-panel__sep" aria-hidden="true">:</span>
		<TimeWheel
			value={value.m}
			items={minuteItems}
			{color}
			{disabled}
			ariaLabel="Minutes"
			onchange={setMinute}
		/>
		{#if showSeconds}
			<span class="time-panel__sep" aria-hidden="true">:</span>
			<TimeWheel
				value={value.s}
				items={secondItems}
				{color}
				{disabled}
				ariaLabel="Seconds"
				onchange={setSecond}
			/>
		{/if}
	</div>
	{#if hour12}
		<div class="time-panel__period">
			<Segmented value={isPM ? 'pm' : 'am'} items={periodItems} {color} {disabled} onchange={setPeriod} />
		</div>
	{/if}
</div>

<style>
	.time-panel {
		display: flex;
		flex-direction: column;
		gap: 8px;
		padding: 8px 4px 4px;
		color: rgb(var(--text));
	}
	.time-panel__wheels {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 4px;
	}
	.time-panel__sep {
		font-size: 1.05rem;
		font-weight: 600;
		color: rgb(var(--text) / 0.55);
		font-variant-numeric: tabular-nums;
		padding-bottom: 2px;
	}
	.time-panel__period {
		display: flex;
		justify-content: center;
		padding: 4px;
	}
</style>
