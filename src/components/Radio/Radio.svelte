<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { HTMLInputAttributes } from 'svelte/elements';
	import type { Color } from '../../types';

	export type RadioValue = string | number;

	export type RadioProps<V extends RadioValue = RadioValue> = {
		/** The token this radio represents. Selected when `group === value`. */
		value: V;
		/** Currently selected token in the group; bind with `bind:group`. */
		group?: V;
		/** Native input `name` attribute. Auto-generated if omitted. */
		name?: string;
		/** Spinner overlay. */
		loading?: boolean;
		/** Label placement relative to the disc. */
		labelPosition?: 'before' | 'after';
		/** Palette name or hex / rgb. */
		color?: Color;
		/** Glyph rendered as the active indicator. Hidden until selected. */
		icon?: Snippet;
		/** Label content. */
		children?: Snippet;
		/** Fired on selection. */
		onchange?: (event: Event, value: V) => void;
	} & Omit<HTMLInputAttributes, 'type' | 'value' | 'children' | 'name' | 'onchange'>;
</script>

<script lang="ts" generics="V extends RadioValue">
	import { untrack } from 'svelte';
	import { Tween } from 'svelte/motion';
	import { cubicOut, backOut } from 'svelte/easing';
	import { rgbTriplet } from '../../utils/color';
	import { cn } from '../../utils/cn';
	import { nextId } from '../../state/ids.svelte';
	import Spinner from '../../primitives/Spinner.svelte';

	let {
		value,
		group = $bindable(),
		name,
		loading = false,
		labelPosition = 'after',
		color = 'primary',
		icon,
		children,
		onchange,
		id: idProp,
		disabled = false,
		class: className,
		style: userStyle,
		...rest
	}: RadioProps<V> = $props();

	const fallbackId = nextId('radio');
	const fallbackName = nextId('radio-name');
	let id = $derived(idProp ?? fallbackId);
	let resolvedName = $derived(name ?? fallbackName);
	let triplet = $derived(rgbTriplet(color));
	let isChecked = $derived(group === value);

	let activeTarget = $derived(isChecked && !loading ? 1 : 0);
	const activeTween = new Tween(untrack(() => activeTarget), { duration: 260, easing: cubicOut });

	const pressScale = new Tween(1, { duration: 110, easing: cubicOut });
	let isPressing = $state(false);
	let pressColor = $state(false);
	let pressToken = 0;

	$effect(() => {
		const next = activeTarget;
		activeTween.set(next, {
			duration: 260,
			easing: cubicOut,
			delay: next === 1 && pressColor ? 50 : 0
		});
	});

	async function runPress(): Promise<void> {
		if (disabled || loading) return;
		const token = ++pressToken;
		pressScale.set(1, { duration: 0 });
		isPressing = true;
		pressColor = !isChecked;
		await pressScale.set(0.85, { duration: 110, easing: cubicOut });
		if (token !== pressToken) return;
		await pressScale.set(1, { duration: 460, easing: backOut });
		if (token !== pressToken) return;
		isPressing = false;
		pressColor = false;
	}

	function handlePointerDown(event: PointerEvent): void {
		if (disabled || loading) return;
		if (event.button !== 0 && event.pointerType === 'mouse') return;
		void runPress();
	}

	function handleKeyDown(event: KeyboardEvent): void {
		if (disabled || loading) return;
		if (event.repeat) return;
		if (event.key !== ' ') return;
		void runPress();
	}

	function handleChange(event: Event): void {
		const next = (event.currentTarget as HTMLInputElement).checked;
		if (next) {
			group = value;
			onchange?.(event, value);
		}
	}
</script>

<label
	class={cn(
		'radio',
		isChecked && 'radio--active',
		disabled && 'radio--disabled',
		loading && 'radio--loading',
		!!icon && 'radio--has-icon',
		labelPosition === 'before' && 'radio--label-before',
		isPressing && 'radio--pressing',
		pressColor && 'radio--press-color',
		className
	)}
	for={id}
	style:--c={triplet}
	style:--ap={activeTween.current}
	style:--ps={pressScale.current}
	style={userStyle}
	data-testid="radio"
	onpointerdown={handlePointerDown}
>
	{#if children && labelPosition === 'before'}
		<span class="radio__label">{@render children()}</span>
	{/if}
	<span class="radio__disc">
		<input
			type="radio"
			class="radio__input"
			{id}
			name={resolvedName}
			value={String(value)}
			checked={isChecked}
			{disabled}
			onchange={handleChange}
			onkeydown={handleKeyDown}
			{...rest}
		/>
		<span class="radio__effect" aria-hidden="true">
			{#if icon}
				<span class="radio__icon">{@render icon()}</span>
			{/if}
			<span class="radio__mark"></span>
			{#if loading}
				<span class="radio__loading">
					<Spinner color={color} size={18} thickness={2.4} speed={800} />
				</span>
			{/if}
		</span>
	</span>
	{#if children && labelPosition !== 'before'}
		<span class="radio__label">{@render children()}</span>
	{/if}
</label>

<style>
	:where(.radio) {
		--c: var(--primary);
		--ap: 0;
		display: inline-flex;
		align-items: center;
		gap: 6px;
		font-size: 0.9rem;
		user-select: none;
	}
	.radio__disc {
		position: relative;
		width: 20px;
		height: 20px;
		flex: 0 0 20px;
		border-radius: 50%;
		transform: scale(var(--ps, 1));
		transform-origin: center;
	}
	.radio__input {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		margin: 0;
		opacity: 0;
		cursor: pointer;
	}
	.radio__effect {
		position: absolute;
		inset: 0;
		border-radius: inherit;
		display: flex;
		align-items: center;
		justify-content: center;
		pointer-events: none;
	}
	.radio__effect::after {
		content: '';
		position: absolute;
		inset: 0;
		border-radius: inherit;
		border: 2px solid color-mix(in oklab, rgb(var(--text) / 0.15), rgb(var(--c)) calc(var(--ap) * 100%));
		background: rgb(var(--c) / var(--ap));
		box-shadow: 0 3px 12px 0 rgb(var(--c) / calc(0.3 * var(--ap)));
		box-sizing: border-box;
	}
	.radio__icon {
		position: relative;
		display: inline-flex;
		font-size: 0.75rem;
		color: rgb(var(--on-accent));
		z-index: 1;
		transform: scale(var(--ap));
	}
	.radio--press-color .radio__effect::after {
		border-color: rgb(var(--c));
	}
	.radio__mark {
		position: relative;
		width: 8px;
		height: 8px;
		border-radius: 50%;
		background: rgb(var(--on-accent));
		transform: scale(var(--ap));
		z-index: 1;
	}
	.radio--has-icon .radio__mark {
		display: none;
	}

	.radio__label {
		cursor: pointer;
		padding: 0 6px;
	}
	.radio--label-before .radio__label:first-child {
		padding-right: 6px;
		padding-left: 0;
	}

	:where(.radio--disabled) {
		opacity: 0.5;
		pointer-events: none;
	}
	:where(.radio--loading) {
		pointer-events: none;
	}
	.radio__loading {
		position: absolute;
		inset: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: inherit;
		pointer-events: none;
	}
	.radio--loading .radio__effect::after {
		opacity: 0.1;
	}

	</style>
