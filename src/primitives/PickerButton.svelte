<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { Color } from '../types';

	export type PickerButtonVariant =
		| 'cell'
		| 'option'
		| 'icon'
		| 'chip';

	export type PickerButtonProps = {
		/** Visual role inside the picker. Drives sizing + corner shape. */
		variant?: PickerButtonVariant;
		/** Palette accent fed to the kit ripple action. Defaults to `'primary'`. */
		color?: Color;
		/** Highlighted as picked (filled accent). */
		selected?: boolean;
		/** Outlined "current" (today / current month / current year). */
		current?: boolean;
		/** Inside an unfinished range — soft accent fill, square corners. */
		inRange?: boolean;
		/** Range start — selected with rounded-only-left corners. */
		rangeStart?: boolean;
		/** Range end — selected with rounded-only-right corners. */
		rangeEnd?: boolean;
		/** Hover-preview tail for an unfinished range. */
		preview?: boolean;
		/** Day from the neighbouring month — dimmed. */
		muted?: boolean;
		/** Standard disabled. */
		disabled?: boolean;
		/** Roving tabindex flag. */
		focused?: boolean;
		/** ARIA. */
		ariaLabel?: string;
		ariaSelected?: boolean;
		ariaCurrent?: 'date' | 'true' | undefined;
		ariaDisabled?: boolean;
		role?: string;
		children?: Snippet;
		onclick?: (e: MouseEvent) => void;
		onpointerenter?: (e: PointerEvent) => void;
		onfocus?: (e: FocusEvent) => void;
	};
</script>

<script lang="ts">
	import { Tween } from 'svelte/motion';
	import { cubicOut, backOut } from 'svelte/easing';
	import { ripple } from '../actions/ripple.svelte';
	import { rgbTriplet } from '../utils/color';

	let {
		variant = 'cell',
		color = 'primary',
		selected = false,
		current = false,
		inRange = false,
		rangeStart = false,
		rangeEnd = false,
		preview = false,
		muted = false,
		disabled = false,
		focused = false,
		ariaLabel,
		ariaSelected,
		ariaCurrent,
		ariaDisabled,
		role,
		children,
		onclick,
		onpointerenter,
		onfocus
	}: PickerButtonProps = $props();

	let solidBg = $derived(selected || rangeStart || rangeEnd);
	let triplet = $derived(rgbTriplet(color));
	let rippleRadius = $derived(
		variant === 'cell' ? '7px' : variant === 'icon' ? '8px' : '9px'
	);

	const pressScale = new Tween(1, { duration: 110, easing: cubicOut });
	let pressToken = 0;

	async function runPress(): Promise<void> {
		if (disabled || variant === 'cell') return;
		const token = ++pressToken;
		pressScale.set(1, { duration: 0 });
		await pressScale.set(0.85, { duration: 110, easing: cubicOut });
		if (token !== pressToken) return;
		await pressScale.set(1, { duration: 460, easing: backOut });
	}

	function handleClick(e: MouseEvent): void {
		void runPress();
		onclick?.(e);
	}
</script>

<button
	type="button"
	class="picker-btn picker-btn--{variant}"
	class:picker-btn--selected={selected}
	class:picker-btn--current={current}
	class:picker-btn--in-range={inRange}
	class:picker-btn--range-start={rangeStart}
	class:picker-btn--range-end={rangeEnd}
	class:picker-btn--preview={preview}
	class:picker-btn--muted={muted}
	class:picker-btn--disabled={disabled}
	style:--c={triplet}
	style:--ps={pressScale.current}
	{disabled}
	{role}
	tabindex={focused ? 0 : -1}
	aria-label={ariaLabel}
	aria-selected={ariaSelected}
	aria-current={ariaCurrent}
	aria-disabled={ariaDisabled}
	use:ripple={{ disabled: disabled || variant === 'cell', solidBg, color, radius: rippleRadius }}
	onclick={handleClick}
	{onpointerenter}
	{onfocus}
>
	<span class="picker-btn__label">{@render children?.()}</span>
</button>

<style>
	.picker-btn {
		--h: 32px;
		--w: auto;
		--r: 9px;
		--c-text: rgb(var(--c));
		position: relative;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 4px;
		width: var(--w);
		height: var(--h);
		min-width: var(--h);
		padding: 0 8px;
		border: 0;
		background: transparent;
		color: inherit;
		font: inherit;
		font-size: var(--pb-font, 0.78rem);
		font-weight: 400;
		line-height: var(--line-height);
		border-radius: var(--r);
		cursor: pointer;
		transform: scale(var(--ps, 1));
		transform-origin: center;
		transition:
			background-color 320ms cubic-bezier(0.215, 0.61, 0.355, 1),
			color 140ms cubic-bezier(0.215, 0.61, 0.355, 1),
			box-shadow 320ms cubic-bezier(0.215, 0.61, 0.355, 1);
	}

	.picker-btn__label {
		position: relative;
		z-index: 1001;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: inherit;
		pointer-events: none;
	}

	.picker-btn--cell {
		--h: var(--pb-cell-h, 28px);
		--w: var(--pb-cell-h, 28px);
		--r: var(--pb-cell-r, 7px);
		padding: 0;
		font-size: var(--pb-cell-font, 0.78rem);
	}
	.picker-btn--option {
		--h: var(--pb-option-h, 36px);
		--w: 100%;
		padding: 0 var(--pb-option-pad-x, 6px);
		font-size: var(--pb-option-font, 0.8rem);
	}
	.picker-btn--icon {
		--h: var(--pb-icon-h, 28px);
		--w: var(--pb-icon-h, 28px);
		--r: var(--pb-icon-r, 8px);
		padding: 0;
	}
	.picker-btn--chip {
		--h: var(--pb-chip-h, 28px);
		padding: 0 var(--pb-chip-pad-x, 8px);
		font-size: var(--pb-chip-font, 0.78rem);
		font-weight: 500;
	}

	.picker-btn:hover:not(.picker-btn--disabled):not(.picker-btn--selected):not(.picker-btn--range-start):not(.picker-btn--range-end) {
		background: rgb(var(--c) / 0.12);
		color: var(--c-text);
	}

	.picker-btn--muted { color: rgb(var(--text) / 0.32); }

	.picker-btn--current {
		box-shadow: inset 0 0 0 1px rgb(var(--c));
		color: var(--c-text);
	}

	.picker-btn--cell.picker-btn--in-range,
	.picker-btn--cell.picker-btn--preview {
		color: var(--c-text);
	}

	.picker-btn--cell.picker-btn--selected,
	.picker-btn--cell.picker-btn--range-start,
	.picker-btn--cell.picker-btn--range-end {
		color: rgb(255 255 255);
	}

	.picker-btn--option.picker-btn--selected,
	.picker-btn--chip.picker-btn--selected {
		background: rgb(var(--c));
		color: rgb(255 255 255);
		box-shadow: 0 6px 18px -6px rgb(var(--c) / 0.55);
	}

	.picker-btn--disabled {
		opacity: 0.35;
		cursor: not-allowed;
	}

	.picker-btn:focus-visible {
		outline: 2px solid rgb(var(--c) / 0.6);
		outline-offset: -2px;
	}
</style>
