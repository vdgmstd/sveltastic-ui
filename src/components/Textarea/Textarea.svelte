<script lang="ts" module>
	import type { HTMLTextareaAttributes } from 'svelte/elements';
	import type { Color } from '../../types';
	import type { InputState, InputLabelStyle, InputVariant } from '../Input/Input.svelte';
	import type { MaskOptions } from '../../actions/mask';

	export type TextareaProps = {
		/** Bound text value. */
		value?: string;
		/** Static label (above) or floating placeholder. */
		label?: string;
		/** Placeholder text. Renders as a fake placeholder that fades on focus. */
		placeholder?: string;
		/** Label behavior. */
		labelStyle?: InputLabelStyle;
		/** Visual variant. */
		variant?: InputVariant;
		/** State color. */
		fieldState?: InputState;
		/** Stretch to container. */
		block?: boolean;
		/** Auto-grow with content. */
		autoGrow?: boolean;
		/** Custom palette accent. */
		color?: Color;
		/** Mask pattern — string, alternatives array, or full maska options. Tokens: `#` digit, `@` letter, `*` alphanumeric. */
		mask?: MaskOptions;
	} & Omit<HTMLTextareaAttributes, 'value' | 'children' | 'placeholder'>;
</script>

<script lang="ts">
	import { tick, untrack } from 'svelte';
	import { Tween } from 'svelte/motion';
	import { cubicOut } from 'svelte/easing';
	import { rgbTriplet } from '../../utils/color';
	import { cn } from '../../utils/cn';
	import { nextId } from '../../state/ids.svelte';
	import { surfaceRipple } from '../../actions/surfaceRipple.svelte';
	import { mask as maskAction } from '../../actions/mask';

	let {
		value = $bindable(''),
		label,
		placeholder,
		labelStyle = 'default',
		variant = 'default',
		fieldState = 'default',
		block = false,
		autoGrow = false,
		color,
		mask,
		id: idProp,
		oninput,
		onfocus,
		onblur,
		class: className,
		style: userStyle,
		...rest
	}: TextareaProps = $props();

	const fallbackId = nextId('textarea');
	let id = $derived(idProp ?? fallbackId);
	let triplet = $derived(rgbTriplet(fieldState === 'default' ? (color ?? 'primary') : fieldState));
	let textareaEl: HTMLTextAreaElement | undefined = $state();
	let focused = $state(false);
	let isFloating = $derived(labelStyle === 'placeholder');
	let isInline = $derived(labelStyle === 'inline');
	let hasValue = $derived(value !== undefined && value !== '');
	let placeholderText = $derived(placeholder ?? (isFloating ? label : ''));
	let staticLabelText = $derived(!isInline && !isFloating ? label : undefined);
	let isStateVariant = $derived(fieldState !== 'default');

	let lhTarget = $derived(isFloating ? (focused || hasValue ? 1 : 0) : 0);
	let fpTarget = $derived(focused ? 1 : 0);
	let vpTarget = $derived(hasValue ? 1 : 0);
	const lhTween = new Tween(untrack(() => lhTarget), { duration: 220, easing: cubicOut });
	const fpTween = new Tween(untrack(() => fpTarget), { duration: 220, easing: cubicOut });
	const vpTween = new Tween(untrack(() => vpTarget), { duration: 200, easing: cubicOut });
	$effect(() => { lhTween.target = lhTarget; });
	$effect(() => { fpTween.target = fpTarget; });
	$effect(() => {
		if (vpTarget === 1) vpTween.set(1, { duration: 0 });
		else vpTween.target = vpTarget;
	});

	async function grow(): Promise<void> {
		if (!autoGrow || !textareaEl) return;
		await tick();
		textareaEl.style.height = 'auto';
		textareaEl.style.height = `${textareaEl.scrollHeight}px`;
	}

	$effect(() => {
		void value;
		grow();
	});

	function handleInput(event: Event): void {
		value = (event.currentTarget as HTMLTextAreaElement).value;
		oninput?.(event as Event & { currentTarget: EventTarget & HTMLTextAreaElement });
		grow();
	}

	function handleFocus(event: FocusEvent & { currentTarget: EventTarget & HTMLTextAreaElement }): void {
		focused = true;
		onfocus?.(event);
	}

	function handleBlur(event: FocusEvent & { currentTarget: EventTarget & HTMLTextAreaElement }): void {
		focused = false;
		onblur?.(event);
	}
</script>

<div
	class={cn(
		'textarea',
		block && 'textarea--block',
		!!label && 'textarea--has-label',
		isInline && 'textarea--label-inline',
		isFloating && 'textarea--label-placeholder',
		variant === 'border' && 'textarea--variant-border',
		variant === 'shadow' && 'textarea--variant-shadow',
		isStateVariant && 'textarea--state',
		fieldState === 'primary' && 'textarea--state-primary',
		fieldState === 'success' && 'textarea--state-success',
		fieldState === 'danger' && 'textarea--state-danger',
		fieldState === 'warning' && 'textarea--state-warn',
		fieldState === 'dark' && 'textarea--state-dark',
		className
	)}
	style:--c={triplet}
	style:--lh={lhTween.current}
	style:--fp={fpTween.current}
	style:--vp={vpTween.current}
	style={userStyle}
	data-testid="textarea"
>
	{#if label && isInline}
		<label class="textarea__label-block" for={id}>{label}</label>
	{/if}
	<div class="textarea__field-wrap" use:surfaceRipple={{ mode: 'focus', disabled: variant === 'border' }}>
		<textarea
			bind:this={textareaEl}
			class="textarea__field"
			{id}
			{value}
			placeholder=""
			oninput={handleInput}
			onfocus={handleFocus}
			onblur={handleBlur}
			use:maskAction={mask}
			{...rest}
		></textarea>
		{#if placeholderText || staticLabelText}
			<label
				class="textarea__label"
				class:textarea__label--placeholder={isFloating}
				class:textarea__label--label={!!staticLabelText && !isFloating}
				for={id}
			>
				{staticLabelText ?? placeholderText}
			</label>
		{/if}
		{#if variant === 'border'}
			<span class="textarea__underline" aria-hidden="true"></span>
		{/if}
		{#if variant === 'shadow'}
			<span class="textarea__shadow" aria-hidden="true"></span>
		{/if}
	</div>
</div>

<style>
	:where(.textarea) {
		--c: var(--primary);
		--lh: 0;
		--fp: 0;
		--vp: 0;
		display: inline-flex;
		flex-direction: column;
		gap: 0;
		position: relative;
	}
	:where(.textarea--block) { display: flex; width: 100%; }
	:where(.textarea--has-label) { padding-top: 22px; }
	.textarea__label-block {
		position: absolute;
		left: 0.8rem;
		top: 0;
		font-size: 0.75rem;
		line-height: 1.4;
		color: color-mix(in oklab, rgb(var(--text) / 0.7), rgb(var(--c)) calc(var(--fp) * 100%));
	}
	.textarea--state .textarea__label-block { color: rgb(var(--c)); }
	.textarea__field-wrap {
		position: relative;
		display: flex;
		border-radius: 12px;
		background: rgb(var(--gray-2));
	}
	.textarea--block .textarea__field-wrap { width: 100%; }

	.textarea__field {
		position: relative;
		z-index: 1;
		width: 200px;
		min-height: 80px;
		padding: 8px calc(13px + 5px * var(--fp));
		background: transparent;
		border: 2px solid transparent;
		border-radius: inherit;
		color: rgb(var(--text));
		font: inherit;
		font-size: 0.85rem;
		line-height: 1.4;
		resize: vertical;
		outline: none;
		box-sizing: border-box;
	}
	.textarea--block .textarea__field { width: 100%; }
	@media (pointer: coarse) {
		.textarea__field { font-size: max(16px, 1em); }
	}

	.textarea__label {
		position: absolute;
		left: calc(13px + 7px * max(var(--fp), var(--vp)));
		top: 8px;
		font-size: 0.85rem;
		line-height: 1.4;
		cursor: text;
		user-select: none;
		pointer-events: none;
		opacity: calc(0.4 * (1 - max(var(--fp), var(--vp))));
		color: rgb(var(--text));
		transform-origin: left top;
		z-index: 2;
	}
	.textarea__label--placeholder {
		left: calc(13px + (0.8rem - 13px) * var(--lh));
		transform: translateY(calc(-30px * var(--lh)));
		font-size: calc(0.85rem - 0.10rem * var(--lh));
		opacity: calc(0.4 + 0.6 * var(--lh));
		color: color-mix(in oklab, rgb(var(--text)), rgb(var(--c)) calc(var(--lh) * 100%));
	}
	.textarea__label--label {
		left: 0.8rem;
		top: -22px;
		font-size: 0.75rem;
		opacity: 1;
		color: color-mix(in oklab, rgb(var(--text) / 0.7), rgb(var(--c)) calc(var(--fp) * 100%));
	}

	.textarea--state .textarea__label,
	.textarea--state .textarea__label--label { color: rgb(var(--c)); }

	.textarea--variant-border .textarea__field-wrap { border-radius: 0; background: transparent; }
	.textarea--variant-border .textarea__field {
		background: transparent;
		border: 0;
		border-radius: 0;
	}
	.textarea__underline {
		position: absolute;
		left: 0;
		bottom: 0;
		width: 100%;
		height: 2px;
		background: rgb(var(--text) / 0.25);
		pointer-events: none;
		z-index: 2;
	}
	.textarea__underline::after {
		content: '';
		position: absolute;
		left: 50%;
		bottom: 0;
		width: calc(100% * var(--fp));
		height: 100%;
		background: rgb(var(--c));
		transform: translateX(-50%);
	}

	.textarea--variant-shadow .textarea__field-wrap { background: transparent; }
	.textarea--variant-shadow .textarea__field {
		background: transparent;
		border: 2px solid transparent;
		border-radius: 12px;
	}
	.textarea__shadow {
		position: absolute;
		inset: 0;
		border: 2px solid rgb(var(--c) / calc(0.45 * var(--fp)));
		border-radius: inherit;
		box-shadow:
			0 calc(14px + 14px * var(--fp)) calc(32px + 28px * var(--fp)) -6px rgb(0 0 0 / calc(0.22 + 0.06 * var(--fp))),
			0 calc(5px + 13px * var(--fp)) calc(12px + 28px * var(--fp)) -2px rgb(var(--c) / calc(0.32 * var(--fp))),
			0 0 0 calc(6px * var(--fp)) rgb(var(--c) / calc(0.1 * var(--fp)));
		pointer-events: none;
		z-index: 0;
	}

	.textarea--state .textarea__field {
		background: rgb(var(--c) / calc(0.1 + 0.06 * var(--fp)));
		color: rgb(var(--c));
	}

	.textarea__field:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
</style>
