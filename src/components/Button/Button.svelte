<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { HTMLAnchorAttributes, HTMLButtonAttributes } from 'svelte/elements';
	import type { Color, Shape, Size, Variant } from '../../types';

	export type ButtonAnimationType = 'horizontal' | 'vertical' | 'scale' | 'rotate';

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
		/** Loading overlay. Blocks pointer events. */
		loading?: boolean;
		/** Animated diagonal sweep evoking an upload progress feel. */
		upload?: boolean;
		/** Stretch to container width. */
		block?: boolean;
		/** Force the visual "pressed" / selected state (toggle buttons). */
		active?: boolean;
		/** Active visuals + non-interactive (cursor + opacity). */
		pressedDisabled?: boolean;
		/** Hover-driven content swap when an `animate` snippet is provided. */
		animationType?: ButtonAnimationType;
		/** Disable the `animate`-snippet swap even if the snippet is present. */
		animateInactive?: boolean;
		/** Lock the button width to the wider of the two snippets so the swap doesn't reflow. */
		fixedWidth?: boolean;
		/** Disable the click ripple. */
		ripple?: boolean;
		/** Default content. */
		children?: Snippet;
		/** Hover-state content (slides in from the right by default). */
		animate?: Snippet;
		/** Click handler. Forwarded after any default navigation when `href` is set on a link button. */
		onclick?: (event: MouseEvent) => void;
	};

	type ButtonOnly = CommonProps & {
		href?: undefined;
		disabled?: boolean;
	} & Omit<HTMLButtonAttributes, keyof CommonProps>;

	type LinkOnly = CommonProps & {
		href: string;
		disabled?: boolean;
	} & Omit<HTMLAnchorAttributes, keyof CommonProps>;

	export type ButtonProps = ButtonOnly | LinkOnly;
</script>

<script lang="ts">
	import { Tween } from 'svelte/motion';
	import { cubicOut } from 'svelte/easing';
	import { ripple as rippleAction } from '../../actions/ripple.svelte';
	import { surfaceRipple } from '../../actions/surfaceRipple.svelte';
	import { rgbTriplet } from '../../utils/color';
	import { cn } from '../../utils/cn';
	import Spinner from '../../primitives/Spinner.svelte';

	let {
		variant = 'default',
		color = 'primary',
		gradientEnd,
		size = 'medium',
		shape = 'default',
		iconOnly = false,
		loading = false,
		upload = false,
		block = false,
		active = false,
		pressedDisabled = false,
		animationType = 'horizontal',
		animateInactive = false,
		fixedWidth = false,
		ripple: rippleEnabled = true,
		disabled = false,
		href,
		children,
		animate,
		onclick,
		class: className,
		style: userStyle,
		...rest
	}: ButtonProps = $props();

	let triplet = $derived(rgbTriplet(color));
	let endTriplet = $derived(gradientEnd ? rgbTriplet(gradientEnd) : undefined);
	let isWhite = $derived(typeof color === 'string' && /^#fff(fff)?$/i.test(color));
	let isInert = $derived(disabled || loading || pressedDisabled);
	let hasAnimate = $derived(!!animate && !animateInactive);
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

	let isDarkColor = $derived(color === 'dark');
	let bgEl = $state<HTMLElement>();
	let rippleOptions = $derived({
		disabled: !rippleEnabled || isInert,
		solidBg: variant === 'default' || variant === 'gradient' || variant === 'relief' || variant === 'floating',
		mountTo: bgEl
	});
	let uploadRipplesOptions = $derived({
		mode: 'autoripple' as const,
		disabled: !upload,
		mountTo: bgEl
	});

	const pressScale = new Tween(1, { duration: 110, easing: cubicOut });
	let isPressing = $state(false);
	let pressToken = 0;

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
			active && 'button--active',
			pressedDisabled && 'button--pressed-disabled',
			hasAnimate && 'button--animate',
			isWhite && 'button--white',
			isDarkColor && 'button--color-dark',
			isPressing && 'button--pressing',
			className
		)
	);

	async function runPress(host: HTMLElement | null): Promise<void> {
		if (isInert) return;
		const isHovered = host?.matches(':hover') ?? false;
		const restScale = isHovered && !active ? 1.06 : 1;
		const token = ++pressToken;
		pressScale.set(restScale, { duration: 0 });
		isPressing = true;
		await pressScale.set(0.96, { duration: 110, easing: cubicOut });
		if (token !== pressToken) return;
		await pressScale.set(restScale, { duration: 260, easing: cubicOut });
		if (token !== pressToken) return;
		isPressing = false;
	}

	function handlePointerDown(event: PointerEvent): void {
		if (isInert) return;
		if (event.button !== 0 && event.pointerType === 'mouse') return;
		void runPress(event.currentTarget as HTMLElement);
	}

	function handleKeyDown(event: KeyboardEvent): void {
		if (isInert) return;
		if (event.repeat) return;
		if (event.key !== 'Enter' && event.key !== ' ') return;
		void runPress(event.currentTarget as HTMLElement);
	}

	function handleClick(event: MouseEvent): void {
		if (isInert) {
			event.preventDefault();
			event.stopPropagation();
			return;
		}
		onclick?.(event);
	}
</script>

{#if href !== undefined}
	<a
		class={rootClass}
		style:--c={triplet}
		style:--ge={endTriplet}
		style={userStyle}
		href={isInert ? undefined : href}
		aria-disabled={isInert ? 'true' : undefined}
		data-testid="button"
		onclick={handleClick}
		onpointerdown={handlePointerDown}
		onkeydown={handleKeyDown}
		use:rippleAction={rippleOptions}
		use:surfaceRipple={uploadRipplesOptions}
		{...rest as HTMLAnchorAttributes}
	>
		<span class="button__bg" aria-hidden="true" bind:this={bgEl} style:--press-scale={pressScale.current}></span>
		{@render body()}
	</a>
{:else}
	<button
		class={rootClass}
		style:--c={triplet}
		style:--ge={endTriplet}
		style={userStyle}
		disabled={disabled || undefined}
		aria-disabled={isInert ? 'true' : undefined}
		data-testid="button"
		onclick={handleClick}
		onpointerdown={handlePointerDown}
		onkeydown={handleKeyDown}
		use:rippleAction={rippleOptions}
		use:surfaceRipple={uploadRipplesOptions}
		{...rest as HTMLButtonAttributes}
	>
		<span class="button__bg" aria-hidden="true" bind:this={bgEl} style:--press-scale={pressScale.current}></span>
		{@render body()}
	</button>
{/if}

{#snippet body()}
	{#if animate}
		<span
			class="button__inner"
			style:--w-content={idleWidth ? `${idleWidth}px` : null}
			style:--w-animate={hoverWidth ? `${hoverWidth}px` : null}
		>
			<span class="button__content" bind:this={contentEl}>
				{@render children?.()}
			</span>
			<span class="button__animate" bind:this={animateEl}>
				{@render animate()}
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
		margin: 5px;
		padding: 0;
		border: 0;
		border-radius: var(--button-radius);
		background: transparent;
		color: inherit;
		font: inherit;
		font-size: 0.8rem;
		text-align: center;
		text-decoration: none;
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
			transform 320ms cubic-bezier(0.5, 1.45, 0.35, 1),
			box-shadow 220ms cubic-bezier(0.4, 0, 0.2, 1);
	}
	.button:not(.button--floating):not(.button--block):hover:not(.button--active) .button__bg {
		transform: scale(1.06);
	}
	.button--pressing:not(.button--block) .button__bg {
		transform: scale(var(--press-scale, 1)) !important;
		transition: none !important;
	}
	.button--block.button--pressing .button__bg {
		transform: scaleY(min(1, var(--press-scale, 1))) !important;
		transition: none !important;
	}

	.button:focus-visible .button__bg {
		outline: 2px solid rgb(var(--c) / 0.6);
		outline-offset: 2px;
	}
	:where(.button:disabled),
	:where(.button[aria-disabled='true']) { pointer-events: none; }
	:where(.button:disabled) { opacity: 0.35; }
	:where(.button.button--pressed-disabled) {
		pointer-events: none;
		opacity: 0.6;
	}
	:where(.button--white:focus) { color: rgb(30 30 30); }

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
		gap: 6px;
		width: 100%;
		padding: 8px 12px;
		white-space: nowrap;
	}
	.button--animate .button__content {
		backface-visibility: hidden;
		transition: transform var(--swap-duration) cubic-bezier(0.5, 1.45, 0.35, 1),
			opacity var(--swap-duration) cubic-bezier(0.5, 1.45, 0.35, 1);
	}

	.button__animate {
		position: relative;
		z-index: 1300;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 6px;
		padding: 8px 12px;
		white-space: nowrap;
		pointer-events: none;
		backface-visibility: hidden;
		transform: translate3d(max(var(--w-content, 100%), var(--w-animate, 100%)), 0, 0);
		transition: transform var(--swap-duration) cubic-bezier(0.5, 1.45, 0.35, 1),
			opacity var(--swap-duration) cubic-bezier(0.5, 1.45, 0.35, 1);
	}

	.button--anim-vertical .button__animate { transform: translate3d(0, 100%, 0); }
	.button--anim-scale    .button__animate { transform: scale(0.5);  opacity: 0; }
	.button--anim-rotate   .button__animate { transform: rotate(-180deg); opacity: 0; }

	.button--animate:hover:not(:disabled):not([aria-disabled='true']) .button__inner {
		width: var(--w-animate, max-content);
	}
	.button--animate:hover:not(:disabled):not([aria-disabled='true']) .button__content {
		transform: translate3d(calc(-1 * max(var(--w-content, 100%), var(--w-animate, 100%))), 0, 0);
	}
	.button--animate:hover:not(:disabled):not([aria-disabled='true']) .button__animate {
		transform: translate3d(0, 0, 0);
	}

	.button--animate.button--anim-vertical:hover:not(:disabled):not([aria-disabled='true']) .button__content { transform: translate3d(0, -100%, 0); opacity: 0; }
	.button--animate.button--anim-vertical:hover:not(:disabled):not([aria-disabled='true']) .button__animate { transform: translate3d(0, 0, 0); }

	.button--animate.button--anim-scale:hover:not(:disabled):not([aria-disabled='true']) .button__content   { transform: scale(1.4); opacity: 0; }
	.button--animate.button--anim-scale:hover:not(:disabled):not([aria-disabled='true']) .button__animate   { transform: scale(1);   opacity: 1; }

	.button--animate.button--anim-rotate:hover:not(:disabled):not([aria-disabled='true']) .button__content  { transform: rotate(180deg); opacity: 0; }
	.button--animate.button--anim-rotate:hover:not(:disabled):not([aria-disabled='true']) .button__animate  { transform: rotate(0);      opacity: 1; }

	:where(.button--block) { display: flex; width: 100%; }

	.button--icon .button__content,
	.button--icon .button__animate { padding: 8px; }

	:where(.button--shape-circle) { border-radius: 50vmax; }
	:where(.button--shape-square) { border-radius: 0; }

	:where(.button--size-xl)     { font-size: 1.1rem;  --button-radius: 20px; }
	:where(.button--size-large)  { font-size: 1rem;    --button-radius: 15px; }
	:where(.button--size-medium) { font-size: 0.8rem;  --button-radius: 12px; }
	:where(.button--size-small)  { font-size: 0.75rem; --button-radius: 9px; }
	:where(.button--size-mini)   { font-size: 0.6rem;  --button-radius: 7px; }

	.button--size-xl    .button__content,
	.button--size-xl    .button__animate { padding: 15px 20px; }
	.button--size-large .button__content,
	.button--size-large .button__animate { padding: 10px 15px; }
	.button--size-small .button__content,
	.button--size-small .button__animate { padding: 5px 10px; }
	.button--size-mini  .button__content,
	.button--size-mini  .button__animate { padding: 3px 8px; }

	.button--size-xl.button--icon    .button__content,
	.button--size-xl.button--icon    .button__animate { padding: 15px; }
	.button--size-large.button--icon .button__content,
	.button--size-large.button--icon .button__animate { padding: 10px; }
	.button--size-small.button--icon .button__content,
	.button--size-small.button--icon .button__animate { padding: 5px; }
	.button--size-mini.button--icon  .button__content,
	.button--size-mini.button--icon  .button__animate { padding: 3px; }

	:where(.button--default) { color: rgb(255 255 255); }
	.button--default .button__bg { background: rgb(var(--c)); }

	:where(.button--flat) { color: rgb(var(--c)); }
	:where(.button--flat.button--color-dark) { color: rgb(var(--c)); }
	.button--flat .button__bg { background: rgb(var(--c) / 0.15); }
	:where(.button--flat.button--active) { color: rgb(255 255 255); }
	.button--flat.button--active .button__bg { background: rgb(var(--c)); }

	:where(.button--floating) { color: rgb(255 255 255); }
	.button--floating .button__bg {
		background: rgb(var(--c));
		box-shadow: 0 8px 20px -6px rgb(var(--c) / 0.7);
		transform: translateY(-3px);
	}
	.button--floating:not(.button--block):hover:not(.button--active) .button__bg {
		transform: translateY(-3px) scale(1.06);
	}
	.button--floating.button--block:hover:not(.button--active) .button__bg {
		transform: translateY(-3px);
	}
	.button--floating:not(.button--block).button--pressing .button__bg {
		transform: translateY(0) scale(var(--press-scale, 1)) !important;
	}
	.button--floating.button--block.button--pressing .button__bg {
		transform: translateY(0) !important;
	}
	.button--floating.button--active .button__bg {
		transform: translateY(0);
		box-shadow: 0 0 0 0 rgb(var(--c));
	}
	.button--default:hover:not(.button--active) .button__bg,
	.button--gradient:hover:not(.button--active) .button__bg,
	.button--shadow:hover:not(.button--active) .button__bg {
		box-shadow: 0 8px 20px -6px rgb(var(--c) / 0.7);
	}

	:where(.button--border) { color: rgb(var(--c)); }
	:where(.button--border.button--upload) { color: rgb(255 255 255); }
	.button--border .button__bg::before {
		content: '';
		position: absolute;
		inset: 0;
		box-sizing: border-box;
		border: 2px solid rgb(var(--c));
		border-radius: inherit;
		pointer-events: none;
	}
	:where(.button--border.button--active) { color: rgb(255 255 255); }
	.button--border.button--active .button__bg { background: rgb(var(--c)); }

	:where(.button--gradient) { color: rgb(255 255 255); }
	.button--gradient .button__bg { background: rgb(var(--c)); }
	.button--gradient .button__bg::before {
		content: '';
		position: absolute;
		inset: 0;
		box-sizing: border-box;
		background: linear-gradient(30deg, rgb(var(--ge) / 0) 33%, rgb(var(--ge)) 100%);
		border-radius: inherit;
		pointer-events: none;
	}

	:where(.button--relief) { color: rgb(255 255 255); }
	.button--relief .button__bg { background: rgb(var(--c)); }
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
	.button--relief.button--active .button__content { padding-bottom: 6px; }
	.button--relief.button--active .button__bg::before { border-bottom-width: 0; }

	:where(.button--transparent) { color: rgb(var(--c)); }
	.button--transparent.button--active .button__bg { background: rgb(var(--c) / 0.2); }
	:global([data-theme='dark']) :where(.button--transparent) { color: rgb(var(--text)); }
	:global([data-theme='dark']) .button--transparent.button--active .button__bg {
		background: rgb(var(--c) / var(--background-opacity));
	}

	:where(.button--shadow) { color: rgb(var(--text)); }
	.button--shadow .button__bg {
		background: rgb(var(--gray-2));
		box-shadow:
			0 14px 32px -6px rgb(0 0 0 / 0.22),
			0 5px 12px -2px rgb(0 0 0 / 0.1);
	}

	.button--default.button--active .button__bg,
	.button--gradient.button--active .button__bg {
		box-shadow: 0 6px 18px -4px rgb(var(--c) / 0.55);
	}
	.button--shadow.button--active .button__bg {
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
