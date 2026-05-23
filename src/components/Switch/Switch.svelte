<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { HTMLInputAttributes } from 'svelte/elements';
	import type { Color } from '../../types';

	export type SwitchSize = 'small' | 'medium' | 'large';
	export type SwitchShape = 'default' | 'square';

	export type SwitchProps = {
		/** Boolean state. Use `bind:checked` for two-way control. */
		checked?: boolean;
		/** Pill (default) or square track. */
		shape?: SwitchShape;
		/** Visual size. */
		size?: SwitchSize;
		/** Centre the knob and lock interaction. */
		indeterminate?: boolean;
		/** Spinner overlay (collapses the track to a circle). */
		loading?: boolean;
		/** Icon-knob mode — drops the white pill so the inline icon snippet IS the knob. */
		ghostKnob?: boolean;
		/** Track + bg accent (only the swooping bg circle is tinted; knob always stays white). */
		color?: Color;
		/** Knob content (rendered inside the circle — small icon). */
		knob?: Snippet;
		/** On-state inline label/icon (rendered in the track when checked). */
		iconOn?: Snippet;
		/** Off-state inline label/icon (rendered in the track when unchecked). */
		iconOff?: Snippet;
		/** Fired on toggle. */
		onchange?: (event: Event, checked: boolean) => void;
	} & Omit<HTMLInputAttributes, 'type' | 'checked' | 'children' | 'onchange' | 'size'>;
</script>

<script lang="ts">
	import { Tween } from 'svelte/motion';
	import { cubicOut, backOut } from 'svelte/easing';
	import { rgbTriplet } from '../../utils/color';
	import { cn } from '../../utils/cn';
	import Spinner from '../../primitives/Spinner.svelte';

	let {
		checked = $bindable(false),
		shape = 'default',
		size = 'medium',
		indeterminate = false,
		loading = false,
		ghostKnob = false,
		color = 'primary',
		knob,
		iconOn,
		iconOff,
		onchange,
		disabled = false,
		class: className,
		style: userStyle,
		...rest
	}: SwitchProps = $props();

	let triplet = $derived(rgbTriplet(color));

	const pressScale = new Tween(1, { duration: 110, easing: cubicOut });
	let pressToken = 0;

	async function runPress(): Promise<void> {
		if (disabled || loading || indeterminate) return;
		const token = ++pressToken;
		pressScale.set(1, { duration: 0 });
		await pressScale.set(0.88, { duration: 110, easing: cubicOut });
		if (token !== pressToken) return;
		await pressScale.set(1, { duration: 460, easing: backOut });
	}

	function handlePointerDown(event: PointerEvent): void {
		if (disabled || loading || indeterminate) return;
		if (event.button !== 0 && event.pointerType === 'mouse') return;
		void runPress();
	}

	function handleKeyDown(event: KeyboardEvent): void {
		if (disabled || loading || indeterminate) return;
		if (event.repeat) return;
		if (event.key !== ' ') return;
		void runPress();
	}

	function handleChange(event: Event): void {
		if (indeterminate || loading || disabled) {
			(event.currentTarget as HTMLInputElement).checked = checked;
			return;
		}
		const next = (event.currentTarget as HTMLInputElement).checked;
		checked = next;
		onchange?.(event, next);
	}
</script>

<div
	class={cn(
		'switch',
		`switch--size-${size}`,
		ghostKnob && 'switch--icon',
		indeterminate && 'switch--indeterminate',
		loading && 'switch--loading',
		disabled && 'switch--disabled',
		className
	)}
	style:--c={triplet}
	style:--ps={pressScale.current}
	style:--track-radius={shape === 'square' ? '5px' : null}
	style:--inner-radius={shape === 'square' ? '5px' : null}
	style={userStyle}
	data-shape={shape}
	data-testid="switch"
>
	<input
		type="checkbox"
		role="switch"
		class="switch__input"
		checked={checked || indeterminate}
		{disabled}
		aria-checked={indeterminate ? 'mixed' : checked ? 'true' : 'false'}
		onchange={handleChange}
		onpointerdown={handlePointerDown}
		onkeydown={handleKeyDown}
		{...rest}
	/>
	<div class="switch__circle">
		{#if knob}{@render knob()}{/if}
	</div>
	<div class="switch__text switch__text--on" aria-hidden="true">
		{#if iconOn}{@render iconOn()}{/if}
	</div>
	<div class="switch__text switch__text--off" aria-hidden="true">
		{#if iconOff}{@render iconOff()}{/if}
	</div>
	<div class="switch__background" aria-hidden="true"></div>
	{#if loading}
		<span class="switch__loading" aria-hidden="true">
			<Spinner color={color} size={24} thickness={3.2} speed={800} />
		</span>
	{/if}
</div>

<style>
	:where(.switch) {
		--c: var(--primary);
		--track-w: 48px;
		--track-h: 28px;
		--knob-d: 20px;
		--knob-pad: 4px;
		--track-radius: 20px;
		--inner-radius: 50%;
		position: relative;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-width: var(--track-w);
		height: var(--track-h);
		padding: var(--knob-pad);
		border: 0;
		border-radius: var(--track-radius);
		/* Slight bump from pure gray-2 so the small track reads against the page bg in both themes. */
		background: color-mix(in oklab, rgb(var(--gray-2)), rgb(var(--text)) 7%);
		color: rgb(255 255 255);
		cursor: pointer;
		overflow: hidden;
		box-sizing: border-box;
		transform: scale(var(--ps, 1));
		transform-origin: center;
		transition: background-color 0.25s;
	}
	.switch:hover:not(.switch--disabled):not(.switch--loading) {
		background: color-mix(in oklab, rgb(var(--gray-2)), rgb(var(--text)) 14%);
	}
	:where(.switch--disabled) { opacity: 0.5; pointer-events: none; }

	:where(.switch--size-small) {
		--track-w: 38px;
		--track-h: 22px;
		--knob-d: 16px;
		--knob-pad: 3px;
		--track-radius: 16px;
	}
	:where(.switch--size-large) {
		--track-w: 60px;
		--track-h: 36px;
		--knob-d: 26px;
		--knob-pad: 5px;
		--track-radius: 24px;
	}

	.switch__input {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		margin: 0;
		border-radius: inherit;
		cursor: pointer;
		opacity: 0;
		z-index: 100;
	}

	.switch__circle {
		position: absolute;
		left: var(--knob-pad);
		width: var(--knob-d);
		height: var(--knob-d);
		border-radius: var(--inner-radius);
		background: color-mix(in oklab, rgb(var(--gray-2)), rgb(var(--on-accent)) 0%);
		color: rgb(var(--text));
		box-shadow: 0 1px 2px rgb(0 0 0 / 0.12);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 10;
		transition: 0.25s;
	}

	/* Active "drag" — knob widens toward the slide direction. */
	.switch__input:active ~ .switch__circle {
		width: calc(var(--knob-d) + 5px);
	}
	.switch__input:active:checked ~ .switch__circle {
		left: calc(100% - var(--knob-d) - var(--knob-pad) - 6px);
	}

	/* Settled checked position. */
	.switch__input:checked ~ .switch__circle {
		left: calc(100% - var(--knob-d) - var(--knob-pad));
		color: rgb(var(--c));
		box-shadow: -5px 0 25px 0 rgb(var(--background) / 0.6);
	}

	/*
	 * Background swoop: a circle 100% wide × 100% padding-bottom (so it's a
	 * perfect circle equal in size to the track width). Sits at left:-100%
	 * when off, slides to left:0 and fills the track when on.
	 */
	.switch__background {
		position: absolute;
		left: -100%;
		width: 100%;
		height: auto;
		padding-bottom: 100%;
		background: rgb(var(--c));
		border-radius: var(--inner-radius);
		opacity: 0;
		transform: scale(1);
		transition: 0.25s ease-out;
		z-index: 2;
	}
	.switch__input:checked ~ .switch__background {
		opacity: 1;
		left: 0;
	}

	/*
	 * Inline labels/icons. Default padding shifts the content RIGHT of the
	 * knob (knob sits on the left in OFF state). On toggle, padding flips
	 * via :checked override and the .on/.off pair swap places via translate.
	 */
	.switch__text {
		position: relative;
		z-index: 9;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 5px 5px 5px 25px;
		font-size: 0.7rem;
		color: rgb(var(--text));
		white-space: nowrap;
		overflow: hidden;
		transition: 0.25s 0.05s;
	}
	.switch__text--on {
		position: absolute;
		opacity: 0;
		transform: translateX(-100%);
	}
	.switch__input:checked ~ .switch__text {
		padding-left: 5px;
		padding-right: 25px;
		color: rgb(255 255 255);
	}
	.switch__input:checked ~ .switch__text--on {
		position: relative;
		opacity: 1;
		transform: translateX(0);
	}
	.switch__input:checked ~ .switch__text--off {
		position: absolute;
		opacity: 0;
		transform: translateX(100%);
	}

	/* Icon-knob (ghost) — strip the white pill, keep only the knob's icon. */
	.switch--icon .switch__circle {
		background: transparent !important;
		box-shadow: none !important;
	}
	.switch--icon .switch__input:checked ~ .switch__circle {
		color: rgb(255 255 255) !important;
	}

	/* Indeterminate — knob centered. */
	.switch--indeterminate .switch__input { pointer-events: none; }
	.switch--indeterminate .switch__circle {
		left: 50% !important;
		transform: translateX(-50%);
	}

	/* Loading — collapses track to a circle and shows the kit spinner overlay. */
	:where(.switch--loading) {
		min-width: var(--track-h) !important;
		width: var(--track-h) !important;
		border-radius: 50% !important;
		pointer-events: none;
	}
	.switch--loading .switch__circle,
	.switch--loading .switch__background,
	.switch--loading .switch__text {
		opacity: 0 !important;
	}
	.switch__loading {
		position: absolute;
		inset: 2px;
		display: flex;
		align-items: center;
		justify-content: center;
		pointer-events: none;
		z-index: 200;
	}
</style>
