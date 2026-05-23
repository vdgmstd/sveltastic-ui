<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { Color, Shape, Size, Variant } from '../../types';

	export type ChipVariant = Extract<
		Variant,
		'default' | 'flat' | 'border' | 'gradient' | 'transparent' | 'shadow'
	>;

	export type ChipProps = {
		/** Visual variant. Mirrors Button vocabulary so chips and buttons read as the same family. */
		variant?: ChipVariant;
		/** Palette name or hex / `rgb(...)` / `r,g,b`. */
		color?: Color;
		/** End-stop color for the `gradient` variant. Defaults to the `--gradient-end` token. */
		gradientEnd?: Color;
		/** Predefined size matching Button's scale (chip glyph proportions are tighter). */
		size?: Size;
		/** Default = pill (chip identity). `square` = `var(--radius)` corners. `circle` = round icon-only chip. */
		shape?: Shape;
		/** Pressed / selected look — for filter and toggle chips. Pairs with `onclick`. */
		active?: boolean;
		/** Show a trailing close button. */
		closable?: boolean;
		/** Disabled — blocks click and close. */
		disabled?: boolean;
		/** Aria-label for the close button. Override for localized labels. */
		closeAriaLabel?: string;
		/** Default content. */
		children?: Snippet;
		/** Leading glyph. */
		icon?: Snippet;
		/** Click handler. Promotes the chip body to a real `<button>`. */
		onclick?: (event: MouseEvent) => void;
		/** Close handler. */
		onclose?: (event: MouseEvent) => void;
		/** Class merged onto the root. */
		class?: string;
		/** Inline style merged onto the root. */
		style?: string;
	};
</script>

<script lang="ts">
	import { XIcon } from 'phosphor-svelte';
	import { ripple as rippleAction } from '../../actions/ripple.svelte';
	import { rgbTriplet } from '../../utils/color';
	import { cn } from '../../utils/cn';

	let {
		variant = 'default',
		color = 'primary',
		gradientEnd,
		size = 'medium',
		shape = 'default',
		active = false,
		closable = false,
		disabled = false,
		closeAriaLabel = 'Remove',
		children,
		icon,
		onclick,
		onclose,
		class: className,
		style: userStyle
	}: ChipProps = $props();

	let triplet = $derived(rgbTriplet(color));
	let endTriplet = $derived(gradientEnd ? rgbTriplet(gradientEnd) : undefined);
	let isClickable = $derived(!!onclick);
	let rippleOptions = $derived({
		disabled: !isClickable || disabled,
		solidBg:
			variant === 'default' ||
			variant === 'gradient' ||
			(active && (variant === 'flat' || variant === 'border'))
	});

	function handleClick(event: MouseEvent): void {
		if (disabled || !onclick) return;
		onclick(event);
	}

	function handleClose(event: MouseEvent): void {
		if (disabled) return;
		event.stopPropagation();
		onclose?.(event);
	}
</script>

<span
	class={cn(
		'chip',
		`chip--${variant}`,
		`chip--size-${size}`,
		`chip--shape-${shape}`,
		active && 'chip--active',
		disabled && 'chip--disabled',
		closable && 'chip--has-close',
		!!icon && 'chip--has-icon',
		isClickable && 'chip--clickable',
		className
	)}
	style:--c={triplet}
	style:--ge={endTriplet}
	style={userStyle}
	data-testid="chip"
>
	{#if isClickable}
		<button
			type="button"
			class="chip__body"
			disabled={disabled || undefined}
			aria-pressed={active ? 'true' : undefined}
			onclick={handleClick}
			use:rippleAction={rippleOptions}
		>
			<span class="chip__bg" aria-hidden="true"></span>
			{#if icon}<span class="chip__icon">{@render icon()}</span>{/if}
			{#if children}<span class="chip__text">{@render children()}</span>{/if}
		</button>
	{:else}
		<span class="chip__body">
			<span class="chip__bg" aria-hidden="true"></span>
			{#if icon}<span class="chip__icon">{@render icon()}</span>{/if}
			{#if children}<span class="chip__text">{@render children()}</span>{/if}
		</span>
	{/if}
	{#if closable}
		<button
			type="button"
			class="chip__close"
			aria-label={closeAriaLabel}
			disabled={disabled || undefined}
			onclick={handleClose}
		>
			<XIcon size={16} weight="bold" />
		</button>
	{/if}
</span>

<style>
	:where(.chip) {
		--c: var(--primary);
		--ge: var(--gradient-end);
		--sa-color: var(--c);

		--chip-font: 0.8rem;
		--chip-pad-x: 12px;
		--chip-pad-y: 7px;
		--chip-gap: 6px;
		--chip-close-size: 18px;
		--chip-close-icon: 11px;

		position: relative;
		display: inline-flex;
		align-items: center;
		box-sizing: border-box;
		border-radius: 50vmax;
		font: inherit;
		font-size: var(--chip-font);
		line-height: var(--line-height);
		color: rgb(var(--c));
		user-select: none;
		isolation: isolate;
		transform-origin: center;
		transition: transform 320ms cubic-bezier(0.5, 1.45, 0.35, 1);
	}
	.chip:not(.chip--disabled):hover {
		transform: scale(1.08);
	}

	.chip__body {
		position: relative;
		flex: 1 1 auto;
		display: inline-flex;
		align-items: center;
		gap: var(--chip-gap);
		padding: var(--chip-pad-y) var(--chip-pad-x);
		margin: 0;
		border: 0;
		border-radius: inherit;
		background: transparent;
		color: inherit;
		font: inherit;
		text-align: inherit;
		outline: none;
		overflow: hidden;
	}
	button.chip__body { cursor: pointer; }
	.chip__body:focus-visible {
		box-shadow: 0 0 0 2px rgb(var(--background)), 0 0 0 4px rgb(var(--c) / 0.6);
	}
	button.chip__body:disabled { cursor: not-allowed; }

	.chip__bg {
		position: absolute;
		inset: 0;
		border-radius: inherit;
		pointer-events: none;
		transition:
			background 200ms cubic-bezier(0.4, 0, 0.2, 1),
			box-shadow 200ms cubic-bezier(0.4, 0, 0.2, 1);
	}

	.chip__icon {
		position: relative;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		flex: 0 0 auto;
	}
	.chip__text {
		position: relative;
		display: inline-flex;
		align-items: center;
		white-space: nowrap;
	}

	.chip__close {
		position: absolute;
		right: calc(var(--chip-pad-x) / 2);
		top: 50%;
		transform: translateY(-50%);
		z-index: 2;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		flex: 0 0 auto;
		width: var(--chip-close-size);
		height: var(--chip-close-size);
		padding: 0;
		border: 0;
		border-radius: 50%;
		background: rgb(var(--c) / 0.18);
		color: inherit;
		cursor: pointer;
		outline: none;
		transition: background 180ms cubic-bezier(0.4, 0, 0.2, 1);
	}
	.chip__close:hover { background: rgb(var(--c) / 0.32); }
	.chip__close:focus-visible {
		outline: 2px solid rgb(var(--c) / 0.6);
		outline-offset: 2px;
	}
	.chip__close:disabled { cursor: not-allowed; }
	.chip__close :global(svg) {
		width: var(--chip-close-icon);
		height: var(--chip-close-icon);
	}

	.chip--has-close .chip__body {
		padding-right: calc(var(--chip-close-size) + var(--chip-pad-x) / 2 + var(--chip-gap) / 2);
	}

	:where(.chip--disabled) { pointer-events: none; opacity: 0.45; }

	:where(.chip--shape-default) { border-radius: 50vmax; }
	:where(.chip--shape-square) { border-radius: var(--radius); }
	:where(.chip--shape-circle) {
		border-radius: 50vmax;
		aspect-ratio: 1 / 1;
		justify-content: center;
	}
	.chip--shape-circle .chip__body {
		padding: var(--chip-pad-y);
		justify-content: center;
		gap: 0;
	}

	/* Sizes mirror Button so chips and buttons line up at the same height. */
	:where(.chip--size-xl) {
		--chip-font: 1.1rem;
		--chip-pad-x: 20px;
		--chip-pad-y: 14px;
		--chip-gap: 10px;
		--chip-close-size: 24px;
		--chip-close-icon: 14px;
	}
	:where(.chip--size-large) {
		--chip-font: 1rem;
		--chip-pad-x: 15px;
		--chip-pad-y: 9px;
		--chip-gap: 8px;
		--chip-close-size: 22px;
		--chip-close-icon: 13px;
	}
	:where(.chip--size-medium) {
		--chip-font: 0.8rem;
		--chip-pad-x: 12px;
		--chip-pad-y: 7px;
		--chip-gap: 6px;
		--chip-close-size: 18px;
		--chip-close-icon: 11px;
	}
	:where(.chip--size-small) {
		--chip-font: 0.75rem;
		--chip-pad-x: 10px;
		--chip-pad-y: 5px;
		--chip-gap: 5px;
		--chip-close-size: 16px;
		--chip-close-icon: 10px;
	}
	:where(.chip--size-mini) {
		--chip-font: 0.6rem;
		--chip-pad-x: 8px;
		--chip-pad-y: 3px;
		--chip-gap: 4px;
		--chip-close-size: 13px;
		--chip-close-icon: 8px;
	}

	:where(.chip--default) { color: rgb(var(--on-accent)); }
	.chip--default .chip__bg { background: rgb(var(--c)); }
	.chip--default .chip__close { background: rgb(0 0 0 / 0.18); }
	.chip--default .chip__close:hover { background: rgb(0 0 0 / 0.3); }

	.chip--flat .chip__body { color: rgb(var(--c)); }
	.chip--flat .chip__bg { background: rgb(var(--c) / 0.15); }
	.chip--flat.chip--active .chip__body { color: rgb(var(--on-accent)); }
	.chip--flat.chip--active .chip__bg { background: rgb(var(--c)); }
	.chip--flat.chip--active .chip__close { background: rgb(0 0 0 / 0.18); }
	.chip--flat.chip--active .chip__close:hover { background: rgb(0 0 0 / 0.3); }

	.chip--border .chip__body { color: rgb(var(--c)); }
	.chip--border .chip__bg {
		background: transparent;
		box-shadow: inset 0 0 0 2px rgb(var(--c));
	}
	.chip--border.chip--active .chip__body { color: rgb(var(--on-accent)); }
	.chip--border.chip--active .chip__bg {
		background: rgb(var(--c));
		box-shadow: inset 0 0 0 2px rgb(var(--c));
	}
	.chip--border.chip--active .chip__close { background: rgb(0 0 0 / 0.18); }
	.chip--border.chip--active .chip__close:hover { background: rgb(0 0 0 / 0.3); }

	.chip--transparent .chip__body { color: rgb(var(--c)); }
	.chip--transparent .chip__bg { background: transparent; }
	.chip--transparent .chip__close { background: rgb(var(--c) / 0.12); }
	.chip--transparent.chip--active .chip__bg { background: rgb(var(--c) / 0.12); }

	:where(.chip--gradient) { color: rgb(var(--on-accent)); }
	.chip--gradient .chip__bg {
		background: linear-gradient(120deg, rgb(var(--c)) 0%, rgb(var(--ge)) 100%);
	}
	.chip--gradient .chip__close { background: rgb(0 0 0 / 0.18); }
	.chip--gradient .chip__close:hover { background: rgb(0 0 0 / 0.3); }

	:where(.chip--shadow) { color: rgb(var(--text)); }
	.chip--shadow .chip__bg {
		background: rgb(var(--gray-1));
		box-shadow:
			0 10px 28px -6px rgb(0 0 0 / 0.22),
			0 3px 10px -2px rgb(0 0 0 / 0.12),
			inset 0 0 0 1px rgb(var(--gray-3));
	}
	.chip--shadow.chip--active { color: rgb(var(--c)); }
	.chip--shadow.chip--active .chip__bg {
		box-shadow:
			0 10px 22px -6px rgb(var(--c) / 0.5),
			0 3px 8px -2px rgb(0 0 0 / 0.08),
			inset 0 0 0 1px rgb(var(--gray-3));
	}

	.chip--clickable.chip--default:not(.chip--disabled):hover .chip__bg,
	.chip--clickable.chip--gradient:not(.chip--disabled):hover .chip__bg {
		box-shadow: 0 6px 16px -4px rgb(var(--c) / 0.55);
	}
	.chip--clickable.chip--flat:not(.chip--disabled):not(.chip--active):hover .chip__bg {
		background: rgb(var(--c) / 0.22);
	}
	.chip--clickable.chip--transparent:not(.chip--disabled):hover .chip__bg {
		background: rgb(var(--c) / 0.1);
	}
	.chip--clickable.chip--border:not(.chip--disabled):not(.chip--active):hover .chip__bg {
		background: rgb(var(--c) / 0.08);
	}
	.chip--clickable.chip--shadow:not(.chip--disabled):hover .chip__bg {
		box-shadow:
			0 14px 32px -6px rgb(0 0 0 / 0.26),
			0 5px 14px -2px rgb(0 0 0 / 0.14),
			inset 0 0 0 1px rgb(var(--gray-3));
	}

	.chip--clickable.chip--default.chip--active .chip__bg,
	.chip--clickable.chip--gradient.chip--active .chip__bg {
		box-shadow: 0 6px 18px -4px rgb(var(--c) / 0.6);
	}
</style>
