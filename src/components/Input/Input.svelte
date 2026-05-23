<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { HTMLInputAttributes } from 'svelte/elements';
	import type { Color, ColorName } from '../../types';
	import type { MaskOptions } from '../../actions/mask';

	export type InputVariant = 'default' | 'border' | 'shadow';
	export type InputLabelStyle = 'default' | 'placeholder' | 'inline';
	export type InputShape = 'default' | 'square';
	export type InputState = 'default' | 'primary' | 'success' | 'danger' | 'warning' | 'dark';

	export type InputProps = {
		/** Bound input value (strings only — for numbers/dates use `bind:value` and let `type` coerce). */
		value?: string;
		/** Visual style. */
		variant?: InputVariant;
		/** Label placement / behaviour. */
		labelStyle?: InputLabelStyle;
		/** Label text. */
		label?: string;
		/** Placeholder text. Renders as a fake placeholder that fades on focus. */
		placeholder?: string;
		/** Shape of the field. */
		shape?: InputShape;
		/** Stretch to container. */
		block?: boolean;
		/** Icon side. */
		iconPosition?: 'before' | 'after';
		/** Spinner overlay. */
		loading?: boolean;
		/** Eye-toggle button when `type === 'password'`. */
		passwordReveal?: boolean;
		/** Tints background / label / icon. Named `fieldState` to avoid colliding with the `$state` rune. */
		fieldState?: InputState;
		/** 0..100 progress bar at the bottom. */
		progress?: number;
		/** Drop background. */
		transparent?: boolean;
		/** Custom palette color. */
		color?: Color;
		/** When set, the icon background fills with this color on focus (and the glyph turns white). When unset, only the glyph color changes on focus. */
		iconColor?: Color;
		/** Mask pattern — string (e.g. `'###-###'`), alternatives array, or full maska options. Tokens: `#` digit, `@` letter, `*` alphanumeric. */
		mask?: MaskOptions;
		/** Leading / trailing glyph. */
		icon?: Snippet;
		/** Feedback message under the field; color follows `fieldState`. */
		message?: Snippet;
		/**
		 * Replaces the inner `<input>` element with arbitrary content (chips, filter input, custom display).
		 * The shell — bg, focus-ripple, label, icon button with `iconColor` focus-fill, variant + state styling —
		 * is preserved. The consumer is responsible for wiring their own `<input>` (mask / `value` / `oninput`)
		 * within the snippet. Receives the wrapper id and current focus state.
		 */
		field?: Snippet<[{ id: string; focused: boolean }]>;
		/**
		 * External force-focused override. When `true`, the field renders as if focused (icon lifts, ripple fills,
		 * label floats) regardless of real DOM focus. For composite controls (Select / DateTimePicker) that own
		 * their own activation state and need the trigger to look active while a popover is open.
		 */
		forceFocus?: boolean;
		/** Fires when the icon is clicked. */
		oniconclick?: (event: MouseEvent) => void;
	} & Omit<HTMLInputAttributes, 'value' | 'children'>;
</script>

<script lang="ts">
	import { untrack } from 'svelte';
	import { Tween } from 'svelte/motion';
	import { slide } from 'svelte/transition';
	import { cubicInOut, cubicOut, backOut } from 'svelte/easing';
	import { EyeIcon, EyeSlashIcon } from 'phosphor-svelte';
	import { rgbTriplet } from '../../utils/color';
	import { cn } from '../../utils/cn';
	import { nextId } from '../../state/ids.svelte';
	import { surfaceRipple } from '../../actions/surfaceRipple.svelte';
	import { mask as maskAction, maskHint } from '../../actions/mask';
	import Spinner from '../../primitives/Spinner.svelte';

	let {
		value = $bindable(''),
		variant = 'default',
		labelStyle = 'default',
		label,
		placeholder,
		shape = 'default',
		block = false,
		iconPosition = 'before',
		loading = false,
		passwordReveal = false,
		fieldState = 'default',
		progress = 0,
		transparent = false,
		color,
		iconColor,
		mask,
		icon,
		message,
		field,
		forceFocus = false,
		oniconclick,
		id: idProp,
		type = 'text',
		disabled = false,
		readonly = false,
		oninput,
		onfocus: consumerOnFocus,
		onblur: consumerOnBlur,
		class: className,
		style: userStyle,
		...rest
	}: InputProps = $props();

	const fallbackId = nextId('input');
	let id = $derived(idProp ?? fallbackId);
	let resolvedColor = $derived<Color>(
		fieldState === 'default' ? (color ?? 'primary') : (fieldState as ColorName)
	);
	let triplet = $derived(rgbTriplet(resolvedColor));
	let iconTriplet = $derived(iconColor ? rgbTriplet(iconColor) : null);
	let progressKind = $derived.by<'danger' | 'warn' | 'success' | null>(() => {
		if (progress <= 0) return null;
		if (progress < 33) return 'danger';
		if (progress < 66) return 'warn';
		return 'success';
	});
	let isPassword = $derived(type === 'password');
	let isPasswordRevealed = $state(false);
	let resolvedType = $derived(isPassword && passwordReveal && isPasswordRevealed ? 'text' : type);
	let isInline = $derived(labelStyle === 'inline');
	let isFloating = $derived(labelStyle === 'placeholder');
	let hasValue = $derived(value !== undefined && value !== '');
	let placeholderText = $derived(placeholder ?? (isFloating ? label : ''));
	let staticLabelText = $derived(!isInline && !isFloating ? label : undefined);
	let isPlainSurface = $derived(
		variant === 'default' && fieldState === 'default' && !transparent
	);
	let isStateVariant = $derived(fieldState !== 'default');
	let isIconFillBg = $derived(!!iconColor);
	let maskTemplate = $derived(mask ? maskHint(mask) : '');
	let typedLen = $derived(Math.min((value ?? '').length, maskTemplate.length));
	let maskRemainder = $derived(maskTemplate ? maskTemplate.slice(typedLen) : '');

	let iconButtonEl: HTMLButtonElement | undefined = $state();
	let iconFillX = $state(0);
	let iconFillY = $state(0);
	let iconFillSize = $state(0);
	let focused = $state(false);
	let pointerFocus = false;

	let focusedActive = $derived(focused || forceFocus);
	let lhTarget = $derived(isFloating ? (focusedActive || hasValue ? 1 : 0) : 0);
	let showMask = $derived(!!maskTemplate && (!isFloating || focusedActive || hasValue));
	let fpTarget = $derived(focusedActive ? 1 : 0);
	let vpTarget = $derived(hasValue ? 1 : 0);
	let progressTarget = $derived(progress);
	const lhTween = new Tween(untrack(() => lhTarget), { duration: 220, easing: cubicOut });
	const fpTween = new Tween(untrack(() => fpTarget), { duration: 250, easing: cubicOut });
	const ifsTween = new Tween(0, { duration: 0, easing: cubicOut });
	const vpTween = new Tween(untrack(() => vpTarget), { duration: 200, easing: cubicOut });
	const ifpTween = new Tween(0, { duration: 450, easing: cubicOut });
	const progressTween = new Tween(untrack(() => progressTarget), { duration: 250, easing: cubicOut });
	let iconPulseToken = 0;
	$effect(() => { lhTween.target = lhTarget; });
	$effect(() => { fpTween.target = fpTarget; });

	async function runIconPulse(): Promise<void> {
		const token = ++iconPulseToken;
		ifsTween.set(0, { duration: 0 });
		await ifsTween.set(1, { duration: 180, easing: cubicOut });
		if (token !== iconPulseToken) return;
		await ifsTween.set(0, { duration: 480, easing: backOut });
	}
	$effect(() => {
		if (vpTarget === 1) vpTween.set(1, { duration: 0 });
		else vpTween.target = vpTarget;
	});
	$effect(() => { progressTween.target = progressTarget; });

	function handleInput(event: Event): void {
		value = (event.currentTarget as HTMLInputElement).value;
		oninput?.(event as Event & { currentTarget: EventTarget & HTMLInputElement });
	}

	function handleIconClick(event: MouseEvent): void {
		oniconclick?.(event);
	}

	function togglePassword(): void {
		isPasswordRevealed = !isPasswordRevealed;
	}

	function handleMouseDown(): void {
		pointerFocus = true;
		setTimeout(() => { pointerFocus = false; }, 0);
	}

	function isNativeInput(target: EventTarget | null): target is HTMLInputElement {
		return target instanceof HTMLInputElement && target.classList.contains('input__el');
	}

	function handleFieldFocusin(event: FocusEvent): void {
		if (focused) return;
		focused = true;
		const target = event.target;
		if (isNativeInput(target)) {
			if (maskTemplate && !pointerFocus) {
				const inputEl = target;
				const pos = (value ?? '').length;
				setTimeout(() => {
					if (document.activeElement === inputEl) {
						try { inputEl.setSelectionRange(pos, pos); } catch {  }
					}
				}, 0);
			}
			consumerOnFocus?.(event as FocusEvent & { currentTarget: EventTarget & HTMLInputElement });
		}
	}

	function handleFieldFocusout(event: FocusEvent): void {
		const next = event.relatedTarget as Node | null;
		const field = event.currentTarget as HTMLElement;
		if (next && field.contains(next)) return;
		focused = false;
		if (isNativeInput(event.target)) {
			consumerOnBlur?.(event as FocusEvent & { currentTarget: EventTarget & HTMLInputElement });
		}
	}

	let prevFocusedActive = false;
	$effect(() => {
		const now = focusedActive;
		if (now && !prevFocusedActive) {
			if (icon) void runIconPulse();
			if (icon && iconButtonEl) {
				const r = iconButtonEl.getBoundingClientRect();
				const x = Math.random() * r.width;
				const y = Math.random() * r.height;
				iconFillX = x;
				iconFillY = y;
				iconFillSize = Math.ceil(
					Math.max(
						Math.hypot(x, y),
						Math.hypot(r.width - x, y),
						Math.hypot(x, r.height - y),
						Math.hypot(r.width - x, r.height - y)
					) * 2.2
				);
				ifpTween.target = 1;
			}
		} else if (!now && prevFocusedActive) {
			ifpTween.target = 0;
		}
		prevFocusedActive = now;
	});
</script>

<div
	class={cn(
		'input',
		block && 'input--block',
		!!label && 'input--has-label',
		isInline && 'input--label-inline',
		isFloating && 'input--label-placeholder',
		!!icon && 'input--has-icon',
		!!icon && iconPosition === 'after' && 'input--has-icon-after',
		variant === 'border' && 'input--variant-border',
		variant === 'shadow' && 'input--variant-shadow',
		transparent && 'input--transparent',
		shape === 'square' && 'input--shape-square',
		isPlainSurface && 'input--plain',
		isIconFillBg && 'input--icon-fill-bg',
		focusedActive && 'input--focused',
		isStateVariant && 'input--state',
		fieldState === 'primary' && 'input--state-primary',
		fieldState === 'success' && 'input--state-success',
		fieldState === 'danger' && 'input--state-danger',
		fieldState === 'warning' && 'input--state-warn',
		fieldState === 'dark' && 'input--state-dark',
		className
	)}
	style:--c={triplet}
	style:--icon-c={iconTriplet ?? undefined}
	style:--lh={lhTween.current}
	style:--fp={fpTween.current}
	style:--ifs={ifsTween.current}
	style:--vp={vpTween.current}
	style:--ifp={ifpTween.current}
	style:--pp={`${progressTween.current}%`}
	style:--mask-len={maskTemplate.length}
	style={userStyle}
	data-testid="input"
>
	{#if label && isInline}
		<label class="input__label-block" for={id}>{label}</label>
	{/if}
	<div
		class="input__field"
		class:input__field--has-icon={!!icon}
		class:input__field--icon-after={iconPosition === 'after'}
		onfocusin={handleFieldFocusin}
		onfocusout={handleFieldFocusout}
		use:surfaceRipple={{ mode: 'focus', disabled: variant === 'border' }}
	>
		{#if field}
			<div
				class="input__el input__el--slot"
				class:input__el--has-icon={!!icon}
				class:input__el--icon-after={iconPosition === 'after'}
			>
				{@render field({ id, focused })}
			</div>
		{:else}
			<input
				class="input__el"
				class:input__el--has-icon={!!icon}
				class:input__el--icon-after={iconPosition === 'after'}
				{id}
				bind:value
				type={resolvedType}
				placeholder=""
				{disabled}
				{readonly}
				aria-invalid={fieldState === 'danger'}
				aria-describedby={message ? `${id}-message` : undefined}
				oninput={handleInput}
				onmousedown={handleMouseDown}
				use:maskAction={mask}
				{...rest}
			/>
		{/if}
		{#if showMask && !field}
			<span
				class="input__mask"
				class:input__mask--has-icon={!!icon && iconPosition !== 'after'}
				class:input__mask--icon-after={iconPosition === 'after'}
				aria-hidden="true"
			>
				<span class="input__mask-typed">{(value ?? '').slice(0, typedLen)}</span><span class="input__mask-rest">{maskRemainder}</span>
			</span>
		{/if}
		{#if !field && ((placeholderText && (isFloating || !maskTemplate)) || staticLabelText)}
			<label
				class="input__label"
				class:input__label--placeholder={isFloating}
				class:input__label--label={!!staticLabelText && !isFloating}
				class:input__label--hidden={hasValue}
				for={id}
			>
				{staticLabelText ?? placeholderText}
			</label>
		{/if}
		{#if icon}
			<button
				type="button"
				class="input__icon"
				class:input__icon--after={iconPosition === 'after'}
				class:input__icon--clickable={!!oniconclick}
				tabindex={oniconclick ? 0 : -1}
				disabled={!oniconclick}
				onclick={handleIconClick}
				aria-hidden={!oniconclick}
				bind:this={iconButtonEl}
			>
				{#if isPlainSurface && isIconFillBg}
					<span
						class="input__icon-ripple"
						style:--icon-fill-x="{iconFillX}px"
						style:--icon-fill-y="{iconFillY}px"
						style:--icon-fill-size="{iconFillSize}px"
						aria-hidden="true"
					></span>
				{/if}
				<span class="input__icon-glyph">
					{@render icon()}
				</span>
				{#if isPlainSurface && !isIconFillBg}
					<span
						class="input__icon-glyph input__icon-glyph--reveal"
						style:--icon-fill-x="{iconFillX}px"
						style:--icon-fill-y="{iconFillY}px"
						style:--icon-fill-size="{iconFillSize}px"
						aria-hidden="true"
					>
						{@render icon()}
					</span>
				{/if}
			</button>
		{/if}
		{#if isPassword && passwordReveal && !field}
			<button
				type="button"
				class="input__reveal"
				onclick={togglePassword}
				aria-label={isPasswordRevealed ? 'Hide password' : 'Show password'}
			>
				{#if isPasswordRevealed}
					<EyeSlashIcon size={18} weight="regular" />
				{:else}
					<EyeIcon size={18} weight="regular" />
				{/if}
			</button>
		{/if}
		{#if loading}
			<span class="input__loading" aria-hidden="true">
				<Spinner color={color} size={22} thickness={3} speed={800} />
			</span>
		{/if}
		{#if variant === 'border'}
			<span class="input__underline" aria-hidden="true"></span>
		{/if}
		{#if variant === 'shadow'}
			<span class="input__shadow" aria-hidden="true"></span>
		{/if}
	</div>
	{#if progressKind}
		<div class="input__progress input__progress--{progressKind}">
			<div class="input__progress-bar" style:width="var(--pp)"></div>
		</div>
	{/if}
	{#if message}
		<div
			class="input__message"
			id={`${id}-message`}
			role={fieldState === 'danger' ? 'alert' : 'status'}
			transition:slide={{ duration: 250, easing: cubicInOut }}
		>
			{@render message()}
		</div>
	{/if}
</div>

<style>
	:where(.input) {
		--c: var(--primary);
		--icon-c: var(--c);
		--lh: 0;
		--fp: 0;
		--ifs: 0;
		--vp: 0;
		--ifp: 0;
		--pp: 0%;
		display: inline-flex;
		flex-direction: column;
		position: relative;
		max-width: 100%;
	}
	.input__field {
		max-width: 100%;
	}
	:where(.input--block) {
		display: flex;
		width: 100%;
	}
	.input--label-placeholder,
	.input--has-label:not(.input--label-placeholder):not(.input--label-inline) {
		margin-top: 20px;
	}

	.input__label-block {
		display: block;
		font-size: 0.75rem;
		margin-bottom: 4px;
		margin-left: 0.8rem;
		color: color-mix(in oklab, rgb(var(--text) / 0.7), rgb(var(--c)) calc(var(--fp) * 100%));
	}
	.input--state-primary .input__label-block,
	.input--state-success .input__label-block,
	.input--state-danger .input__label-block,
	.input--state-warn .input__label-block,
	.input--state-dark .input__label-block { color: rgb(var(--c)); }
	.input__field {
		position: relative;
		display: flex;
		align-items: center;
		border-radius: 12px;
	}
	.input--shape-square .input__field { border-radius: 0; }

	.input__el {
		width: 200px;
		min-width: calc(var(--mask-len, 0) * 1ch + 32px);
		min-height: 38px;
		padding: 7px calc(13px + 5px * var(--fp));
		border: 2px solid transparent;
		border-radius: inherit;
		background: rgb(var(--gray-2));
		color: rgb(var(--text));
		font-family: inherit;
		font-size: 0.85rem;
		line-height: 1.2;
		font-variant-numeric: tabular-nums;
		outline: none;
		box-sizing: border-box;
		text-overflow: ellipsis;
	}
	.input--block .input__el { width: 100%; min-width: 0; }
	.input__el:disabled { opacity: 0.5; cursor: not-allowed; }
	@media (pointer: coarse) {
		.input__el { font-size: max(16px, 1em); }
	}
	.input__el--has-icon:not(.input__el--icon-after),
	.input__el--has-icon.input__el--icon-after { min-width: calc(var(--mask-len, 0) * 1ch + 64px); }
	.input__el--has-icon:not(.input__el--icon-after) { padding-left: calc(38px + 2px * var(--fp)); }
	.input__el--has-icon.input__el--icon-after { padding-right: calc(38px + 2px * var(--fp)); }

	.input__el.input__el--slot {
		display: flex;
		align-items: center;
		gap: 5px;
		width: auto;
		min-width: 200px;
		max-width: 100%;
		min-height: 38px;
		padding-top: 0;
		padding-bottom: 0;
	}
	.input--block .input__el.input__el--slot { width: 100%; min-width: 0; }

	.input__mask {
		position: absolute;
		inset: 0;
		display: flex;
		align-items: center;
		padding: 7px calc(13px + 5px * var(--fp));
		border: 2px solid transparent;
		box-sizing: border-box;
		font: inherit;
		font-size: 0.85rem;
		font-variant-numeric: tabular-nums;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		pointer-events: none;
		color: rgb(var(--text) / 0.4);
		z-index: 1;
	}
	.input__mask--has-icon { padding-left: calc(38px + 2px * var(--fp)); }
	.input__mask--icon-after { padding-right: calc(38px + 2px * var(--fp)); }
	.input__mask-typed { color: transparent; }
	.input__mask-rest { color: inherit; }

	.input__label {
		position: absolute;
		left: calc(13px + 7px * max(var(--fp), var(--vp)));
		top: 0;
		font-size: 0.85rem;
		cursor: text;
		user-select: none;
		pointer-events: none;
		height: 100%;
		display: flex;
		align-items: center;
		opacity: calc(0.4 * (1 - max(var(--fp), var(--vp))));
		color: rgb(var(--text));
		transform-origin: left center;
	}
	.input--has-icon:not(.input--has-icon-after) .input__label { left: calc(44px + 0px * var(--fp)); }

	.input__label--placeholder {
		left: calc(13px + (0.8rem - 13px) * var(--lh));
		transform: translateY(calc(-80% * var(--lh)));
		font-size: calc(0.85rem - 0.10rem * var(--lh));
		opacity: calc(0.4 + 0.6 * var(--lh));
		color: color-mix(in oklab, rgb(var(--text)), rgb(var(--c)) calc(var(--lh) * 100%));
	}

	.input__label--label {
		left: 0.8rem;
		top: auto;
		bottom: 100%;
		height: auto;
		margin-bottom: 4px;
		opacity: 1;
		font-size: 0.75rem;
		color: color-mix(in oklab, rgb(var(--text) / 0.7), rgb(var(--c)) calc(var(--fp) * 100%));
	}
	.input--has-icon:not(.input--has-icon-after) .input__label--label { left: 0.8rem; }

	.input--state-primary .input__label,
	.input--state-success .input__label,
	.input--state-danger .input__label,
	.input--state-warn .input__label,
	.input--state-dark .input__label { color: rgb(var(--c)); }

	.input__icon {
		position: absolute;
		left: 0;
		top: 0;
		bottom: 0;
		margin: auto 0;
		width: 36px;
		height: 38px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: rgb(var(--gray-2));
		border: 0;
		border-radius: inherit;
		color: color-mix(in oklab, rgb(var(--text) / 0.4), rgb(var(--icon-c)) calc(var(--fp) * 100%));
		pointer-events: none;
		overflow: hidden;
		z-index: 2;
	}
	.input__icon--after {
		left: auto;
		right: 0;
	}
	.input__icon--clickable { pointer-events: auto; cursor: pointer; }
	.input__icon--clickable:hover {
		transform: translate(-6px, -6px);
		color: rgb(var(--icon-c));
		box-shadow:
			12px 14px 24px -4px rgb(0 0 0 / 0.22),
			6px 6px 12px -2px rgb(0 0 0 / 0.1);
	}
	.input__icon--clickable.input__icon--after:hover {
		transform: translate(6px, -6px);
		box-shadow:
			-12px 14px 24px -4px rgb(0 0 0 / 0.22),
			-6px 6px 12px -2px rgb(0 0 0 / 0.1);
	}
	.input__icon:not(.input__icon--after) {
		transform: translate(calc(-6px * var(--fp)), calc(-6px * var(--fp))) scale(calc(1 + 0.18 * var(--ifs)));
		transform-origin: center;
		box-shadow:
			calc(8px + 4px * var(--fp)) calc(4px + 10px * var(--fp)) calc(16px + 8px * var(--fp)) -4px rgb(0 0 0 / calc(0.16 + 0.06 * var(--fp))),
			calc(3px + 3px * var(--fp)) calc(2px + 4px * var(--fp)) calc(6px + 6px * var(--fp)) -2px rgb(0 0 0 / calc(0.08 + 0.02 * var(--fp)));
	}
	.input__icon--after {
		transform: translate(calc(6px * var(--fp)), calc(-6px * var(--fp))) scale(calc(1 + 0.18 * var(--ifs)));
		transform-origin: center;
		box-shadow:
			calc(-8px - 4px * var(--fp)) calc(4px + 10px * var(--fp)) calc(16px + 8px * var(--fp)) -4px rgb(0 0 0 / calc(0.16 + 0.06 * var(--fp))),
			calc(-3px - 3px * var(--fp)) calc(2px + 4px * var(--fp)) calc(6px + 6px * var(--fp)) -2px rgb(0 0 0 / calc(0.08 + 0.02 * var(--fp)));
	}
	.input__icon-glyph {
		position: relative;
		z-index: 1;
		display: flex;
		align-items: center;
		justify-content: center;
	}
	.input__icon-glyph--reveal {
		position: absolute;
		inset: 0;
		color: rgb(var(--icon-c));
		clip-path: circle(calc(var(--icon-fill-size) / 2 * var(--ifp)) at var(--icon-fill-x) var(--icon-fill-y));
		pointer-events: none;
		z-index: 2;
	}

	.input__icon-ripple {
		position: absolute;
		left: var(--icon-fill-x);
		top: var(--icon-fill-y);
		width: var(--icon-fill-size);
		height: var(--icon-fill-size);
		border-radius: 50%;
		background: rgb(var(--icon-c));
		pointer-events: none;
		opacity: var(--ifp);
		transform: translate(-50%, -50%) scale(calc(0.05 + 0.95 * var(--ifp)));
		z-index: 0;
		will-change: transform, opacity;
	}
	.input--icon-fill-bg.input--focused .input__icon,
	.input--icon-fill-bg .input__icon--clickable:hover { color: rgb(255 255 255); }

	.input__reveal {
		position: absolute;
		right: 4px;
		top: 50%;
		transform: translateY(-50%);
		width: 32px;
		height: 32px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: transparent;
		border: 0;
		border-radius: 8px;
		cursor: pointer;
		color: inherit;
		opacity: 0.7;
		transition: opacity 250ms cubic-bezier(0.4, 0, 0.2, 1);
	}
	.input__reveal:hover { opacity: 1; }

	.input__loading {
		position: absolute;
		right: 7px;
		top: 50%;
		transform: translateY(-50%);
		display: flex;
		pointer-events: none;
	}

	.input__progress {
		position: relative;
		margin-top: 5px;
		height: 2px;
		margin-left: 0.75rem;
		margin-right: 0.75rem;
		background: rgb(var(--gray-2));
		border-radius: 5px;
		overflow: hidden;
	}
	.input__progress-bar {
		height: 100%;
		max-width: 100%;
		border-radius: inherit;
		padding: 0 0.75rem;
		transition: width 250ms cubic-bezier(0.4, 0, 0.2, 1);
		background: rgb(var(--c));
	}
	.input__progress--danger .input__progress-bar { background: rgb(var(--danger)); }
	.input__progress--warn .input__progress-bar { background: rgb(var(--warn)); }
	.input__progress--success .input__progress-bar { background: rgb(var(--success)); }

	.input__message {
		font-size: 0.7rem;
		padding: 2px 7px 0;
		color: rgb(var(--c));
	}

	.input--variant-border .input__field { border-radius: 0; }
	.input--variant-border .input__el { background: transparent; border-radius: 0; }
	.input--variant-border .input__icon,
	.input--variant-border .input__icon--after,
	.input--variant-border .input__icon--clickable:hover {
		background: transparent;
		box-shadow: none;
	}
	.input--variant-border .input__icon,
	.input--variant-border .input__icon--after {
		color: color-mix(in oklab, rgb(var(--text) / 0.25), rgb(var(--c)) calc(var(--fp) * 100%));
		transform: scale(calc(1 + 0.18 * var(--fp) + 0.15 * var(--ifs)));
		transform-origin: center center;
	}
	.input__underline {
		position: absolute;
		left: 0;
		bottom: 0;
		width: 100%;
		height: 2px;
		background: rgb(var(--text) / 0.25);
		pointer-events: none;
	}
	.input__underline::after {
		content: '';
		position: absolute;
		left: 50%;
		bottom: 0;
		width: calc(100% * var(--fp));
		height: 100%;
		background: rgb(var(--c));
		transform: translateX(-50%);
	}

	.input--variant-shadow .input__field { background: transparent; }
	.input--variant-shadow .input__el {
		background: transparent;
		border: 2px solid transparent;
		border-radius: 0;
	}
	.input--variant-shadow .input__icon,
	.input--variant-shadow .input__icon--after {
		background: transparent;
		box-shadow: none;
		z-index: 2;
		transform-origin: center center;
		transform: scale(calc(1 + 0.25 * var(--fp) + 0.15 * var(--ifs)));
		color: color-mix(in oklab, rgb(var(--text) / 0.4), rgb(var(--c) / 0.45) calc(var(--fp) * 100%));
	}
	.input__shadow {
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

	.input--transparent .input__el { background: transparent !important; }

	.input--state-primary .input__el,
	.input--state-success .input__el,
	.input--state-danger .input__el,
	.input--state-warn .input__el,
	.input--state-dark .input__el {
		background: rgb(var(--c) / calc(0.1 + 0.04 * var(--fp)));
		color: rgb(var(--c));
	}
	.input--state .input__icon,
	.input--state .input__icon--after {
		background: transparent;
		color: rgb(var(--c));
		box-shadow: none;
		transform-origin: center center;
		transform: scale(calc(1 + 0.18 * var(--fp) + 0.15 * var(--ifs)));
	}
</style>
