<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { Color } from '../../types';

	export type ProgressShape = 'linear' | 'circular';

	export type ProgressProps = {
		/** Current value, clamped to `[0, max]`. */
		value?: number;
		/** Upper bound for `value`. */
		max?: number;
		/** Animated value-less state — bar slides, ring spins. */
		indeterminate?: boolean;
		/** `linear` (bar) or `circular` (ring). */
		shape?: ProgressShape;
		/** Bar height (linear) or stroke width (circular), in px. */
		thickness?: number;
		/** Diameter in px (circular only). */
		size?: number;
		/** Animated diagonal stripes overlay (linear only). */
		stripes?: boolean;
		/** Palette accent driving fill and track. */
		color?: Color;
		/** Label rendered over the bar (linear) or centered in the ring (circular). */
		children?: Snippet;
		/** ARIA label for assistive tech when no visible label is supplied. */
		'aria-label'?: string;
		/** Class merged onto the root. */
		class?: string;
		/** Inline style merged onto the root. */
		style?: string;
	};
</script>

<script lang="ts">
	import { untrack } from 'svelte';
	import { Tween } from 'svelte/motion';
	import { cubicOut } from 'svelte/easing';
	import { rgbTriplet } from '../../utils/color';
	import { cn } from '../../utils/cn';
	import { nextId } from '../../state/ids.svelte';
	import Spinner from '../../primitives/Spinner.svelte';

	let {
		value = 0,
		max = 100,
		indeterminate = false,
		shape = 'linear',
		thickness = 8,
		size = 64,
		stripes = false,
		color = 'primary',
		children,
		'aria-label': ariaLabel,
		class: className,
		style: userStyle
	}: ProgressProps = $props();

	let ratio = $derived(max > 0 ? Math.max(0, Math.min(1, value / max)) : 0);
	const fill = new Tween(untrack(() => ratio), { duration: 320, easing: cubicOut });
	$effect(() => {
		fill.target = ratio;
	});

	let triplet = $derived(rgbTriplet(color));
	let radius = $derived((size - thickness) / 2);
	let circumference = $derived(2 * Math.PI * radius);
	let dashOffset = $derived(circumference * (1 - fill.current));
	let pct = $derived(fill.current * 100);
	const gradId = nextId('progress-grad');
</script>

{#if shape === 'linear'}
	<div
		class={cn(
			'progress',
			'progress--linear',
			indeterminate && 'progress--indeterminate',
			stripes && !indeterminate && 'progress--stripes',
			className
		)}
		style:--c={triplet}
		style:--h="{thickness}px"
		style={userStyle}
		role="progressbar"
		aria-label={ariaLabel}
		aria-valuemin={0}
		aria-valuemax={max}
		aria-valuenow={indeterminate ? undefined : value}
		aria-busy={indeterminate || undefined}
		data-testid="progress"
	>
		<div
			class="progress__bar"
			style:width={indeterminate ? undefined : `${pct}%`}
		></div>
		{#if children}<span class="progress__label">{@render children()}</span>{/if}
	</div>
{:else}
	<div
		class={cn(
			'progress',
			'progress--circular',
			indeterminate && 'progress--indeterminate',
			className
		)}
		style:--c={triplet}
		style:width="{size}px"
		style:height="{size}px"
		style={userStyle}
		role="progressbar"
		aria-label={ariaLabel}
		aria-valuemin={0}
		aria-valuemax={max}
		aria-valuenow={indeterminate ? undefined : value}
		aria-busy={indeterminate || undefined}
		data-testid="progress"
	>
		{#if indeterminate}
			<Spinner {color} size={size} thickness={thickness} speed={800} />
		{:else}
			<svg class="progress__svg" viewBox="0 0 {size} {size}" aria-hidden="true">
				<defs>
					<linearGradient
						id={gradId}
						gradientUnits="userSpaceOnUse"
						x1={size / 2}
						y1={0}
						x2={size / 2}
						y2={size}
					>
						<stop offset="0%" stop-color="rgb({triplet})" />
						<stop
							offset="100%"
							stop-color="color-mix(in srgb, rgb({triplet}), white 55%)"
						/>
					</linearGradient>
				</defs>
				<circle
					class="progress__ring-track"
					cx={size / 2}
					cy={size / 2}
					r={radius}
					stroke-width={thickness}
					stroke-dasharray="{thickness * 0.5} {thickness * 2.5}"
					fill="none"
				/>
				<circle
					class="progress__ring"
					cx={size / 2}
					cy={size / 2}
					r={radius}
					stroke-width={thickness}
					stroke="url(#{gradId})"
					fill="none"
					stroke-dasharray={circumference}
					stroke-dashoffset={dashOffset}
					transform="rotate(-90 {size / 2} {size / 2})"
				/>
			</svg>
		{/if}
		{#if children}<span class="progress__label">{@render children()}</span>{/if}
	</div>
{/if}

<style>
	:where(.progress) {
		--c: var(--primary);
		--h: 6px;
		color: rgb(var(--c));
	}

	:where(.progress--linear) {
		position: relative;
		width: 100%;
		height: var(--h);
		background: rgb(var(--c) / 0.15);
		border-radius: 50vmax;
		overflow: hidden;
		box-shadow: 0 1px 4px rgb(var(--c) / 0.25);
	}

	.progress__bar {
		position: absolute;
		inset: 0 auto 0 0;
		background: linear-gradient(
			to right,
			rgb(var(--c)) 0%,
			color-mix(in srgb, rgb(var(--c)), white 35%) 100%
		);
		border-radius: inherit;
	}

	.progress--stripes .progress__bar {
		background-image:
			linear-gradient(
				45deg,
				color-mix(in srgb, rgb(var(--c)), white 45%) 25%,
				transparent 25%,
				transparent 50%,
				color-mix(in srgb, rgb(var(--c)), white 45%) 50%,
				color-mix(in srgb, rgb(var(--c)), white 45%) 75%,
				transparent 75%,
				transparent
			),
			linear-gradient(
				to right,
				rgb(var(--c)) 0%,
				color-mix(in srgb, rgb(var(--c)), white 35%) 100%
			);
		background-size: 16px 16px, auto;
		background-repeat: repeat, no-repeat;
		animation: progress-stripes 1s linear infinite;
	}

	.progress--linear.progress--indeterminate .progress__bar {
		width: 40%;
		animation: progress-slide 1.4s cubic-bezier(0.4, 0, 0.6, 1) infinite;
	}

	:where(.progress--circular) {
		position: relative;
		display: inline-flex;
		align-items: center;
		justify-content: center;
	}

	.progress__svg {
		display: block;
		width: 100%;
		height: 100%;
	}
	.progress__ring-track {
		stroke: rgb(var(--c));
		opacity: 0.3;
		stroke-linecap: round;
	}
	.progress__ring {
		stroke-linecap: round;
		filter: drop-shadow(0 0 3px rgb(var(--c) / 0.45));
	}

	.progress__label {
		position: absolute;
		inset: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 0.7rem;
		font-weight: 500;
		color: rgb(var(--c));
		pointer-events: none;
	}
	.progress--linear .progress__label { mix-blend-mode: difference; }

	@keyframes progress-stripes {
		from { background-position: 0 0, 0 0; }
		to { background-position: 16px 0, 0 0; }
	}
	@keyframes progress-slide {
		0% { transform: translateX(-100%); }
		100% { transform: translateX(250%); }
	}
</style>
