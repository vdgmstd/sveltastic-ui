<script lang="ts" module>
	import '../../styles/field.css';
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import type { Color, Size, WithElementRef } from '../../types';
	import type { SliderType } from './slider.svelte';

	export type { SliderType } from './slider.svelte';

	type RootBase = {
		/** `single` → `value: number`, `multiple` → `value: number[]`. */
		type?: SliderType;
		/** Minimum. */
		min?: number;
		/** Maximum. */
		max?: number;
		/** Step. */
		step?: number;
		/** Visual size. */
		size?: Size;
		/** Palette color. */
		color?: Color;
		/** Disabled. */
		disabled?: boolean;
		/** Show step ticks on the track. */
		ticks?: boolean;
		/** Show numeric tooltip on hover / focus. */
		showTooltip?: boolean;
		/** Always-on tooltip (ignores hover/focus state). */
		alwaysShowTooltip?: boolean;
		/** Format the tooltip value. */
		formatValue?: (value: number) => string;
		/** Accessible name for the (single) thumb input. */
		ariaLabel?: string;
		/** Accessible name for the low / start thumb in range mode. */
		ariaLabelMin?: string;
		/** Accessible name for the high / end thumb in range mode. */
		ariaLabelMax?: string;
		/** Composition slot — `<Slider.Track>` and parts. Default composition renders when omitted. */
		children?: Snippet;
		/** Render-delegation: receive the merged props and render your own root element. */
		child?: Snippet<[{ props: Record<string, unknown> }]>;
	};

	export type SliderRootProps = WithElementRef<
		RootBase & {
			/** Current value (single mode) or `number[]` for range/multiple mode. Use `bind:value`. */
			value?: number | number[];
			/** Fires with the next value on change. */
			onValueChange?: (value: number | number[]) => void;
			/** Fires once on pointer-up / keyboard commit with the settled value. */
			onValueCommit?: (value: number | number[]) => void;
		} & Omit<HTMLAttributes<HTMLDivElement>, 'onchange'>,
		HTMLDivElement
	>;
</script>

<script lang="ts">
	import { createAttachmentKey } from 'svelte/attachments';
	import { mergeProps } from '../../utils/mergeProps';
	import { attachRef } from '../../utils/ref';
	import { setSliderCtx } from './context';
	import { SliderRootState } from './slider.svelte';
	import SliderTrack from './SliderTrack.svelte';
	import SliderRange from './SliderRange.svelte';
	import SliderThumb from './SliderThumb.svelte';
	import SliderTick from './SliderTick.svelte';
	import SliderTooltip from './SliderTooltip.svelte';

	let {
		ref = $bindable(null),
		type = 'single',
		value = $bindable(0),
		min = 0,
		max = 100,
		step = 1,
		size = 'medium',
		color = 'primary',
		disabled = false,
		ticks = false,
		showTooltip = false,
		alwaysShowTooltip = false,
		formatValue,
		ariaLabel,
		ariaLabelMin,
		ariaLabelMax,
		children,
		child,
		onValueChange,
		onValueCommit,
		class: className,
		style: userStyle,
		...rest
	}: SliderRootProps = $props();

	const root = setSliderCtx(
		new SliderRootState({
			getType: () => type,
			getValue: () => value,
			setValueProp: (v) => {
				value = v;
			},
			onValueChange: () => onValueChange,
			onValueCommit: () => onValueCommit,
			getMin: () => min,
			getMax: () => max,
			getStep: () => step,
			getSize: () => size,
			getColor: () => color,
			getDisabled: () => disabled,
			getTicks: () => ticks,
			getShowTooltip: () => showTooltip,
			getAlwaysShowTooltip: () => alwaysShowTooltip,
			getFormatValue: () => formatValue,
			getAriaLabel: () => ariaLabel,
			getAriaLabelMin: () => ariaLabelMin,
			getAriaLabelMax: () => ariaLabelMax
		})
	);

	$effect(() => root.syncSpring1());
	$effect(() => root.syncSpring2());
	$effect(() => () => root.destroy());

	const refKey = createAttachmentKey();
	const merged = $derived(
		mergeProps(rest, root.wrapperAttrs, {
			class: ['slider', root.sizeModifier, className].filter(Boolean).join(' '),
			onpointerdown: (e: PointerEvent) => root.handleRailPointerDown(e),
			[refKey]: attachRef<HTMLDivElement>((n) => (ref = n))
		})
	);

	let styleVars = $derived(
		`--c:${root.triplet};--p1:${root.p1}%;--p2:${root.p2 === null ? '100%' : `${root.p2}%`};--ps:${root.press.scale};${userStyle ?? ''}`
	);
</script>

{#snippet defaults()}
	<SliderTrack>
		<SliderRange />
		{#if root.ticks}
			{#each root.tickList as tick, i (tick)}
				{#if i > 0 && i < root.tickList.length - 1}
					<SliderTick index={i} />
				{/if}
			{/each}
		{/if}
		<SliderThumb index={0} />
		{#if root.isRange}
			<SliderThumb index={1} />
		{/if}
		{#if root.showTooltip || root.alwaysShowTooltip}
			<SliderTooltip index={0} />
			{#if root.isRange}
				<SliderTooltip index={1} />
			{/if}
		{/if}
	</SliderTrack>
{/snippet}

<!-- native range input beneath provides keyboard + AT semantics; wrapper pointerdown is a click-anywhere shortcut -->
{#if child}
	{@render child({ props: { ...merged, style: styleVars } })}
{:else}
	<div {...merged} style={styleVars}>
		{#if children}{@render children()}{:else}{@render defaults()}{/if}
	</div>
{/if}

<style>
	:where(.slider) {
		--c: var(--primary);
		--rail-h: 8px;
		--thumb-w: 6px;
		--thumb-h: 24px;
		--gap: 6px;
		--side-bg: rgb(var(--c) / 0.16);
		--ease: var(--ease-standard);
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
		-webkit-user-select: none;
		user-select: none;
	}
	:where(.slider--size-mini) {
		--rail-h: 5px;
		--thumb-w: 4px;
		--thumb-h: 14px;
		--gap: 4px;
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
	:where(.slider--size-xl) {
		--rail-h: 12px;
		--thumb-w: 10px;
		--thumb-h: 36px;
		--gap: 9px;
	}
	:where(.slider[data-disabled]) {
		opacity: 0.5;
		pointer-events: none;
	}

	:global([data-theme='dark'] .slider) {
		--side-bg: rgb(var(--c) / 0.22);
	}

	:global(.slider .slider__rail) {
		position: absolute;
		left: calc(var(--thumb-w) / 2);
		right: calc(var(--thumb-w) / 2);
		top: 50%;
		height: var(--rail-h);
		transform: translateY(-50%);
		overflow: visible;
	}

	:global(.slider .slider__seg) {
		position: absolute;
		top: 0;
		height: 100%;
		border-radius: var(--rad-pill);
		min-width: 0;
	}

	:global(.slider .slider__seg--side) {
		background: var(--side-bg);
	}

	:global(.slider .slider__seg--active) {
		background: linear-gradient(
			90deg,
			color-mix(in oklab, rgb(var(--c)), black 14%) 0%,
			rgb(var(--c)) 100%
		);
	}
	:global([data-theme='dark'] .slider .slider__seg--active) {
		background: linear-gradient(
			90deg,
			rgb(var(--c)) 0%,
			color-mix(in oklab, rgb(var(--c)), white 22%) 100%
		);
	}

	:global(.slider:not([data-range]) .slider__seg--left) {
		inset-inline-start: 0;
		inset-inline-end: calc(100% - var(--p1) + var(--thumb-w) / 2 + var(--gap));
	}
	:global(.slider:not([data-range]) .slider__seg--right) {
		inset-inline-start: calc(var(--p1) + var(--thumb-w) / 2 + var(--gap));
		inset-inline-end: 0;
	}

	:global(.slider[data-range] .slider__seg--left) {
		inset-inline-start: 0;
		inset-inline-end: calc(100% - var(--p1) + var(--thumb-w) / 2 + var(--gap));
	}
	:global(.slider[data-range] .slider__seg--mid) {
		inset-inline-start: calc(var(--p1) + var(--thumb-w) / 2 + var(--gap));
		inset-inline-end: calc(100% - var(--p2) + var(--thumb-w) / 2 + var(--gap));
	}
	:global(.slider[data-range] .slider__seg--right) {
		inset-inline-start: calc(var(--p2) + var(--thumb-w) / 2 + var(--gap));
		inset-inline-end: 0;
	}

	:global(.slider .slider__tick) {
		position: absolute;
		top: 50%;
		width: 3px;
		height: 3px;
		border-radius: var(--rad-circle);
		transform: translate(-50%, -50%);
		background: rgb(var(--text) / 0.32);
		z-index: 1;
	}
	:global(.slider .slider__tick[data-bounded]) {
		background: rgb(var(--on-accent) / 0.85);
	}

	:global(.slider .slider__thumb) {
		position: absolute;
		top: 50%;
		width: var(--thumb-w);
		height: var(--thumb-h);
		background: rgb(var(--c));
		border-radius: var(--rad-pill);
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
	:global(.slider .slider__thumb--low) {
		inset-inline-start: var(--p1);
	}
	:global(.slider .slider__thumb--high) {
		inset-inline-start: var(--p2);
	}

	:global(.slider:hover:not([data-disabled]) .slider__thumb),
	:global(.slider:focus-within .slider__thumb) {
		height: calc(var(--thumb-h) + 2px);
		box-shadow:
			0 2px 6px -1px rgb(var(--c) / 0.3),
			0 0 0 3px rgb(var(--c) / 0.08);
	}

	/* sized to the full slider box, not the rail it nests in, so the hit/focus target keeps HEAD's bounds */
	:global(.slider .slider__input) {
		position: absolute;
		left: calc(var(--thumb-w) / -2);
		right: calc(var(--thumb-w) / -2);
		top: 50%;
		height: calc(var(--thumb-h) + 8px);
		margin: 0;
		transform: translateY(-50%);
		-webkit-appearance: none;
		appearance: none;
		background: transparent;
		pointer-events: none;
		outline: none;
		-webkit-tap-highlight-color: transparent;
		z-index: 3;
	}
	:global(.slider .slider__input::-webkit-slider-thumb) {
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
	:global(.slider .slider__input::-moz-range-thumb) {
		width: calc(var(--thumb-w) + 16px);
		height: calc(var(--thumb-h) + 8px);
		background: transparent;
		border: 0;
		border-radius: 0;
		box-shadow: none;
		cursor: pointer;
		pointer-events: auto;
	}
	:global(.slider .slider__input::-moz-range-track),
	:global(.slider .slider__input::-webkit-slider-runnable-track) {
		-webkit-appearance: none;
		appearance: none;
		background: transparent;
		border: 0;
		box-shadow: none;
	}

	:global(.slider .slider__tooltip) {
		position: absolute;
		bottom: calc(var(--thumb-h) / 2 + 12px);
		transform: translateX(-50%);
		font-size: var(--fs-sm);
		font-weight: 500;
		font-variant-numeric: tabular-nums;
		padding: var(--space-2) var(--space-4);
		background: rgb(var(--c));
		color: rgb(var(--on-accent));
		border-radius: var(--rad-xs);
		pointer-events: none;
		white-space: nowrap;
		opacity: 0;
		translate: 0 4px;
		transition:
			opacity var(--dur) var(--ease),
			translate var(--dur) var(--ease);
		z-index: 4;
	}
	:global(.slider .slider__tooltip::after) {
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
	:global(.slider .slider__tooltip--low) {
		inset-inline-start: var(--p1);
	}
	:global(.slider .slider__tooltip--high) {
		inset-inline-start: var(--p2);
	}
	:global(.slider:hover:not([data-no-tooltip]) .slider__tooltip),
	:global(.slider:focus-within:not([data-no-tooltip]) .slider__tooltip),
	:global(.slider[data-always-tooltip] .slider__tooltip) {
		opacity: 1;
		translate: 0 0;
	}

	:global(.slider[data-range] .slider__input--low) {
		z-index: 3;
	}
	:global(.slider[data-range] .slider__input--high) {
		z-index: 4;
	}
</style>
