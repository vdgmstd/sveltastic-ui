<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { HTMLInputAttributes } from 'svelte/elements';
	import type { Color } from '../../types';

	export type CheckboxProps<V = unknown> = {
		/** Boolean checked state. Use `bind:checked` for two-way control. Mutually exclusive with `group`. */
		checked?: boolean;
		/** Array membership mode. Use `bind:group` with a shared array; `value` is the membership token. */
		group?: V[];
		/** The value this checkbox contributes to `group`. Required when `group` is bound. */
		value?: V;
		/** Third-state visual; renders a minus glyph instead of the check. */
		indeterminate?: boolean;
		/** Strike through the label when checked. */
		lineThrough?: boolean;
		/** Spinner overlay; blocks interaction. */
		loading?: boolean;
		/** Label placement relative to the box. */
		labelPosition?: 'before' | 'after';
		/** Palette name or hex / rgb. */
		color?: Color;
		/** Custom glyph rendered when checked (replaces the default check). */
		iconChecked?: Snippet;
		/** Label content. */
		children?: Snippet;
		/** Fired on native change. The second arg is the next checked state. */
		onchange?: (event: Event, checked: boolean) => void;
	} & Omit<HTMLInputAttributes, 'type' | 'checked' | 'value' | 'children' | 'onchange'>;
</script>

<script lang="ts" generics="V">
	import { untrack } from 'svelte';
	import { Tween } from 'svelte/motion';
	import { cubicOut, backOut } from 'svelte/easing';
	import { rgbTriplet } from '../../utils/color';
	import { cn } from '../../utils/cn';
	import { nextId } from '../../state/ids.svelte';
	import Spinner from '../../primitives/Spinner.svelte';

	let {
		checked = $bindable(false),
		group = $bindable(),
		value,
		indeterminate = false,
		lineThrough = false,
		loading = false,
		labelPosition = 'after',
		color = 'primary',
		iconChecked,
		children,
		onchange,
		id: idProp,
		disabled = false,
		class: className,
		style: userStyle,
		...rest
	}: CheckboxProps<V> = $props();

	const fallbackId = nextId('checkbox');
	let id = $derived(idProp ?? fallbackId);
	let triplet = $derived(rgbTriplet(color));

	let isChecked = $derived(
		group !== undefined && value !== undefined ? group.includes(value) : !!checked
	);

	let fillTarget = $derived(loading ? 0 : isChecked || indeterminate ? 1 : 0);
	let drawTarget = $derived(isChecked && !indeterminate && !loading ? 1 : 0);
	let showGlyph = $derived(drawTarget === 1);
	let minusTarget = $derived(indeterminate && !loading ? 1 : 0);
	let lineTarget = $derived(lineThrough && isChecked ? 1 : 0);

	const fillTween = new Tween(untrack(() => fillTarget), { duration: 260, easing: cubicOut });
	const drawTween = new Tween(untrack(() => drawTarget), { duration: 320, easing: cubicOut });
	const minusTween = new Tween(untrack(() => minusTarget), { duration: 220, easing: cubicOut });
	const lineTween = new Tween(untrack(() => lineTarget), { duration: 260, easing: cubicOut });
	$effect(() => {
		const next = fillTarget;
		fillTween.set(next, {
			duration: 260,
			easing: cubicOut,
			delay: next === 1 && pressColor ? 50 : 0
		});
	});
	$effect(() => {
		const next = drawTarget;
		drawTween.set(next, {
			duration: next === 1 ? 460 : 220,
			easing: cubicOut,
			delay: next === 1 && pressColor ? 130 : 0
		});
	});
	$effect(() => { minusTween.target = minusTarget; });
	$effect(() => { lineTween.target = lineTarget; });

	function handleChange(event: Event): void {
		const next = (event.currentTarget as HTMLInputElement).checked;
		if (group !== undefined && value !== undefined) {
			const present = group.includes(value);
			if (next && !present) group = [...group, value];
			else if (!next && present) group = group.filter((v: V) => v !== value);
		} else {
			checked = next;
		}
		onchange?.(event, next);
	}

	let inputEl: HTMLInputElement | undefined = $state();
	$effect(() => {
		if (inputEl) inputEl.indeterminate = indeterminate;
	});

	const pressScale = new Tween(1, { duration: 110, easing: cubicOut });
	let isPressing = $state(false);
	let pressColor = $state(false);
	let pressToken = 0;

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
</script>

<label
	class={cn(
		'checkbox',
		isChecked && 'checkbox--checked',
		disabled && 'checkbox--disabled',
		loading && 'checkbox--loading',
		labelPosition === 'before' && 'checkbox--label-before',
		indeterminate && 'checkbox--indeterminate',
		isPressing && 'checkbox--pressing',
		pressColor && 'checkbox--press-color',
		showGlyph && 'checkbox--show-glyph',
		className
	)}
	for={id}
	style:--c={triplet}
	style:--fp={fillTween.current}
	style:--dp={drawTween.current}
	style:--mp={minusTween.current}
	style:--lt={lineTween.current}
	style:--ps={pressScale.current}
	style={userStyle}
	data-testid="checkbox"
	onpointerdown={handlePointerDown}
>
	<span class="checkbox__box">
		<input
			bind:this={inputEl}
			type="checkbox"
			class="checkbox__input"
			{id}
			checked={isChecked}
			{disabled}
			onchange={handleChange}
			onkeydown={handleKeyDown}
			{...rest}
		/>
		<span class="checkbox__mask" aria-hidden="true">
			{#if iconChecked}
				<span class="checkbox__glyph checkbox__glyph--custom">
					{@render iconChecked()}
				</span>
			{:else}
				<span class="checkbox__glyph checkbox__glyph--draw">
					<svg viewBox="0 0 24 24" fill="none">
						<path
							d="M5 12 L10 17 L19 7"
							stroke="currentColor"
							stroke-width="3"
							stroke-linecap="round"
							stroke-linejoin="round"
						/>
					</svg>
				</span>
			{/if}
			<span class="checkbox__glyph checkbox__glyph--minus">
				<svg viewBox="0 0 24 24" fill="none">
					<path
						d="M5 12 L19 12"
						stroke="currentColor"
						stroke-width="3"
						stroke-linecap="round"
					/>
				</svg>
			</span>
			{#if loading}
				<span class="checkbox__loading" aria-hidden="true">
					<Spinner {color} size={20} thickness={2.8} speed={800} />
				</span>
			{/if}
		</span>
	</span>
	{#if children}
		<span class="checkbox__label" class:lineThrough>
			{@render children()}
		</span>
	{/if}
</label>

<style>
	:where(.checkbox) {
		--c: var(--primary);
		--fp: 0;
		--dp: 0;
		--mp: 0;
		--lt: 0;
		display: inline-flex;
		align-items: center;
		gap: 6px;
		font-size: 0.9rem;
		user-select: none;
	}
	.checkbox--label-before .checkbox__label {
		order: -1;
	}
	.checkbox__box {
		position: relative;
		width: 24px;
		height: 24px;
		flex: 0 0 24px;
		transform: scale(var(--ps, 1));
		transform-origin: center;
	}
	.checkbox__input {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		margin: 0;
		opacity: 0;
		cursor: pointer;
	}
	.checkbox__input:disabled {
		cursor: not-allowed;
	}
	.checkbox__mask {
		position: absolute;
		inset: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 32%;
		box-sizing: border-box;
		pointer-events: none;
		transition:
			background-color 180ms cubic-bezier(0.4, 0, 0.2, 1),
			box-shadow 180ms cubic-bezier(0.4, 0, 0.2, 1);
	}
	.checkbox__mask::before {
		content: '';
		position: absolute;
		inset: 0;
		border: 2px solid rgb(var(--text) / 0.15);
		border-radius: inherit;
		box-sizing: border-box;
		opacity: calc(1 - var(--fp));
		transform: scale(calc(1 + 0.2 * var(--fp)));
		z-index: 1;
		transition: border-color 140ms cubic-bezier(0.4, 0, 0.2, 1);
	}
	.checkbox--press-color .checkbox__mask::before {
		border-color: rgb(var(--c));
	}
	.checkbox__mask::after {
		content: '';
		position: absolute;
		inset: 0;
		background: rgb(var(--c));
		border-radius: inherit;
		opacity: var(--fp);
		transform: scale(calc(0.5 + 0.5 * var(--fp)));
	}
	.checkbox__glyph {
		position: absolute;
		inset: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		color: rgb(var(--on-accent));
		z-index: 2;
	}
	.checkbox__glyph--draw svg,
	.checkbox__glyph--minus svg {
		display: block;
		width: 16px;
		height: 16px;
	}
	.checkbox__glyph--draw path {
		stroke-dasharray: 21;
		stroke-dashoffset: calc(21 * (1 - var(--dp)));
	}
	.checkbox__glyph--minus svg {
		transform: scaleX(var(--mp));
		transform-origin: center;
	}
	.checkbox__glyph--custom {
		opacity: 0;
		transform: scale(0.4);
		transform-origin: center;
		transition:
			opacity 220ms cubic-bezier(0.4, 0, 0.2, 1),
			transform 280ms cubic-bezier(0.34, 1.56, 0.64, 1);
	}
	.checkbox--show-glyph .checkbox__glyph--custom {
		opacity: 1;
		transform: scale(1);
	}
	.checkbox__glyph--draw {
		opacity: 0;
		transition: opacity 60ms linear;
	}
	.checkbox--show-glyph .checkbox__glyph--draw {
		opacity: 1;
	}
	.checkbox--checked .checkbox__input:hover ~ .checkbox__mask,
	.checkbox--indeterminate .checkbox__input:hover ~ .checkbox__mask {
		box-shadow: 0 3px 15px 0 rgb(var(--c) / 0.35);
	}

	.checkbox__label {
		position: relative;
		padding: 7px 4px;
		cursor: pointer;
	}
	.checkbox__label::before {
		content: '';
		position: absolute;
		left: 4px;
		top: 50%;
		width: calc(var(--lt) * (100% - 8px));
		height: 2px;
		background: rgb(var(--text) / 0.6);
	}
	.lineThrough {
		opacity: calc(1 - 0.6 * var(--lt));
	}

	:where(.checkbox--disabled) {
		pointer-events: none;
	}
	.checkbox--disabled .checkbox__label {
		opacity: 0.5;
	}
	.checkbox--disabled .checkbox__mask {
		opacity: 0.6;
	}

	.checkbox--loading {
		pointer-events: none;
	}
	.checkbox--loading .checkbox__mask {
		background: transparent !important;
	}
	.checkbox--loading .checkbox__mask::before { opacity: 0; }
	.checkbox--loading .checkbox__glyph { opacity: 0; }

	.checkbox__loading {
		position: absolute;
		inset: 2px;
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 3;
		pointer-events: none;
	}

	</style>
