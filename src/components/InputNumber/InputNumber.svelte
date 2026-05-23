<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { Color, Shape, Size } from '../../types';

	export type InputNumberProps = {
		/** Current value (bindable). */
		value?: number;
		/** Minimum value (inclusive). */
		min?: number;
		/** Maximum value (inclusive). */
		max?: number;
		/** Increment step. Used by buttons, native ↑/↓ keys, and long-press repeat. */
		step?: number;
		/** Visual size — matches the kit's `Size` scale. */
		size?: Size;
		/** Border-radius shape. */
		shape?: Shape;
		/** Stretch to container width. */
		block?: boolean;
		/** Disabled. */
		disabled?: boolean;
		/** Read-only — buttons + field both inert; value cannot change. */
		readonly?: boolean;
		/** Field accent color — drives focus ripple and outline. Defaults to `primary`. */
		color?: Color;
		/** Color for the `+` (increment) button hover/press tint. Falls back to `color`. */
		incrementColor?: Color;
		/** Color for the `−` (decrement) button hover/press tint. Falls back to `color`. */
		decrementColor?: Color;
		/** Override the decrement button glyph. */
		decrementIcon?: Snippet;
		/** Override the increment button glyph. */
		incrementIcon?: Snippet;
		/** Aria-label for the decrement button. */
		decrementLabel?: string;
		/** Aria-label for the increment button. */
		incrementLabel?: string;
		/** Tween duration (ms) for the rolling digits. Same time regardless of step. Defaults to 500. */
		animationDuration?: number;
		/** @deprecated Use `shape="square"`. */
		square?: boolean;
		/** Fired on every committed value change (after clamping). */
		onchange?: (value: number) => void;
		/** Class merged onto the root. */
		class?: string;
		/** Inline style merged onto the root. */
		style?: string;
	};
</script>

<script lang="ts">
	import { untrack } from 'svelte';
	import { Tween } from 'svelte/motion';
	import { cubicOut, backOut } from 'svelte/easing';
	import { MinusIcon, PlusIcon } from 'phosphor-svelte';
	import { rgbTriplet } from '../../utils/color';
	import { cn } from '../../utils/cn';
	import { decimalsFromStep } from '../../utils/number';
	import { AnimatedNumber } from '../../utils/animatedNumber.svelte';
	import { surfaceRipple } from '../../actions/surfaceRipple.svelte';

	let {
		value = $bindable(0),
		min = -Infinity,
		max = Infinity,
		step = 1,
		size = 'medium',
		shape,
		block = false,
		disabled = false,
		readonly = false,
		color = 'primary',
		incrementColor,
		decrementColor,
		decrementIcon,
		incrementIcon,
		decrementLabel = 'Decrement',
		incrementLabel = 'Increment',
		animationDuration = 500,
		square = false,
		onchange,
		class: className,
		style: userStyle
	}: InputNumberProps = $props();

	let triplet = $derived(rgbTriplet(color));
	let incTriplet = $derived(rgbTriplet(incrementColor ?? color));
	let decTriplet = $derived(rgbTriplet(decrementColor ?? color));
	let resolvedShape = $derived<Shape>(shape ?? (square ? 'square' : 'default'));
	let isInert = $derived(disabled || readonly);
	let canDec = $derived(!isInert && value > min);
	let canInc = $derived(!isInert && value < max);
	let hasAnim = $derived(step !== 1 || Number.isFinite(min) || Number.isFinite(max));
	let iconPx = $derived.by(() => {
		switch (size) {
			case 'xl': return 18;
			case 'large': return 16;
			case 'small': return 12;
			case 'mini': return 11;
			default: return 14;
		}
	});

	function clamp(n: number): number {
		return Math.min(max, Math.max(min, n));
	}

	function set(n: number): void {
		if (isInert) return;
		const next = clamp(n);
		if (Number.isNaN(next) || next === value) return;
		value = next;
		onchange?.(next);
	}

	function bump(direction: 1 | -1): void {
		set(value + direction * step);
	}

	function handleInput(event: Event): void {
		const el = event.currentTarget as HTMLInputElement;
		const cleaned = sanitize(el.value);
		if (cleaned !== el.value) {
			const pos = (el.selectionStart ?? cleaned.length) - (el.value.length - cleaned.length);
			el.value = cleaned;
			try { el.setSelectionRange(pos, pos); } catch {  }
		}
		if (cleaned === '' || cleaned === '-' || cleaned === '.' || cleaned === '-.') return;
		const num = Number(cleaned);
		if (!Number.isNaN(num)) set(num);
	}

	function sanitize(raw: string): string {
		let out = '';
		let seenDot = false;
		for (let i = 0; i < raw.length; i++) {
			const ch = raw[i];
			if (ch === '-' && i === 0) { out += ch; continue; }
			if ((ch === '.' || ch === ',') && !seenDot) { out += '.'; seenDot = true; continue; }
			if (ch >= '0' && ch <= '9') out += ch;
		}
		return out;
	}

	function handleKeydown(event: KeyboardEvent): void {
		if (isInert) return;
		if (event.key === 'ArrowUp') {
			event.preventDefault();
			bump(1);
		} else if (event.key === 'ArrowDown') {
			event.preventDefault();
			bump(-1);
		}
	}

	let isEditing = $state(false);
	const displayed = untrack(() => new AnimatedNumber(value, { duration: animationDuration }));
	$effect(() => { displayed.duration = animationDuration; });

	let decimals = $derived(decimalsFromStep(step));
	let displayedText = $derived.by(() => {
		const n = displayed.current;
		if (!Number.isFinite(n)) return '';
		if (isEditing) return String(n);
		return n.toFixed(decimals);
	});

	$effect(() => {
		const target = value;
		if (isEditing || !hasAnim) displayed.snap(target);
		else displayed.target = target;
	});

	const HOLD_DELAY = 500;
	const REPEAT_INITIAL = 90;
	const REPEAT_FAST = 50;
	const REPEAT_FASTEST = 28;
	let holdTimer: number | undefined;
	let repeatTimer: number | undefined;
	let didHold = false;

	function clearHold(): void {
		if (holdTimer !== undefined) {
			window.clearTimeout(holdTimer);
			holdTimer = undefined;
		}
		if (repeatTimer !== undefined) {
			window.clearTimeout(repeatTimer);
			repeatTimer = undefined;
		}
	}

	function scheduleRepeat(direction: 1 | -1, ticks: number): void {
		const interval =
			ticks > 20 ? REPEAT_FASTEST : ticks > 8 ? REPEAT_FAST : REPEAT_INITIAL;
		repeatTimer = window.setTimeout(() => {
			if ((direction === 1 && value >= max) || (direction === -1 && value <= min)) {
				clearHold();
				return;
			}
			bump(direction);
			scheduleRepeat(direction, ticks + 1);
		}, interval);
	}

	const decPress = new Tween(1, { duration: 110, easing: cubicOut });
	const incPress = new Tween(1, { duration: 110, easing: cubicOut });
	let decToken = 0;
	let incToken = 0;

	async function runPress(direction: 1 | -1): Promise<void> {
		if (isInert) return;
		if (direction === 1 && !canInc) return;
		if (direction === -1 && !canDec) return;
		const tween = direction === 1 ? incPress : decPress;
		const token = direction === 1 ? ++incToken : ++decToken;
		tween.set(1, { duration: 0 });
		await tween.set(0.85, { duration: 110, easing: cubicOut });
		if (token !== (direction === 1 ? incToken : decToken)) return;
		await tween.set(1, { duration: 460, easing: backOut });
	}

	function startHold(direction: 1 | -1): void {
		didHold = false;
		clearHold();
		if (isInert) return;
		holdTimer = window.setTimeout(() => {
			didHold = true;
			holdTimer = undefined;
			bump(direction);
			scheduleRepeat(direction, 1);
		}, HOLD_DELAY);
	}

	function handleClick(direction: 1 | -1): void {
		if (didHold) {
			didHold = false;
			return;
		}
		bump(direction);
	}

	$effect(() => () => clearHold());

	function handleFocus(): void {
		isEditing = true;
		displayed.snap(value);
	}

	function handleBlur(): void {
		isEditing = false;
	}
</script>

<div
	class={cn(
		'input-number',
		`input-number--size-${size}`,
		`input-number--shape-${resolvedShape}`,
		block && 'input-number--block',
		disabled && 'input-number--disabled',
		readonly && 'input-number--readonly',
		className
	)}
	style:--c={triplet}
	style={userStyle}
	data-testid="input-number"
>
	<button
		type="button"
		class="input-number__btn input-number__btn--dec"
		style:--c-btn={decTriplet}
		style:--ps={decPress.current}
		aria-label={decrementLabel}
		onclick={() => handleClick(-1)}
		onpointerdown={() => { startHold(-1); void runPress(-1); }}
		onpointerup={clearHold}
		onpointerleave={clearHold}
		onpointercancel={clearHold}
		onblur={clearHold}
		disabled={!canDec}
	>
		{#if decrementIcon}{@render decrementIcon()}{:else}<MinusIcon size={iconPx} weight="bold" />{/if}
	</button>
	<div class="input-number__field" use:surfaceRipple={{ mode: 'focus', disabled: isInert }}>
		<input
			class="input-number__input"
			type="text"
			inputmode="decimal"
			autocomplete="off"
			autocorrect="off"
			spellcheck="false"
			role="spinbutton"
			aria-valuenow={value}
			aria-valuemin={Number.isFinite(min) ? min : undefined}
			aria-valuemax={Number.isFinite(max) ? max : undefined}
			aria-valuetext={displayedText}
			value={displayedText}
			disabled={disabled}
			readonly={readonly}
			oninput={handleInput}
			onkeydown={handleKeydown}
			onfocus={handleFocus}
			onblur={handleBlur}
		/>
	</div>
	<button
		type="button"
		class="input-number__btn input-number__btn--inc"
		style:--c-btn={incTriplet}
		style:--ps={incPress.current}
		aria-label={incrementLabel}
		onclick={() => handleClick(1)}
		onpointerdown={() => { startHold(1); void runPress(1); }}
		onpointerup={clearHold}
		onpointerleave={clearHold}
		onpointercancel={clearHold}
		onblur={clearHold}
		disabled={!canInc}
	>
		{#if incrementIcon}{@render incrementIcon()}{:else}<PlusIcon size={iconPx} weight="bold" />{/if}
	</button>
</div>

<style>
	:where(.input-number) {
		--c: var(--primary);
		--inb-radius: var(--radius);
		display: inline-flex;
		align-items: stretch;
		background: rgb(var(--gray-2));
		border-radius: var(--inb-radius);
		overflow: hidden;
		transition: outline-color 200ms cubic-bezier(0.4, 0, 0.2, 1);
		outline: 2px solid transparent;
		outline-offset: 2px;
	}
	:where(.input-number--block) {
		display: flex;
		width: 100%;
	}
	.input-number--block .input-number__field {
		flex: 1 1 auto;
		min-width: 0;
	}
	.input-number--block .input-number__input { width: 100%; }

	:where(.input-number--disabled) { opacity: 0.5; pointer-events: none; }

	:where(.input-number--shape-square) { border-radius: 0; }
	:where(.input-number--shape-circle) { border-radius: 50vmax; }

	.input-number:has(.input-number__input:focus-visible) {
		outline-color: rgb(var(--c) / 0.55);
	}

	.input-number__field {
		position: relative;
		display: flex;
		align-items: stretch;
		flex: 0 0 auto;
		overflow: hidden;
	}
	.input-number__input {
		position: relative;
		z-index: 1;
		padding: 7px 6px;
		width: 8ch;
		text-align: center;
		border: 0;
		background: transparent;
		color: inherit;
		font: inherit;
		font-size: inherit;
		font-variant-numeric: tabular-nums;
		outline: none;
	}
	.input-number__input:disabled { cursor: not-allowed; }
	@media (pointer: coarse) {
		.input-number__input { font-size: max(16px, 1em); }
	}

	.input-number__btn {
		--c-btn: var(--c);
		position: relative;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		flex: 0 0 auto;
		width: 32px;
		padding: 0;
		background: transparent;
		border: 0;
		color: rgb(var(--text) / 0.55);
		cursor: pointer;
		font: inherit;
		outline: none;
		overflow: hidden;
		transition:
			color 260ms cubic-bezier(0.33, 1, 0.68, 1),
			background-color 260ms cubic-bezier(0.33, 1, 0.68, 1);
	}
	.input-number__btn::before {
		content: '';
		position: absolute;
		inset: 0;
		background: rgb(var(--c-btn) / 0.28);
		opacity: 0;
		transform: scale(0.6);
		border-radius: inherit;
		pointer-events: none;
		transition:
			transform 280ms cubic-bezier(0.33, 1, 0.68, 1),
			opacity 220ms cubic-bezier(0.33, 1, 0.68, 1);
		z-index: 0;
	}
	.input-number__btn > :global(*) {
		position: relative;
		z-index: 1;
		transform: scale(var(--ps, 1));
		transform-origin: center;
	}
	.input-number__btn:hover:not(:disabled) {
		background: rgb(var(--c-btn) / 0.15);
		color: rgb(var(--c-btn));
	}
	.input-number__btn:active:not(:disabled)::before {
		opacity: 1;
		transform: scale(1.02);
		transition:
			transform 200ms cubic-bezier(0.34, 1.56, 0.64, 1),
			opacity 120ms cubic-bezier(0.4, 0, 0.2, 1);
	}
	.input-number__btn:focus-visible {
		outline: 2px solid rgb(var(--c-btn) / 0.55);
		outline-offset: -3px;
	}
	.input-number__btn:disabled {
		color: rgb(var(--text) / 0.2);
		cursor: not-allowed;
	}
	.input-number:has(.input-number__input:focus) .input-number__btn:not(:hover):not(:disabled) {
		color: rgb(var(--c-btn) / 0.65);
	}

	.input-number__btn :global(svg) {
		transition: transform 250ms cubic-bezier(0.34, 1.56, 0.64, 1);
	}
	.input-number__btn:hover:not(:disabled) :global(svg) {
		transform: scale(1.18);
	}
	.input-number__btn:active:not(:disabled) :global(svg) {
		transform: scale(1.08);
		transition: transform 140ms cubic-bezier(0.34, 1.56, 0.64, 1);
	}

	:where(.input-number--size-xl) { font-size: 1.1rem; --inb-radius: 20px; }
	.input-number--size-xl .input-number__btn { width: 44px; }
	.input-number--size-xl .input-number__input { padding: 14px 8px; width: 8ch; }

	:where(.input-number--size-large) { font-size: 1rem; --inb-radius: 15px; }
	.input-number--size-large .input-number__btn { width: 38px; }
	.input-number--size-large .input-number__input { padding: 9px 7px; width: 8ch; }

	:where(.input-number--size-medium) { font-size: 0.85rem; --inb-radius: 12px; }
	.input-number--size-medium .input-number__btn { width: 32px; }
	.input-number--size-medium .input-number__input { padding: 7px 6px; width: 8ch; }

	:where(.input-number--size-small) { font-size: 0.75rem; --inb-radius: 9px; }
	.input-number--size-small .input-number__btn { width: 28px; }
	.input-number--size-small .input-number__input { padding: 5px 5px; width: 8ch; }

	:where(.input-number--size-mini) { font-size: 0.65rem; --inb-radius: 7px; }
	.input-number--size-mini .input-number__btn { width: 24px; }
	.input-number--size-mini .input-number__input { padding: 3px 4px; width: 8ch; }

	.input-number--shape-square.input-number--size-xl,
	.input-number--shape-square.input-number--size-large,
	.input-number--shape-square.input-number--size-medium,
	.input-number--shape-square.input-number--size-small,
	.input-number--shape-square.input-number--size-mini { border-radius: 0; }
	.input-number--shape-circle.input-number--size-xl,
	.input-number--shape-circle.input-number--size-large,
	.input-number--shape-circle.input-number--size-medium,
	.input-number--shape-circle.input-number--size-small,
	.input-number--shape-circle.input-number--size-mini { border-radius: 50vmax; }
</style>
