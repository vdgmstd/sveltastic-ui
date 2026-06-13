<script lang="ts" module>
	import '../styles/field.css';
	import type { Snippet } from 'svelte';
	import type { HTMLInputAttributes } from 'svelte/elements';
	import type { Color, Shape } from '../types';
	import type { MaskOptions } from '../actions/mask';
	import type { InputVariant, InputLabelStyle, InputState } from './fieldShell.svelte';

	export type InputShellProps = {
		/** Bound input value. */
		value?: string;
		/** Fires with the new value on every edit. */
		onValueChange?: (value: string) => void;
		/** Visual style. */
		variant?: InputVariant;
		/** Label placement / behaviour. */
		labelStyle?: InputLabelStyle;
		/** Label text. */
		label?: string;
		/** Placeholder text — renders as a fake placeholder that fades on focus. */
		placeholder?: string;
		/** Field shape — only `'square'` differs from the default. */
		shape?: Shape;
		/** Stretch to container. */
		block?: boolean;
		/** Icon side. */
		iconPosition?: 'before' | 'after';
		/** Spinner overlay. */
		loading?: boolean;
		/** Tints background / label / icon. */
		fieldState?: InputState;
		/** 0..100 progress bar at the bottom. */
		progress?: number;
		/** Drop background. */
		transparent?: boolean;
		/** Custom palette color. */
		color?: Color;
		/** Icon background fills with this color on focus. */
		iconColor?: Color;
		/** Mask pattern. */
		mask?: MaskOptions;
		/** Force-focused override — renders as focused regardless of real DOM focus. */
		forceFocus?: boolean;
		/** Disabled state. */
		disabled?: boolean;
		/** Read-only state. */
		readonly?: boolean;
		/** SSR-safe id wired to the `<input>` and label. */
		id?: string;
		/** Native input type. */
		type?: HTMLInputAttributes['type'];
		/** Accessible name when no visible label is rendered. */
		ariaLabel?: string;
		/** Eye-toggle button when `type === 'password'`. */
		passwordReveal?: boolean;
		/** Accessible label for the reveal button while hidden. */
		showPasswordLabel?: string;
		/** Accessible label for the reveal button while shown. */
		hidePasswordLabel?: string;
		/** Leading / trailing glyph. */
		icon?: Snippet;
		/** Replaces the native `<input>` with arbitrary content (chips / custom value). The shell chrome is preserved. */
		control?: Snippet;
		/** Props spread onto the control slot so it can act as the focusable host (e.g. a chips combobox with no inner input). */
		controlHostProps?: Record<string, unknown>;
		/** Feedback message under the field; color follows `fieldState`. */
		message?: Snippet;
		/** Fires when the icon is clicked — also makes the icon focusable / clickable. */
		oniconclick?: (event: MouseEvent) => void;
		/** Class merged onto the column wrapper. */
		class?: string;
		/** Inline style merged onto the column wrapper. */
		style?: string;
		/** Bindable wrapper ref. */
		ref?: HTMLDivElement | null;
		/** Bindable native input ref. */
		inputRef?: HTMLInputElement | null;
		/** Live focus state (focused or force-focused). */
		focused?: boolean;
		/** Fires on focus entering the field row. */
		onfocusin?: (event: FocusEvent) => void;
		/** Fires on focus leaving the field row. */
		onfocusout?: (event: FocusEvent) => void;
	} & Omit<HTMLInputAttributes, 'value' | 'type' | 'class' | 'style' | 'id' | 'placeholder' | 'children'>;
</script>

<script lang="ts">
	import { EyeIcon, EyeSlashIcon } from 'phosphor-svelte';
	import { Tween } from 'svelte/motion';
	import { slide } from 'svelte/transition';
	import { cubicOut, backOut, cubicInOut } from 'svelte/easing';
	import { createAttachmentKey, type Attachment } from 'svelte/attachments';
	import { mask as maskAction, maskHint, type MaskaDetail } from '../actions/mask';
	import type { MaskInputOptions } from 'maska';
	import { cn } from '../utils/cn';
	import { boolAttr, dataState } from '../utils/attrs';
	import { attachRef } from '../utils/ref';
	import { mergeProps } from '../utils/mergeProps';
	import Spinner from './Spinner.svelte';
	import { FieldShellState } from './fieldShell.svelte';

	let {
		value = $bindable(''),
		onValueChange,
		variant = 'default',
		labelStyle = 'default',
		label,
		placeholder,
		shape = 'default',
		block = false,
		iconPosition = 'before',
		loading = false,
		fieldState = 'default',
		progress = 0,
		transparent = false,
		color,
		iconColor,
		mask,
		forceFocus = false,
		disabled = false,
		readonly = false,
		id: idProp,
		type = 'text',
		ariaLabel,
		passwordReveal = false,
		showPasswordLabel = 'Show password',
		hidePasswordLabel = 'Hide password',
		icon,
		control,
		controlHostProps,
		message,
		oniconclick,
		class: className,
		style: userStyle,
		ref = $bindable(null),
		inputRef = $bindable(null),
		focused = $bindable(false),
		onfocusin,
		onfocusout,
		oninput,
		onfocus,
		onmousedown,
		...rest
	}: InputShellProps = $props();

	const uid = $props.id();
	let id = $derived(idProp ?? uid);

	const shell = new FieldShellState({
		getValue: () => value ?? '',
		setValueProp: (v) => (value = v),
		getOnValueChange: () => onValueChange,
		getVariant: () => variant,
		getLabelStyle: () => labelStyle,
		getShape: () => shape,
		getBlock: () => block,
		getIconPosition: () => iconPosition,
		getFieldState: () => fieldState,
		getColor: () => color,
		getIconColor: () => iconColor,
		getLoading: () => loading,
		getProgress: () => progress,
		getTransparent: () => transparent,
		getForceFocus: () => forceFocus,
		getDisabled: () => disabled,
		getReadonly: () => readonly,
		getMask: () => mask,
		getId: () => id
	});

	$effect(() => shell.sync());
	$effect(() => {
		focused = shell.focusedActive;
	});
	$effect(() => {
		shell.hasMessage = !!message;
	});

	let isPassword = $derived(type === 'password');
	let isPasswordRevealed = $state(false);
	let resolvedType = $derived(isPassword && passwordReveal && isPasswordRevealed ? 'text' : type);

	let maskTemplate = $derived(mask ? maskHint(mask) : '');
	let maskedValue = $state('');
	let typedLen = $derived(Math.min(maskedValue.length, maskTemplate.length));
	let maskRemainder = $derived(maskTemplate ? maskTemplate.slice(typedLen) : '');
	let showMask = $derived(!!maskTemplate && (!shell.isFloating || shell.focusedActive || shell.hasValue));

	// Label / fake-placeholder: one element shows the static label OR the fading placeholder (mirrors the field shell).
	let isInline = $derived(labelStyle === 'inline');
	let placeholderText = $derived(placeholder ?? (shell.isFloating ? label : ''));
	let staticLabelText = $derived(!isInline && !shell.isFloating ? label : undefined);
	let showFieldLabel = $derived(
		!isInline && !control && ((!!placeholderText && (shell.isFloating || !maskTemplate)) || !!staticLabelText)
	);

	let lastPointerDownAt = 0;
	let caretTimer: ReturnType<typeof setTimeout> | undefined;
	const POINTER_FOCUS_WINDOW_MS = 300;

	function captureMasked(detail: MaskaDetail): void {
		maskedValue = detail.masked;
	}
	let resolvedMask = $derived.by<MaskInputOptions | undefined>(() => {
		if (mask === undefined) return undefined;
		const base = typeof mask === 'string' || Array.isArray(mask) ? { mask } : mask;
		const prior = base.onMaska;
		const chained = Array.isArray(prior)
			? [...prior, captureMasked]
			: prior
				? [prior, captureMasked]
				: captureMasked;
		return { ...base, onMaska: chained };
	});

	$effect(() => {
		if (!maskTemplate) maskedValue = '';
		else maskedValue = shell.value;
	});
	$effect(() => {
		shell.hasValue = shell.value !== '';
	});
	$effect(() => () => clearTimeout(caretTimer));

	let iconButtonEl: HTMLButtonElement | undefined = $state();
	let iconFillX = $state(0);
	let iconFillY = $state(0);
	let iconFillSize = $state(0);

	const ifsTween = new Tween(0, { duration: 0, easing: cubicOut });
	const ifpTween = new Tween(0, { duration: 450, easing: cubicOut });
	let iconPulseToken = 0;

	async function runIconPulse(): Promise<void> {
		const token = ++iconPulseToken;
		ifsTween.set(0, { duration: 0 });
		await ifsTween.set(1, { duration: 180, easing: cubicOut });
		if (token !== iconPulseToken) return;
		await ifsTween.set(0, { duration: 480, easing: backOut });
	}

	let prevFocusedActive = false;
	$effect(() => {
		const now = shell.focusedActive;
		if (now && !prevFocusedActive) {
			void runIconPulse();
			if (iconButtonEl) {
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

	function handleFocusin(event: FocusEvent): void {
		shell.focused = true;
		startBloom(event.currentTarget as HTMLElement);
		onfocusin?.(event);
	}
	function handleFocusout(event: FocusEvent): void {
		const next = event.relatedTarget as Node | null;
		const wrapper = event.currentTarget as HTMLElement;
		if (next && wrapper.contains(next)) return;
		shell.focused = false;
		void bloomOpacity.set(0, { duration: 280, easing: cubicOut });
		onfocusout?.(event);
	}

	function togglePassword(): void {
		isPasswordRevealed = !isPasswordRevealed;
	}

	function handleMouseDown(event: MouseEvent & { currentTarget: EventTarget & HTMLInputElement }): void {
		lastPointerDownAt = Date.now();
		onmousedown?.(event);
	}

	function handleFocus(event: FocusEvent & { currentTarget: EventTarget & HTMLInputElement }): void {
		onfocus?.(event);
		if (!maskTemplate) return;
		const inputEl = event.currentTarget as HTMLInputElement;
		const fromPointer = Date.now() - lastPointerDownAt < POINTER_FOCUS_WINDOW_MS;
		if (fromPointer) return;
		const pos = shell.value.length;
		clearTimeout(caretTimer);
		caretTimer = setTimeout(() => {
			if (document.activeElement === inputEl) {
				try {
					inputEl.setSelectionRange(pos, pos);
				} catch {
					// setSelectionRange unsupported for this input type
				}
			}
		}, 0);
	}

	function handleIconClick(event: MouseEvent): void {
		oniconclick?.(event);
	}

	// Component-owned focus bloom: a Svelte-rendered node driven by Tweens + style:, so a host re-render (Select opening) can't reconcile it away like an action-created node.
	const bloomScale = new Tween(0.05, { duration: 500, easing: cubicOut });
	const bloomOpacity = new Tween(0, { duration: 200, easing: cubicOut });
	let bloomOrigin = $state({ x: 0, y: 0 });
	let bloomSize = $state(0);
	let bloomPoint: { x: number; y: number } | null = null;

	const fieldPointerAttach: Attachment<HTMLElement> = (node) => {
		const onpd = (e: PointerEvent): void => {
			const r = node.getBoundingClientRect();
			bloomPoint = { x: e.clientX - r.left, y: e.clientY - r.top };
		};
		node.addEventListener('pointerdown', onpd);
		return () => node.removeEventListener('pointerdown', onpd);
	};
	function startBloom(field: HTMLElement): void {
		if (variant === 'border') return;
		const r = field.getBoundingClientRect();
		const p = bloomPoint ?? { x: r.width / 2, y: r.height / 2 };
		bloomPoint = null;
		bloomOrigin = p;
		bloomSize = Math.ceil(
			Math.max(
				Math.hypot(p.x, p.y),
				Math.hypot(r.width - p.x, p.y),
				Math.hypot(p.x, r.height - p.y),
				Math.hypot(r.width - p.x, r.height - p.y)
			) * 2.2
		);
		bloomScale.set(0.05, { duration: 0 });
		bloomScale.target = 1;
		bloomOpacity.target = 1;
	}

	const wrapperRefKey = createAttachmentKey();
	const inputRefKey = createAttachmentKey();
	const iconRefKey = createAttachmentKey();

	// Mint once: an inline attachment in a $derived bag re-runs on every tween frame, bouncing the public ref.
	const wrapperRefAttach = attachRef<HTMLDivElement>((n) => (ref = n));
	const inputRefAttach = attachRef<HTMLInputElement>((n) => (inputRef = n));
	const iconRefAttach = attachRef<HTMLButtonElement>((n) => {
		iconButtonEl = n ?? undefined;
	});

	const wrapperAttrs = $derived({
		class: cn(
			'input',
			block && 'input--block',
			shell.isFloating && 'input--label-placeholder',
			variant === 'border' && 'input--variant-border',
			variant === 'shadow' && 'input--variant-shadow',
			transparent && 'input--transparent',
			shape === 'square' && 'input--shape-square',
			shell.isPlainSurface && 'input--plain',
			shell.isIconFillBg && 'input--icon-fill-bg',
			shell.focusedActive && 'input--focused',
			shell.isStateVariant && 'input--state',
			fieldState === 'primary' && 'input--state-primary',
			fieldState === 'success' && 'input--state-success',
			fieldState === 'danger' && 'input--state-danger',
			fieldState === 'warning' && 'input--state-warn',
			fieldState === 'dark' && 'input--state-dark',
			className
		),
		style:
			`--c:${shell.triplet};` +
			(shell.iconTriplet ? `--icon-c:${shell.iconTriplet};` : '') +
			`--lh:${shell.lhTween.current};` +
			`--fp:${shell.fpTween.current};` +
			`--vp:${shell.vpTween.current};` +
			`--pp:${shell.progressTween.current}%;` +
			`--mask-len:${shell.maskTemplate.length};` +
			(userStyle ?? ''),
		'data-state': dataState(shell.focusedActive ? 'focused' : undefined),
		'data-disabled': boolAttr(disabled),
		'data-readonly': boolAttr(readonly),
		'data-field-state': dataState(fieldState !== 'default' ? fieldState : undefined),
		'data-variant': variant,
		'data-loading': boolAttr(loading),
		'data-testid': 'input',
		[wrapperRefKey]: wrapperRefAttach
	});

	const fieldProps = $derived(
		mergeProps(rest, {
			class: 'input__el',
			id,
			type: resolvedType,
			placeholder: '',
			disabled,
			readonly,
			'aria-label': ariaLabel,
			'aria-invalid': fieldState === 'danger' ? true : undefined,
			'aria-describedby': shell.hasMessage ? shell.messageId : undefined,
			'data-state': dataState(shell.focusedActive ? 'focused' : undefined),
			'data-disabled': boolAttr(disabled),
			'data-field-state': dataState(fieldState !== 'default' ? fieldState : undefined),
			onfocus: handleFocus,
			onmousedown: handleMouseDown,
			...(oninput ? { oninput } : {}),
			[inputRefKey]: inputRefAttach
		})
	);

	const iconAttrs = $derived({
		class: cn(
			'input__icon',
			iconPosition === 'after' && 'input__icon--after',
			!!oniconclick && 'input__icon--clickable'
		),
		type: 'button' as const,
		tabindex: oniconclick ? 0 : -1,
		disabled: !oniconclick,
		'aria-hidden': !oniconclick,
		onclick: handleIconClick,
		[iconRefKey]: iconRefAttach
	});
</script>

<div {...wrapperAttrs}>
	{#if label && isInline}
		<label class="input__label-block" for={id}>{label}</label>
	{/if}
	<div
		class="input__field"
		onfocusin={handleFocusin}
		onfocusout={handleFocusout}
		{@attach fieldPointerAttach}
	>
		<span class="input__focus-bloom" aria-hidden="true">
			<span
				class="input__focus-bloom-fx"
				style:--bx="{bloomOrigin.x}px"
				style:--by="{bloomOrigin.y}px"
				style:--bsize="{bloomSize}px"
				style:transform="translate(-50%, -50%) scale({bloomScale.current})"
				style:opacity={bloomOpacity.current}
			></span>
		</span>
		{#if control}
			<div
				class="input__el input__el--slot"
				class:input__el--has-icon={!!icon}
				class:input__el--icon-after={iconPosition === 'after'}
				{...controlHostProps}
			>
				{@render control()}
			</div>
		{:else}
			<input
				bind:value={() => shell.value, (v) => shell.setValue(v)}
				use:maskAction={resolvedMask}
				{...fieldProps}
			/>
		{/if}
		{#if !control && showMask}
			<span class="input__mask" aria-hidden="true"
				><span class="input__mask-typed">{maskedValue.slice(0, typedLen)}</span><span
					class="input__mask-rest">{maskRemainder}</span
				></span
			>
		{/if}
		{#if !control && isPassword && passwordReveal}
			<button
				type="button"
				class="input__reveal"
				onclick={togglePassword}
				aria-label={isPasswordRevealed ? hidePasswordLabel : showPasswordLabel}
			>
				{#if isPasswordRevealed}
					<EyeSlashIcon size={18} weight="regular" />
				{:else}
					<EyeIcon size={18} weight="regular" />
				{/if}
			</button>
		{/if}

		{#if icon}
			<button
				{...iconAttrs}
				style:--ifs={ifsTween.current}
				style:--ifp={ifpTween.current}
				style:--icon-fill-x="{iconFillX}px"
				style:--icon-fill-y="{iconFillY}px"
				style:--icon-fill-size="{iconFillSize}px"
			>
				{#if shell.isPlainSurface && shell.isIconFillBg}
					<span class="input__icon-ripple" aria-hidden="true"></span>
				{/if}
				<span class="input__icon-glyph">{@render icon()}</span>
				{#if shell.isPlainSurface && !shell.isIconFillBg}
					<span class="input__icon-glyph input__icon-glyph--reveal" aria-hidden="true">
						{@render icon()}
					</span>
				{/if}
			</button>
		{/if}

		{#if showFieldLabel}
			<label
				class={cn(
					'input__label',
					shell.isFloating && 'input__label--placeholder',
					staticLabelText && !shell.isFloating && 'input__label--label'
				)}
				for={id}>{staticLabelText ?? placeholderText}</label
			>
		{/if}

		{#if loading}
			<span class="input__loading" aria-hidden="true">
				<Spinner {color} size={22} thickness={3} speed={800} />
			</span>
		{/if}
		{#if variant === 'border'}
			<span class="input__underline" aria-hidden="true"></span>
		{/if}
		{#if variant === 'shadow'}
			<span class="input__shadow" aria-hidden="true"></span>
		{/if}
	</div>

	{#if message}
		<div
			class="input__message"
			id={shell.messageId}
			role={fieldState === 'danger' ? 'alert' : 'status'}
			transition:slide={{ duration: 250, easing: cubicInOut }}
		>
			{@render message()}
		</div>
	{/if}

	{#if shell.progressKind}
		<div class="input__progress input__progress--{shell.progressKind}">
			<div class="input__progress-bar" style:width="var(--pp)"></div>
		</div>
	{/if}
</div>
