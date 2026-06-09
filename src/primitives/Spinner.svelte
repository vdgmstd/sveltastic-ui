<script lang="ts" module>
	import type { Color } from '../types';

	export type SpinnerProps = {
		/** Diameter — number of px or any CSS length (`'60%'`, `'2rem'`). */
		size?: number | string;
		/** Border thickness in px. */
		thickness?: number;
		/** Palette name or hex / rgb. Defaults to `'primary'`. */
		color?: Color;
		/** Milliseconds per revolution. */
		speed?: number;
		/** Hide from assistive tech (when a parent already labels the loading state). */
		'aria-hidden'?: boolean | 'true' | 'false';
		/** Accessible label when not aria-hidden. */
		'aria-label'?: string;
	};
</script>

<script lang="ts">
	import { Tween } from 'svelte/motion';
	import { quintInOut, cubicInOut, expoInOut } from 'svelte/easing';
	import { rgbTriplet } from '../utils/color';

	let {
		size = 22,
		thickness = 2,
		color = 'primary',
		speed = 800,
		'aria-hidden': ariaHidden = true,
		'aria-label': ariaLabel
	}: SpinnerProps = $props();

	const cycle = new Tween(0);

	const softInOut = (t: number): number => 0.5 * t + 0.5 * cubicInOut(t);
	const elasticEase = (t: number): number => 0.55 * quintInOut(t) + 0.45 * expoInOut(t);

	$effect(() => {
		const period = Math.round(speed * 2.8);
		let cancelled = false;
		let count = 0;
		(async () => {
			while (!cancelled) {
				count += 1;
				await cycle.set(count, { duration: period, easing: softInOut });
				if (cancelled) return;
			}
		})();
		return () => {
			cancelled = true;
		};
	});

	let cycleNum = $derived(Math.floor(cycle.current));
	let frac = $derived(cycle.current - cycleNum);
	let phaseEased = $derived(
		frac < 0.42
			? elasticEase(frac / 0.30)
			: frac < 0.58
				? 1
				: elasticEase((1 - frac) / 0.38)
	);
	let sizeCss = $derived(typeof size === 'number' ? `${size}px` : size);
	let triplet = $derived(rgbTriplet(color));
	let isHidden = $derived(ariaHidden === true || ariaHidden === 'true');

	const VB_FALLBACK = 24;
	let vb = $derived(typeof size === 'number' ? size : VB_FALLBACK);
	let stroke = $derived(thickness);
	let radius = $derived((vb - stroke) / 2);
	let circumference = $derived(2 * Math.PI * radius);
	const ARC_MIN = 0.3;
	const ARC_MAX = 0.85;
	const DELTA = ARC_MAX - ARC_MIN;
	const CHASE_MAX = 0.39;

	let chaseOffset = $derived(circumference * CHASE_MAX * (1 - phaseEased));

	let headExtension = $derived(frac < 0.5 ? elasticEase(frac * 2) * DELTA : DELTA);
	let tailExtension = $derived(frac < 0.5 ? 0 : elasticEase((frac - 0.5) * 2) * DELTA);
	let headPos = $derived(cycleNum * DELTA + ARC_MIN + headExtension);
	let tailPos = $derived(cycleNum * DELTA + tailExtension);

	let solidArcLen = $derived(circumference * (headPos - tailPos));
	let rotationDeg = $derived(cycle.current * 360);
	let solidOffset = $derived(-tailPos * circumference);
	let solidDash = $derived(`${solidArcLen} ${circumference - solidArcLen}`);

	let dashedArcLen = $derived(circumference * 0.26);
	let dashedOffset = $derived(-headPos * circumference + chaseOffset + dashedArcLen);
	let dashedDash = $derived.by(() => {
		const count = 3;
		const dash = stroke * 0.5;
		const totalGap = dashedArcLen - count * dash;
		const gap = totalGap / (count - 1);
		const parts: string[] = [];
		for (let i = 0; i < count - 1; i++) parts.push(String(dash), String(gap));
		parts.push(String(dash), String(circumference - dashedArcLen));
		return parts.join(' ');
	});
</script>

<span
	class="spinner"
	style:--c={triplet}
	style:--size={sizeCss}
	role={isHidden ? undefined : 'status'}
	aria-hidden={isHidden ? 'true' : undefined}
	aria-label={isHidden ? undefined : ariaLabel}
>
	<svg
		class="spinner__svg"
		viewBox="0 0 {vb} {vb}"
		aria-hidden="true"
		style:transform="rotate({rotationDeg}deg)"
	>
		<circle
			class="spinner__circle spinner__circle--dashed"
			cx={vb / 2}
			cy={vb / 2}
			r={radius}
			stroke-width={stroke}
			stroke-dasharray={dashedDash}
			stroke-dashoffset={dashedOffset}
			fill="none"
		/>
		<circle
			class="spinner__circle spinner__circle--solid"
			cx={vb / 2}
			cy={vb / 2}
			r={radius}
			stroke-width={stroke}
			stroke-dasharray={solidDash}
			stroke-dashoffset={solidOffset}
			fill="none"
		/>
	</svg>
</span>

<style>
	.spinner {
		position: relative;
		display: inline-block;
		width: var(--size);
		height: var(--size);
		pointer-events: none;
		flex-shrink: 0;
	}
	.spinner__svg {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
	}
	.spinner__circle {
		stroke: rgb(var(--c));
		stroke-linecap: round;
	}
	.spinner__circle--dashed { opacity: 0.3; }
	.spinner__svg {
		transform-origin: 50% 50%;
		will-change: transform;
	}
</style>
