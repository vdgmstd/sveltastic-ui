<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { HTMLAnchorAttributes, HTMLButtonAttributes } from 'svelte/elements';
	import type { Color, Shape, Size, Variant, WithElementRef } from '../types';

	export type PressableAnimationType = 'horizontal' | 'vertical' | 'scale' | 'rotate';

	type CommonProps = {
		/** Visual variant. */
		variant?: Variant;
		/** Palette name (`'primary' | 'success' | 'danger' | 'warning' | 'dark' | 'light' | social`) or hex / `rgb(...)` / `r,g,b`. */
		color?: Color;
		/** End-stop color for the `gradient` variant. Defaults to the `--gradient-end` token. */
		gradientEnd?: Color;
		/** Predefined size or any custom value (passed through as `--button-font` / pad multipliers). */
		size?: Size;
		/** Border-radius shape. */
		shape?: Shape;
		/** Icon-only mode — square padding, larger glyph, no text-side gap. */
		iconOnly?: boolean;
		/** Accessible name — required for `iconOnly` buttons with no visible text. */
		ariaLabel?: string;
		/** Loading overlay. Blocks pointer events. */
		loading?: boolean;
		/** Animated diagonal sweep evoking an upload progress feel. */
		upload?: boolean;
		/** Stretch to container width. */
		block?: boolean;
		/** Force the visual "pressed" / selected state (toggle buttons). Exposes `aria-pressed`. */
		active?: boolean;
		/** Fired when an `active`-toggle button is activated, with the next pressed value. */
		onActiveChange?: (active: boolean) => void;
		/** Active visuals + non-interactive (cursor + opacity). */
		pressedDisabled?: boolean;
		/** Hover-driven content swap when an `animate` snippet is provided. */
		animationType?: PressableAnimationType;
		/** Disable the `animate`-snippet swap even if the snippet is present. */
		animateInactive?: boolean;
		/** Lock the button width to the wider of the two snippets so the swap doesn't reflow. */
		fixedWidth?: boolean;
		/** Disable the click ripple. */
		ripple?: boolean;
		/** Default content. */
		children?: Snippet;
		/** Hover-state content (slides in from the right by default). Internal — not surfaced on `Button.Root`. */
		animate?: Snippet;
		/** Render-delegation: receive the merged props + the styled body and render your own host element. */
		child?: Snippet<[{ props: Record<string, unknown>; body: Snippet }]>;
		/** Click handler. Forwarded after any default navigation when `href` is set on a link button. */
		onclick?: (event: MouseEvent) => void;
	};

	// Single (non-discriminated) type — a discriminated href union resolves `ref` to one branch
	// and makes pass-through spreads (Button.Root) "too complex"; href-mode is gated at runtime.
	export type PressableProps = WithElementRef<
		CommonProps & {
			/** When set, renders an `<a>` link instead of a `<button>`. */
			href?: string;
			/** Disabled (button) / inert (link). */
			disabled?: boolean;
			/** Native button type (button-mode). */
			type?: HTMLButtonAttributes['type'];
			/** Link target (href-mode). */
			target?: HTMLAnchorAttributes['target'];
			/** Link rel (href-mode). */
			rel?: HTMLAnchorAttributes['rel'];
			/** Link download (href-mode). */
			download?: HTMLAnchorAttributes['download'];
		},
		HTMLButtonElement | HTMLAnchorElement
	> &
		Omit<HTMLButtonAttributes, keyof CommonProps | 'ref' | 'type'>;
</script>

<script lang="ts">
	import { untrack } from 'svelte';
	import { ripple as rippleAction } from '../actions/ripple.svelte';
	import { surfaceRipple } from '../actions/surfaceRipple.svelte';
	import { pressBounce } from '../actions/pressBounce.svelte';
	import { cubicOut } from 'svelte/easing';
	import { createAttachmentKey, type Attachment } from 'svelte/attachments';
	import { rgbTriplet } from '../utils/color';
	import { cn } from '../utils/cn';
	import { boolAttr } from '../utils/attrs';
	import { mergeProps } from '../utils/mergeProps';
	import Spinner from './Spinner.svelte';

	let {
		variant = 'default',
		color = 'primary',
		gradientEnd,
		size = 'medium',
		shape = 'default',
		iconOnly = false,
		ariaLabel,
		loading = false,
		upload = false,
		block = false,
		active = $bindable(false),
		onActiveChange,
		pressedDisabled = false,
		animationType = 'horizontal',
		animateInactive = false,
		fixedWidth = false,
		ripple: rippleEnabled = true,
		disabled = false,
		href,
		type,
		ref = $bindable(null),
		children,
		animate,
		child,
		onclick,
		onpointerdown,
		onkeydown,
		class: className,
		style: userStyle,
		...rest
	}: PressableProps = $props();

	let triplet = $derived(rgbTriplet(color));
	let endTriplet = $derived(gradientEnd ? rgbTriplet(gradientEnd) : undefined);
	let isWhite = $derived(
		triplet === '255 255 255' || (typeof color === 'string' && /^white$/i.test(color.trim()))
	);
	let isInert = $derived(disabled || loading || pressedDisabled);
	let hasAnimate = $derived(!!animate && !animateInactive);
	let isDarkColor = $derived(color === 'dark');

	let contentEl = $state<HTMLElement>();
	let animateEl = $state<HTMLElement>();
	let contentWidth = $state(0);
	let animateWidth = $state(0);
	let idleWidth = $derived(
		fixedWidth && contentWidth && animateWidth
			? Math.max(contentWidth, animateWidth)
			: contentWidth
	);
	let hoverWidth = $derived(
		fixedWidth && contentWidth && animateWidth
			? Math.max(contentWidth, animateWidth)
			: animateWidth
	);

	$effect(() => {
		if (!hasAnimate || !contentEl || !animateEl) return;
		const measure = (): void => {
			if (contentEl) contentWidth = contentEl.offsetWidth;
			if (animateEl) animateWidth = animateEl.offsetWidth;
		};
		measure();
		const ro = new ResizeObserver(measure);
		ro.observe(contentEl);
		ro.observe(animateEl);
		return () => ro.disconnect();
	});

	let bgEl = $state<HTMLElement>();
	let rippleOptions = $derived({
		disabled: !rippleEnabled || isInert,
		solidBg:
			variant === 'default' ||
			variant === 'gradient' ||
			variant === 'relief' ||
			variant === 'floating',
		mountTo: bgEl
	});

	let isPressing = $state(false);
	let hostEl = $state<HTMLElement | null>(null);
	const press = pressBounce({
		dip: 0.96,
		out: cubicOut,
		outDuration: 260,
		rest: () => ((hostEl?.matches(':hover') ?? false) && !active ? 1.06 : 1),
		disabled: () => isInert,
		onstart: () => (isPressing = true),
		onsettle: () => (isPressing = false)
	});

	let rootClass = $derived(
		cn(
			'button',
			`button--${variant}`,
			`button--size-${size}`,
			`button--shape-${shape}`,
			`button--anim-${animationType}`,
			iconOnly && 'button--icon',
			block && 'button--block',
			loading && 'button--loading',
			upload && 'button--upload',
			pressedDisabled && 'button--pressed-disabled',
			hasAnimate && 'button--animate',
			isWhite && 'button--white',
			isDarkColor && 'button--color-dark',
			className
		)
	);

	let rippleHandle: ReturnType<typeof rippleAction> | undefined;

	// Mint once: re-minting in the $derived re-runs the attachment every recompute.
	const hostKey = createAttachmentKey();
	const uploadKey = createAttachmentKey();

	// Host attachment: ripple action, the press-bounce hover-probe, and the public ref.
	const attachHost: Attachment = (node) => {
		const el = node as HTMLElement;
		hostEl = el;
		ref = el as HTMLButtonElement & HTMLAnchorElement;
		untrack(() => {
			rippleHandle = rippleAction(el, rippleOptions);
		});
		return () => {
			hostEl = null;
			ref = null;
			rippleHandle?.destroy?.();
			rippleHandle = undefined;
		};
	};

	// Upload autoripple — gated to `upload`; re-runs when `upload`/`bgEl` change, as the original attachment did.
	const attachUpload: Attachment = (node) => {
		if (!upload) return;
		const handle = surfaceRipple(node as HTMLElement, { mode: 'autoripple', mountTo: bgEl });
		return handle?.destroy;
	};

	// Keep the ripple's reactive options live without re-mounting the action.
	$effect(() => {
		rippleHandle?.update?.(rippleOptions);
	});

	let isToggle = $derived(onActiveChange !== undefined || active);

	function setActive(value: boolean): void {
		active = value;
		onActiveChange?.(value);
	}

	function handleClick(event: MouseEvent): void {
		if (isInert) {
			event.preventDefault();
			event.stopPropagation();
			return;
		}
		// Self-toggle only for real toggle buttons; plain buttons keep `active` consumer-controlled.
		if (onActiveChange !== undefined) setActive(!active);
	}

	const sharedProps = $derived({
		class: rootClass,
		'aria-label': ariaLabel,
		'data-active': boolAttr(active),
		'data-pressing': boolAttr(isPressing),
		'data-variant': variant,
		'data-size': size,
		'data-shape': shape,
		'data-loading': boolAttr(loading),
		'data-disabled': boolAttr(isInert),
		'data-testid': 'button',
		onclick: handleClick,
		onpointerdown: (event: PointerEvent) => press.onpointerdown(event),
		onkeydown: (event: KeyboardEvent) => press.onkeydown(event),
		[hostKey]: attachHost,
		[uploadKey]: attachUpload
	});

	const consumerHandlers = $derived(isInert ? {} : { onclick, onpointerdown, onkeydown });
	const styleVars = $derived(
		`--c:${triplet};${endTriplet ? `--ge:${endTriplet};` : ''}${userStyle ?? ''}`
	);

	const anchorProps = $derived(
		mergeProps(rest, sharedProps, consumerHandlers, {
			href: isInert ? undefined : href,
			role: href !== undefined && isInert ? 'link' : undefined,
			tabindex: href !== undefined && isInert ? -1 : undefined,
			'aria-disabled': isInert ? 'true' : undefined,
			style: styleVars
		})
	);

	const buttonProps = $derived(
		mergeProps(rest, sharedProps, consumerHandlers, {
			type,
			disabled: disabled || undefined,
			'aria-disabled': isInert ? 'true' : undefined,
			'aria-pressed': isToggle ? active : undefined,
			style: styleVars
		})
	);
</script>

{#snippet body()}
	<span class="button__bg" aria-hidden="true" bind:this={bgEl} style:--press-scale={press.scale}
	></span>
	{#if hasAnimate}
		<span
			class="button__inner"
			style:--w-content={idleWidth ? `${idleWidth}px` : null}
			style:--w-animate={hoverWidth ? `${hoverWidth}px` : null}
		>
			<span class="button__content" bind:this={contentEl}>
				{@render children?.()}
			</span>
			<span class="button__animate" bind:this={animateEl}>
				{@render animate?.()}
			</span>
		</span>
	{:else}
		<span class="button__content">
			{@render children?.()}
		</span>
	{/if}
	{#if loading}
		<span class="button__loading" aria-hidden="true">
			<Spinner color="#fff" size={17} thickness={2.3} speed={600} />
		</span>
	{/if}
{/snippet}

{#if child}
	{@render child({ props: href !== undefined ? anchorProps : buttonProps, body })}
{:else if href !== undefined}
	<a {...anchorProps}>
		{@render body()}
	</a>
{:else}
	<button {...buttonProps}>
		{@render body()}
	</button>
{/if}

<style>
	:where(.button) {
		--button-radius: var(--radius);
		--c: var(--primary);
		--ge: var(--gradient-end);
		--sa-color: var(--c);
		--swap-duration: 320ms;

		position: relative;
		z-index: 1;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		box-sizing: border-box;
		margin: var(--space-3);
		padding: 0;
		border: 0;
		border-radius: var(--button-radius);
		background: transparent;
		color: inherit;
		font: inherit;
		font-size: var(--fs-md);
		text-align: center;
		text-decoration: none;
		-webkit-user-select: none;
		user-select: none;
		cursor: pointer;
		outline: none;
	}

	.button__bg {
		position: absolute;
		inset: 0;
		z-index: 0;
		box-sizing: border-box;
		border-radius: inherit;
		overflow: hidden;
		pointer-events: none;
		transform-origin: center;
		transition:
			transform 320ms var(--ease-spring),
			box-shadow 220ms var(--ease-standard);
	}
	.button:not(.button--floating):not(.button--block):hover:not([data-active]) .button__bg {
		transform: scale(1.06);
	}
	.button[data-pressing]:not(.button--block) .button__bg {
		transform: scale(var(--press-scale, 1)) !important;
		transition: none !important;
	}
	.button--block[data-pressing] .button__bg {
		transform: scaleY(min(1, var(--press-scale, 1))) !important;
		transition: none !important;
	}

	.button:focus-visible .button__bg {
		outline: 2px solid rgb(var(--c) / 0.6);
		outline-offset: 2px;
	}
	:where(.button:disabled),
	:where(.button[aria-disabled='true']) {
		pointer-events: none;
	}
	:where(.button:disabled) {
		opacity: 0.35;
	}
	:where(.button.button--pressed-disabled) {
		pointer-events: none;
		opacity: 0.6;
	}
	:where(.button--white:focus-visible) {
		color: rgb(30 30 30);
	}

	.button__inner {
		position: relative;
		z-index: 1300;
		display: inline-grid;
		grid-template-areas: 'stack';
		grid-template-columns: 100%;
		width: var(--w-content, max-content);
		overflow: hidden;
		transition: width var(--swap-duration) cubic-bezier(0.4, 0, 0.6, 1);
	}
	.button__inner > .button__content,
	.button__inner > .button__animate {
		grid-area: stack;
		justify-self: center;
		width: max-content;
	}

	.button__content {
		position: relative;
		z-index: 1300;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: var(--space-3);
		width: 100%;
		padding: var(--space-4) var(--space-6);
		white-space: nowrap;
	}
	.button--animate .button__content {
		-webkit-backface-visibility: hidden;
		backface-visibility: hidden;
		transition:
			transform var(--swap-duration) var(--ease-spring),
			opacity var(--swap-duration) var(--ease-spring);
	}

	.button__animate {
		position: relative;
		z-index: 1300;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: var(--space-3);
		padding: var(--space-4) var(--space-6);
		white-space: nowrap;
		pointer-events: none;
		-webkit-backface-visibility: hidden;
		backface-visibility: hidden;
		transform: translate3d(max(var(--w-content, 100%), var(--w-animate, 100%)), 0, 0);
		transition:
			transform var(--swap-duration) var(--ease-spring),
			opacity var(--swap-duration) var(--ease-spring);
	}

	.button__content :global(svg),
	.button__animate :global(svg) {
		flex-shrink: 0;
		/* WebKit shrinks SVG flex-items beside text — pin intrinsic size. */
		min-width: max-content;
		min-height: max-content;
	}

	.button--anim-vertical .button__animate {
		transform: translate3d(0, 100%, 0);
	}
	.button--anim-scale .button__animate {
		transform: scale(0.5);
		opacity: 0;
	}
	.button--anim-rotate .button__animate {
		transform: rotate(-180deg);
		opacity: 0;
	}

	.button--animate:hover:not(:disabled):not([aria-disabled='true']) .button__inner {
		width: var(--w-animate, max-content);
	}
	.button--animate:hover:not(:disabled):not([aria-disabled='true']) .button__content {
		transform: translate3d(calc(-1 * max(var(--w-content, 100%), var(--w-animate, 100%))), 0, 0);
	}
	.button--animate:hover:not(:disabled):not([aria-disabled='true']) .button__animate {
		transform: translate3d(0, 0, 0);
	}

	.button--animate.button--anim-vertical:hover:not(:disabled):not([aria-disabled='true'])
		.button__content {
		transform: translate3d(0, -100%, 0);
		opacity: 0;
	}
	.button--animate.button--anim-vertical:hover:not(:disabled):not([aria-disabled='true'])
		.button__animate {
		transform: translate3d(0, 0, 0);
	}

	.button--animate.button--anim-scale:hover:not(:disabled):not([aria-disabled='true'])
		.button__content {
		transform: scale(1.4);
		opacity: 0;
	}
	.button--animate.button--anim-scale:hover:not(:disabled):not([aria-disabled='true'])
		.button__animate {
		transform: scale(1);
		opacity: 1;
	}

	.button--animate.button--anim-rotate:hover:not(:disabled):not([aria-disabled='true'])
		.button__content {
		transform: rotate(180deg);
		opacity: 0;
	}
	.button--animate.button--anim-rotate:hover:not(:disabled):not([aria-disabled='true'])
		.button__animate {
		transform: rotate(0);
		opacity: 1;
	}

	:where(.button--block) {
		display: flex;
		width: 100%;
	}

	.button--icon .button__content,
	.button--icon .button__animate {
		padding: var(--space-4);
	}

	:where(.button--shape-circle) {
		border-radius: var(--rad-pill);
	}
	:where(.button--shape-square) {
		border-radius: 0;
	}

	:where(.button--size-xl) {
		font-size: var(--fs-xl);
		--button-radius: var(--rad-xl);
	}
	:where(.button--size-large) {
		font-size: var(--fs-lg);
		--button-radius: var(--rad-lg);
	}
	:where(.button--size-medium) {
		font-size: var(--fs-md);
		--button-radius: var(--rad-md);
	}
	:where(.button--size-small) {
		font-size: var(--fs-sm);
		--button-radius: var(--rad-sm);
	}
	:where(.button--size-mini) {
		font-size: var(--fs-xs);
		--button-radius: var(--rad-xs);
	}

	.button--size-xl .button__content,
	.button--size-xl .button__animate {
		padding: var(--space-7) var(--space-8);
	}
	.button--size-large .button__content,
	.button--size-large .button__animate {
		padding: var(--space-5) var(--space-7);
	}
	.button--size-small .button__content,
	.button--size-small .button__animate {
		padding: var(--space-3) var(--space-5);
	}
	.button--size-mini .button__content,
	.button--size-mini .button__animate {
		padding: var(--space-2) var(--space-4);
	}

	.button--size-xl.button--icon .button__content,
	.button--size-xl.button--icon .button__animate {
		padding: var(--space-7);
	}
	.button--size-large.button--icon .button__content,
	.button--size-large.button--icon .button__animate {
		padding: var(--space-5);
	}
	.button--size-small.button--icon .button__content,
	.button--size-small.button--icon .button__animate {
		padding: var(--space-3);
	}
	.button--size-mini.button--icon .button__content,
	.button--size-mini.button--icon .button__animate {
		padding: var(--space-2);
	}

	:where(.button--default) {
		color: rgb(var(--on-accent));
	}
	.button--default .button__bg {
		background: rgb(var(--c));
	}

	:where(.button--flat) {
		color: rgb(var(--c));
	}
	:where(.button--flat.button--color-dark) {
		color: rgb(var(--c));
	}
	.button--flat .button__bg {
		background: rgb(var(--c) / 0.15);
	}
	:where(.button--flat[data-active]) {
		color: rgb(var(--on-accent)) !important;
	}
	.button--flat[data-active] .button__bg {
		background: rgb(var(--c));
	}

	:where(.button--floating) {
		color: rgb(var(--on-accent));
	}
	.button--floating .button__bg {
		background: rgb(var(--c));
		box-shadow: var(--shadow-accent);
		transform: translateY(-3px);
	}
	.button--floating:not(.button--block):hover:not([data-active]) .button__bg {
		transform: translateY(-3px) scale(1.06);
	}
	.button--floating.button--block:hover:not([data-active]) .button__bg {
		transform: translateY(-3px);
	}
	.button--floating:not(.button--block)[data-pressing] .button__bg {
		transform: translateY(0) scale(var(--press-scale, 1)) !important;
	}
	.button--floating.button--block[data-pressing] .button__bg {
		transform: translateY(0) !important;
	}
	.button--floating[data-active] .button__bg {
		transform: translateY(0);
		box-shadow: 0 0 0 0 rgb(var(--c));
	}
	.button--default:hover:not([data-active]) .button__bg,
	.button--gradient:hover:not([data-active]) .button__bg,
	.button--shadow:hover:not([data-active]) .button__bg {
		box-shadow: var(--shadow-accent);
	}

	:where(.button--border) {
		color: rgb(var(--c));
	}
	:where(.button--border.button--upload) {
		color: rgb(var(--on-accent));
	}
	.button--border .button__bg::before {
		content: '';
		position: absolute;
		inset: 0;
		box-sizing: border-box;
		border: 2px solid rgb(var(--c));
		border-radius: inherit;
		pointer-events: none;
	}
	:where(.button--border[data-active]) {
		color: rgb(var(--on-accent)) !important;
	}
	.button--border[data-active] .button__bg {
		background: rgb(var(--c));
	}

	:where(.button--gradient) {
		color: rgb(var(--on-accent));
	}
	.button--gradient .button__bg {
		background: rgb(var(--c));
	}
	.button--gradient .button__bg::before {
		content: '';
		position: absolute;
		inset: 0;
		box-sizing: border-box;
		background: linear-gradient(30deg, rgb(var(--ge) / 0) 33%, rgb(var(--ge)) 100%);
		border-radius: inherit;
		pointer-events: none;
	}

	:where(.button--relief) {
		color: rgb(var(--on-accent));
	}
	.button--relief .button__bg {
		background: rgb(var(--c));
	}
	.button--relief .button__bg::before {
		content: '';
		position: absolute;
		left: 0;
		bottom: 0;
		width: 100%;
		height: calc(100% - 3px);
		box-sizing: border-box;
		border-bottom: 3px solid rgb(var(--c));
		border-radius: inherit;
		pointer-events: none;
		--relief-bg-filter: contrast(2) grayscale(0.4);
		filter: var(--relief-bg-filter);
	}
	.button--relief[data-active] .button__content {
		padding-bottom: var(--space-3);
	}
	.button--relief[data-active] .button__bg::before {
		border-bottom-width: 0;
	}

	:where(.button--transparent) {
		color: rgb(var(--c));
	}
	.button--transparent[data-active] .button__bg {
		background: rgb(var(--c) / 0.2);
	}
	:global([data-theme='dark']) :where(.button--transparent) {
		color: rgb(var(--text));
	}
	:global([data-theme='dark']) .button--transparent[data-active] .button__bg {
		background: rgb(var(--c) / var(--background-opacity));
	}

	:where(.button--shadow) {
		color: rgb(var(--text));
	}
	.button--shadow .button__bg {
		background: rgb(var(--gray-2));
		box-shadow:
			var(--shadow-3),
			0 5px 12px -2px rgb(0 0 0 / 0.1);
	}

	.button--default[data-active] .button__bg,
	.button--gradient[data-active] .button__bg {
		box-shadow: 0 6px 18px -4px rgb(var(--c) / 0.55);
	}
	.button--shadow[data-active] .button__bg {
		box-shadow: 0 14px 28px -6px rgb(var(--c) / 0.55);
	}

	.button--loading .button__inner,
	.button--loading .button__content,
	.button--loading .button__animate {
		filter: blur(3px);
		pointer-events: none;
	}

	.button__loading {
		position: absolute;
		inset: 0;
		z-index: 1400;
		display: flex;
		align-items: center;
		justify-content: center;
		background: rgb(var(--c) / 0.5);
		-webkit-backdrop-filter: blur(2px);
		backdrop-filter: blur(2px);
		border-radius: inherit;
	}
	.button--upload .button__bg {
		background: rgb(var(--c) / 0.15);
	}
	.button--border.button--upload .button__bg {
		background: transparent;
	}
</style>
