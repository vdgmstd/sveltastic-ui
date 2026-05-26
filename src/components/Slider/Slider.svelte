<script lang="ts" module>
	import type { Color } from '../../types';

	export type SliderSize = 'small' | 'medium' | 'large';

	export type SliderProps = {
		/** Current value (single mode) or `[start, end]` for range mode. */
		value?: number | [number, number];
		/** Minimum. */
		min?: number;
		/** Maximum. */
		max?: number;
		/** Step. */
		step?: number;
		/** Visual size. */
		size?: SliderSize;
		/** Disabled. */
		disabled?: boolean;
		/** Show numeric tooltip on hover / focus. */
		showTooltip?: boolean;
		/** Always-on tooltip (ignores hover/focus state). */
		alwaysShowTooltip?: boolean;
		/** Show step ticks on the track. */
		ticks?: boolean;
		/** Format the tooltip value. */
		formatValue?: (value: number) => string;
		/** Palette color. */
		color?: Color;
		/** Fired on value change. */
		onchange?: (value: number | [number, number]) => void;
		/** Class merged onto the root. */
		class?: string;
		/** Inline style merged onto the root. */
		style?: string;
	};
</script>

<script lang="ts">
	import { Spring, Tween } from 'svelte/motion';
	import { cubicOut, backOut } from 'svelte/easing';
	import { rgbTriplet } from '../../utils/color';
	import { cn } from '../../utils/cn';

	let {
		value = $bindable(0),
		min = 0,
		max = 100,
		step = 1,
		size = 'medium',
		disabled = false,
		showTooltip = false,
		alwaysShowTooltip = false,
		ticks = false,
		formatValue,
		color = 'primary',
		onchange,
		class: className,
		style: userStyle
	}: SliderProps = $props();

	let triplet = $derived(rgbTriplet(color));
	let isRange = $derived(Array.isArray(value));

	function clamp(n: number): number {
		return Math.min(max, Math.max(min, n));
	}
	function snap(n: number): number {
		return Math.round(n / step) * step;
	}
	function pct(n: number): number {
		if (max === min) return 0;
		return ((n - min) / (max - min)) * 100;
	}
	function fmt(n: number): string {
		return formatValue ? formatValue(n) : String(n);
	}

	const initialV1 = Array.isArray(value) ? value[0] : (value as number);
	const initialV2 = Array.isArray(value) ? value[1] : 0;
	const SPRING_OPTS = { stiffness: 0.14, damping: 0.62 };
	const tween1 = new Spring(initialV1, SPRING_OPTS);
	const tween2 = new Spring(initialV2, SPRING_OPTS);
	let animating1 = $state(false);
	let animating2 = $state(false);

	$effect(() => {
		const t = isRange ? (value as [number, number])[0] : (value as number);
		if (!animating1) tween1.set(t, { instant: true });
	});
	$effect(() => {
		if (!isRange) return;
		const t = (value as [number, number])[1];
		if (!animating2) tween2.set(t, { instant: true });
	});

	let p1 = $derived(pct(tween1.current));
	let p2 = $derived(isRange ? pct(tween2.current) : null);
	let display1 = $derived(isRange ? clamp(snap(tween1.current)) : clamp(snap(tween1.current)));
	let display2 = $derived(isRange ? clamp(snap(tween2.current)) : 0);

	let railEl: HTMLDivElement | undefined = $state();

	const pressScale = new Tween(1, { duration: 110, easing: cubicOut });
	let pressToken = 0;

	async function runPress(): Promise<void> {
		if (disabled) return;
		const token = ++pressToken;
		pressScale.set(1, { duration: 0 });
		await pressScale.set(0.85, { duration: 110, easing: cubicOut });
		if (token !== pressToken) return;
		await pressScale.set(1, { duration: 460, easing: backOut });
	}

	function emit(next: number | [number, number]): void {
		value = next;
		onchange?.(next);
	}

	function handleSingleInput(event: Event): void {
		const n = clamp(snap(Number((event.currentTarget as HTMLInputElement).value)));
		emit(n);
	}
	function handleRangeInput(index: 0 | 1, event: Event): void {
		const n = clamp(snap(Number((event.currentTarget as HTMLInputElement).value)));
		const cur = value as [number, number];
		const next: [number, number] =
			index === 0 ? [Math.min(n, cur[1]), cur[1]] : [cur[0], Math.max(n, cur[0])];
		emit(next);
	}

	function handleRailPointerDown(event: PointerEvent): void {
		if (disabled || !railEl) return;
		if (event.button !== 0) return;
		void runPress();
		const target = (event.target as HTMLElement | null);
		if (target?.closest('.slider__input, .slider__thumb')) return;
		const r = railEl.getBoundingClientRect();
		if (r.width === 0) return;
		const ratio = Math.max(0, Math.min(1, (event.clientX - r.left) / r.width));
		const targetVal = clamp(snap(min + ratio * (max - min)));

		if (isRange) {
			const cur = value as [number, number];
			const movingHigh = Math.abs(targetVal - cur[1]) < Math.abs(targetVal - cur[0]);
			if (movingHigh) {
				const next: [number, number] = [cur[0], Math.max(targetVal, cur[0])];
				if (next[1] === cur[1]) return;
				animating2 = true;
				emit(next);
				tween2
					.set(next[1])
					.then(() => (animating2 = false));
			} else {
				const next: [number, number] = [Math.min(targetVal, cur[1]), cur[1]];
				if (next[0] === cur[0]) return;
				animating1 = true;
				emit(next);
				tween1
					.set(next[0])
					.then(() => (animating1 = false));
			}
		} else {
			if (targetVal === value) return;
			animating1 = true;
			emit(targetVal);
			tween1
				.set(targetVal)
				.then(() => (animating1 = false));
		}
	}

	let tickList = $derived.by<number[]>(() => {
		if (!ticks) return [];
		const list: number[] = [];
		for (let v = min; v <= max; v += step) list.push(v);
		return list;
	});

	function isInActiveRegion(tickPct: number): boolean {
		if (isRange && p2 !== null) return tickPct >= p1 && tickPct <= p2;
		return tickPct <= p1;
	}
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -- native <input type="range"> beneath provides keyboard + AT semantics; wrapper pointerdown is purely a click-anywhere shortcut -->
<div
	class={cn(
		'slider',
		`slider--size-${size}`,
		disabled && 'slider--disabled',
		isRange && 'slider--range',
		alwaysShowTooltip && 'slider--always-tooltip',
		!showTooltip && !alwaysShowTooltip && 'slider--no-tooltip',
		className
	)}
	style:--c={triplet}
	style:--p1="{p1}%"
	style:--p2={p2 === null ? '100%' : `${p2}%`}
	style:--ps={pressScale.current}
	style={userStyle}
	onpointerdown={handleRailPointerDown}
	data-testid="slider"
>
	<div class="slider__rail" bind:this={railEl}>
		{#if isRange}
			<span
				class="slider__seg slider__seg--side slider__seg--left"
				aria-hidden="true"
			></span>
			<span
				class="slider__seg slider__seg--active slider__seg--mid"
				aria-hidden="true"
			></span>
			<span
				class="slider__seg slider__seg--side slider__seg--right"
				aria-hidden="true"
			></span>
		{:else}
			<span
				class="slider__seg slider__seg--active slider__seg--left"
				aria-hidden="true"
			></span>
			<span
				class="slider__seg slider__seg--side slider__seg--right"
				aria-hidden="true"
			></span>
		{/if}

		{#if ticks}
			{#each tickList as tick (tick)}
				{@const tp = pct(tick)}
				<span
					class="slider__tick"
					class:slider__tick--in={isInActiveRegion(tp)}
					style:left="{tp}%"
				></span>
			{/each}
		{/if}

		<span class="slider__thumb slider__thumb--low" aria-hidden="true"></span>
		{#if isRange}
			<span class="slider__thumb slider__thumb--high" aria-hidden="true"></span>
		{/if}

		{#if showTooltip || alwaysShowTooltip}
			<span class="slider__tooltip slider__tooltip--low">
				{fmt(display1)}
			</span>
			{#if isRange}
				<span class="slider__tooltip slider__tooltip--high">
					{fmt(display2)}
				</span>
			{/if}
		{/if}
	</div>

	{#if isRange}
		<input
			type="range"
			class="slider__input slider__input--low"
			{min}
			{max}
			{step}
			{disabled}
			value={(value as [number, number])[0]}
			oninput={(e) => handleRangeInput(0, e)}
		/>
		<input
			type="range"
			class="slider__input slider__input--high"
			{min}
			{max}
			{step}
			{disabled}
			value={(value as [number, number])[1]}
			oninput={(e) => handleRangeInput(1, e)}
		/>
	{:else}
		<input
			type="range"
			class="slider__input"
			{min}
			{max}
			{step}
			{disabled}
			value={value as number}
			oninput={handleSingleInput}
		/>
	{/if}
</div>

<style>
	:where(.slider) {
		--c: var(--primary);
		--rail-h: 8px;
		--thumb-w: 6px;
		--thumb-h: 24px;
		--gap: 6px;
		--side-bg: rgb(var(--c) / 0.16);
		--ease: cubic-bezier(0.4, 0, 0.2, 1);
		--spring: cubic-bezier(0.34, 1.45, 0.6, 1);
		--dur: 200ms;
		--p1: 0%;
		--p2: 100%;
		position: relative;
		display: block;
		width: 100%;
		min-width: 200px;
		height: calc(var(--thumb-h) + 8px);
		padding: 0 calc(var(--thumb-w) / 2);
		isolation: isolate;
	}
	:where(.slider--size-small) {
		--rail-h: 6px;
		--thumb-w: 5px;
		--thumb-h: 18px;
		--gap: 5px;
	}
	:where(.slider--size-large) {
		--rail-h: 10px;
		--thumb-w: 8px;
		--thumb-h: 30px;
		--gap: 8px;
	}
	:where(.slider--disabled) {
		opacity: 0.5;
		pointer-events: none;
	}

	:global([data-theme='dark']) .slider {
		--side-bg: rgb(var(--c) / 0.22);
	}

	.slider__rail {
		position: absolute;
		left: calc(var(--thumb-w) / 2);
		right: calc(var(--thumb-w) / 2);
		top: 50%;
		height: var(--rail-h);
		transform: translateY(-50%);
		overflow: visible;
	}

	.slider__seg {
		position: absolute;
		top: 0;
		height: 100%;
		border-radius: 50vmax;
		min-width: 0;
	}

	.slider__seg--side {
		background: var(--side-bg);
	}

	.slider__seg--active {
		background: linear-gradient(
			90deg,
			color-mix(in oklab, rgb(var(--c)), black 14%) 0%,
			rgb(var(--c)) 100%
		);
	}
	:global([data-theme='dark']) .slider__seg--active {
		background: linear-gradient(
			90deg,
			rgb(var(--c)) 0%,
			color-mix(in oklab, rgb(var(--c)), white 22%) 100%
		);
	}

	.slider:not(.slider--range) .slider__seg--left {
		left: 0;
		right: calc(100% - var(--p1) + var(--thumb-w) / 2 + var(--gap));
	}
	.slider:not(.slider--range) .slider__seg--right {
		left: calc(var(--p1) + var(--thumb-w) / 2 + var(--gap));
		right: 0;
	}

	.slider--range .slider__seg--left {
		left: 0;
		right: calc(100% - var(--p1) + var(--thumb-w) / 2 + var(--gap));
	}
	.slider--range .slider__seg--mid {
		left: calc(var(--p1) + var(--thumb-w) / 2 + var(--gap));
		right: calc(100% - var(--p2) + var(--thumb-w) / 2 + var(--gap));
	}
	.slider--range .slider__seg--right {
		left: calc(var(--p2) + var(--thumb-w) / 2 + var(--gap));
		right: 0;
	}

	.slider__tick {
		position: absolute;
		top: 50%;
		width: 3px;
		height: 3px;
		border-radius: 50%;
		transform: translate(-50%, -50%);
		background: rgb(var(--text) / 0.32);
		z-index: 1;
	}
	.slider__tick--in {
		background: rgb(255 255 255 / 0.85);
	}

	.slider__thumb {
		position: absolute;
		top: 50%;
		width: var(--thumb-w);
		height: var(--thumb-h);
		background: rgb(var(--c));
		border-radius: 50vmax;
		transform: translate(-50%, -50%) scale(var(--ps, 1));
		transform-origin: center;
		box-shadow:
			0 2px 6px -1px rgb(var(--c) / 0.35),
			0 1px 2px rgb(0 0 0 / 0.08);
		transition:
			height var(--dur) var(--spring),
			width var(--dur) var(--spring),
			box-shadow var(--dur) var(--ease);
		z-index: 2;
		pointer-events: none;
	}
	.slider__thumb--low {
		left: var(--p1);
	}
	.slider__thumb--high {
		left: var(--p2);
	}

	.slider:hover:not(.slider--disabled) .slider__thumb,
	.slider:focus-within .slider__thumb {
		height: calc(var(--thumb-h) + 2px);
		box-shadow:
			0 2px 6px -1px rgb(var(--c) / 0.3),
			0 0 0 3px rgb(var(--c) / 0.08);
	}

	.slider__input {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		margin: 0;
		-webkit-appearance: none;
		appearance: none;
		background: transparent;
		pointer-events: none;
		outline: none;
		-webkit-tap-highlight-color: transparent;
		z-index: 3;
	}
	.slider__input::-webkit-slider-thumb {
		-webkit-appearance: none;
		appearance: none;
		width: calc(var(--thumb-w) + 16px);
		height: calc(var(--thumb-h) + 8px);
		background: transparent;
		border: 0;
		border-radius: 0;
		box-shadow: none;
		cursor: pointer;
		pointer-events: auto;
	}
	.slider__input::-moz-range-thumb {
		width: calc(var(--thumb-w) + 16px);
		height: calc(var(--thumb-h) + 8px);
		background: transparent;
		border: 0;
		border-radius: 0;
		box-shadow: none;
		cursor: pointer;
		pointer-events: auto;
	}
	.slider__input::-moz-range-track,
	.slider__input::-webkit-slider-runnable-track {
		-webkit-appearance: none;
		appearance: none;
		background: transparent;
		border: 0;
		box-shadow: none;
	}

	.slider__tooltip {
		position: absolute;
		bottom: calc(var(--thumb-h) / 2 + 12px);
		transform: translateX(-50%);
		font-size: 0.72rem;
		font-weight: 500;
		font-variant-numeric: tabular-nums;
		padding: 3px 8px;
		background: rgb(var(--c));
		color: rgb(255 255 255);
		border-radius: 6px;
		pointer-events: none;
		white-space: nowrap;
		opacity: 0;
		translate: 0 4px;
		transition:
			opacity var(--dur) var(--ease),
			translate var(--dur) var(--ease);
		z-index: 4;
	}
	.slider__tooltip::after {
		content: '';
		position: absolute;
		left: 50%;
		bottom: -4px;
		width: 8px;
		height: 8px;
		background: inherit;
		transform: translateX(-50%) rotate(45deg);
		border-radius: 1px;
	}
	.slider__tooltip--low {
		left: var(--p1);
	}
	.slider__tooltip--high {
		left: var(--p2);
	}
	.slider:hover:not(.slider--no-tooltip) .slider__tooltip,
	.slider:focus-within:not(.slider--no-tooltip) .slider__tooltip,
	.slider--always-tooltip .slider__tooltip {
		opacity: 1;
		translate: 0 0;
	}

	.slider--range .slider__input--low {
		z-index: 3;
	}
	.slider--range .slider__input--high {
		z-index: 4;
	}
</style>
