<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import type { Color, Shape, Size } from '../../types';

	export type CollapseVariant =
		| 'default'
		| 'flat'
		| 'border'
		| 'solid'
		| 'gradient'
		| 'relief'
		| 'ghost';

	export type CollapseProps = {
		/** Stable key — required only inside a `CollapseGroup`. Auto-generated otherwise. */
		key?: string;
		/** Visual variant. */
		variant?: CollapseVariant;
		/** Palette name, hex, `rgb(...)`, or `"r,g,b"` triplet. */
		color?: Color;
		/** End-stop color for the `gradient` variant. Defaults to the `--gradient-end` token. */
		gradientEnd?: Color;
		/** Size scale (typography + paddings). */
		size?: Size;
		/** Border-radius shape. `square` zeroes the radius for tight lists. */
		shape?: Shape;
		/** Open state. Two-way bindable. Ignored when wrapped by a `CollapseGroup`. */
		open?: boolean;
		/** Disabled. Header is non-interactive and dimmed. */
		disabled?: boolean;
		/** Header title text. Ignored when `header` snippet is provided. */
		title?: string;
		/** Header snippet — full control of the title row. Overrides `title`. */
		header?: Snippet;
		/** Leading icon, rendered before the title. */
		icon?: Snippet;
		/** Trailing slot before the caret — counts, badges, meta. */
		extra?: Snippet;
		/** Body content. */
		children?: Snippet;
		/** Disable the ripple effect on header click. */
		ripple?: boolean;
		/** Fires after `open` flips. */
		ontoggle?: (open: boolean) => void;
	} & Omit<HTMLAttributes<HTMLDivElement>, 'color' | 'title'>;
</script>

<script lang="ts">
	import { Tween } from 'svelte/motion';
	import { slide } from 'svelte/transition';
	import { quintOut } from 'svelte/easing';
	import { CaretDownIcon } from 'phosphor-svelte';
	import { ripple as rippleAction } from '../../actions/ripple.svelte';
	import { rgbTriplet } from '../../utils/color';
	import { cn } from '../../utils/cn';
	import { nextId } from '../../state/ids.svelte';
	import { getCollapseGroupContext } from './CollapseGroup.svelte';

	let {
		key,
		variant,
		color,
		gradientEnd,
		size,
		shape,
		open = $bindable(false),
		disabled = false,
		title = '',
		header,
		icon,
		extra,
		children,
		ripple: rippleEnabled = true,
		ontoggle,
		class: className,
		style: userStyle,
		...rest
	}: CollapseProps = $props();

	const group = getCollapseGroupContext();
	const fallbackKey = group?.register() ?? nextId('collapse-item');
	const bodyId = nextId('collapse-body');
	let itemKey = $derived(key ?? fallbackKey);

	let resolvedVariant = $derived(variant ?? group?.variant ?? 'default');
	let resolvedColor = $derived(color ?? group?.color ?? 'primary');
	let resolvedSize = $derived(size ?? group?.size ?? 'medium');
	let resolvedShape = $derived(shape ?? group?.shape ?? 'default');

	let isOpen = $derived(group ? group.isOpen(itemKey) : open);
	let triplet = $derived(rgbTriplet(resolvedColor));
	let endTriplet = $derived(gradientEnd ? rgbTriplet(gradientEnd) : undefined);
	let isDarkColor = $derived(resolvedColor === 'dark');
	let isFilledVariant = $derived(
		resolvedVariant === 'solid' ||
			resolvedVariant === 'gradient' ||
			resolvedVariant === 'relief'
	);
	let rippleOptions = $derived({
		color: resolvedColor,
		disabled: disabled || !rippleEnabled || resolvedVariant === 'default',
		solidBg: isFilledVariant,
		trigger: '.collapse__header',
		textColor: 'currentColor' as const
	});

	const caret = new Tween(0, { duration: 360, easing: quintOut });
	const openness = new Tween(0, { duration: 360, easing: quintOut });

	$effect(() => {
		caret.target = isOpen ? 1 : 0;
		openness.target = isOpen ? 1 : 0;
	});

	function setOpen(next: boolean): void {
		if (group) {
			group.toggle(itemKey, next);
		} else {
			open = next;
		}
		ontoggle?.(next);
	}

	function handleClick(): void {
		if (disabled) return;
		setOpen(!isOpen);
	}

	function handleKeydown(event: KeyboardEvent): void {
		if (disabled) return;
		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			setOpen(!isOpen);
		}
	}
</script>

<div
	class={cn(
		'collapse',
		`collapse--${resolvedVariant}`,
		`collapse--size-${resolvedSize}`,
		`collapse--shape-${resolvedShape}`,
		isOpen && 'collapse--open',
		disabled && 'collapse--disabled',
		isDarkColor && 'collapse--color-dark',
		className
	)}
	style:--c={triplet}
	style:--ge={endTriplet}
	style:--rot={`${caret.current * -180}deg`}
	style:--o={openness.current}
	style={userStyle}
	data-testid="collapse"
	use:rippleAction={rippleOptions}
	{...rest}
>
	<button
		type="button"
		class="collapse__header"
		aria-expanded={isOpen}
		aria-controls={bodyId}
		disabled={disabled || undefined}
		onclick={handleClick}
		onkeydown={handleKeydown}
	>
		{#if icon}
			<span class="collapse__icon">{@render icon()}</span>
		{/if}

		<span class="collapse__title">
			{#if header}{@render header()}{:else}{title}{/if}
		</span>

		{#if extra}
			<span class="collapse__extra">{@render extra()}</span>
		{/if}

		<span class="collapse__caret" aria-hidden="true">
			<CaretDownIcon size={14} weight="bold" />
		</span>
	</button>

	{#if isOpen}
		<div
			id={bodyId}
			class="collapse__body"
			transition:slide={{ duration: 360, easing: quintOut }}
		>
			<div class="collapse__body-inner">
				{@render children?.()}
			</div>
		</div>
	{/if}
</div>

<style>
	:where(.collapse) {
		--c: var(--primary);
		--ge: var(--gradient-end);
		--c-bright: color-mix(in oklab, rgb(var(--c)), rgb(255 255 255) 38%);
		--c-active: color-mix(in oklab, var(--c-bright), rgb(255 255 255) calc(var(--rp, 0) * 100%));
		--collapse-radius: 14px;
		--collapse-pad-x: 18px;
		--collapse-pad-y: 14px;
		--collapse-font: 0.95rem;
		--collapse-gap: 12px;
		--collapse-body-pt: 14px;
		--collapse-body-pb: 18px;

		position: relative;
		display: block;
		visibility: visible;
		isolation: isolate;
		border-radius: var(--collapse-radius);
		font-size: var(--collapse-font);
		color: rgb(var(--text));
		box-sizing: border-box;
	}

	.collapse::before {
		content: '';
		position: absolute;
		inset: 0;
		z-index: -1;
		border-radius: inherit;
		pointer-events: none;
	}

	:where(.collapse--disabled) { opacity: 0.55; }
	.collapse--disabled .collapse__header { cursor: not-allowed; }

	.collapse__header {
		position: relative;
		display: flex;
		align-items: center;
		gap: var(--collapse-gap);
		width: 100%;
		padding: var(--collapse-pad-y) var(--collapse-pad-x);
		border: 0;
		background: transparent;
		color: inherit;
		font: inherit;
		font-size: inherit;
		text-align: left;
		cursor: pointer;
		border-radius: inherit;
		box-sizing: border-box;
	}

	.collapse__header:focus-visible {
		outline: 2px solid rgb(var(--c) / 0.6);
		outline-offset: 2px;
	}

	.collapse__icon,
	.collapse__extra {
		display: inline-flex;
		align-items: center;
		flex: 0 0 auto;
	}

	.collapse__title {
		flex: 1 1 auto;
		min-width: 0;
		font-weight: 600;
	}

	.collapse__caret {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		flex: 0 0 auto;
		transform: rotate(var(--rot));
		will-change: transform;
	}

	.collapse__body {
		position: relative;
		overflow: hidden;
		border-radius: 0 0 var(--collapse-radius) var(--collapse-radius);
	}
	.collapse__body-inner {
		position: relative;
		padding: var(--collapse-body-pt) var(--collapse-pad-x) var(--collapse-body-pb);
		font-size: 0.92em;
		line-height: 1.6;
		color: inherit;
	}
	.collapse__body-inner::before {
		content: '';
		position: absolute;
		left: var(--collapse-pad-x);
		right: var(--collapse-pad-x);
		top: 0;
		height: 1px;
		background: currentColor;
		opacity: 0.12;
		pointer-events: none;
	}

	:where(.collapse--size-xl)     { --collapse-radius: 22px; --collapse-pad-x: 24px; --collapse-pad-y: 20px; --collapse-font: 1.15rem; --collapse-gap: 16px; --collapse-body-pt: 18px; --collapse-body-pb: 24px; }
	:where(.collapse--size-large)  { --collapse-radius: 18px; --collapse-pad-x: 20px; --collapse-pad-y: 16px; --collapse-font: 1rem;    --collapse-gap: 14px; --collapse-body-pt: 16px; --collapse-body-pb: 20px; }
	:where(.collapse--size-medium) { --collapse-radius: 14px; --collapse-pad-x: 18px; --collapse-pad-y: 14px; --collapse-font: 0.95rem; --collapse-gap: 12px; --collapse-body-pt: 14px; --collapse-body-pb: 18px; }
	:where(.collapse--size-small)  { --collapse-radius: 10px; --collapse-pad-x: 14px; --collapse-pad-y: 10px; --collapse-font: 0.85rem; --collapse-gap: 10px; --collapse-body-pt: 10px; --collapse-body-pb: 14px; }
	:where(.collapse--size-mini)   { --collapse-radius: 8px;  --collapse-pad-x: 11px; --collapse-pad-y: 7px;  --collapse-font: 0.75rem; --collapse-gap: 8px;  --collapse-body-pt: 8px;  --collapse-body-pb: 11px; }

	:where(.collapse--shape-square) { --collapse-radius: 0; }
	:where(.collapse--shape-circle) { --collapse-radius: 999px; }
	.collapse--shape-circle .collapse__header,
	.collapse--shape-circle .collapse__body-inner { padding-inline: calc(var(--collapse-pad-x) + 6px); }

	.collapse--default::before {
		background: rgb(var(--gray-1));
		box-shadow:
			inset 0 0 0 1px rgb(var(--gray-4) / calc(1 - var(--o, 0))),
			inset 0 0 0 1px rgb(var(--c) / calc(0.5 * var(--o, 0))),
			inset calc(3px * var(--o, 0)) 0 0 0 rgb(var(--c)),
			0 calc(2px + var(--o, 0) * 6px) calc(8px + var(--o, 0) * 14px) calc(var(--o, 0) * -4px) rgb(var(--c) / calc(0.06 + var(--o, 0) * 0.22));
	}
	.collapse--default .collapse__title,
	.collapse--default .collapse__caret {
		color: rgb(var(--text));
	}
	.collapse--default .collapse__header,
	.collapse--default .collapse__body-inner {
		padding-left: calc(var(--collapse-pad-x) + var(--o, 0) * 4px);
	}
	.collapse--default .collapse__body-inner::before {
		background: color-mix(in oklab, rgb(var(--gray-4)), rgb(255 255 255) calc(var(--rp, 0) * 100%));
		opacity: 1;
	}

	.collapse--flat::before {
		background: rgb(var(--c) / calc(0.08 + var(--o, 0) * 0.05));
	}
	:where(.collapse--flat) { color: rgb(var(--text)); }
	.collapse--flat .collapse__title,
	.collapse--flat .collapse__icon,
	.collapse--flat .collapse__caret { color: rgb(var(--c)); }
	.collapse--flat.collapse--color-dark .collapse__title,
	.collapse--flat.collapse--color-dark .collapse__icon,
	.collapse--flat.collapse--color-dark .collapse__caret { color: rgb(var(--text)); }
	.collapse--flat .collapse__body-inner::before { background: rgb(var(--c)); opacity: 0.14; }

	.collapse--border::before {
		background: transparent;
		box-shadow:
			inset 0 0 0 1px rgb(var(--c) / calc(0.4 + var(--o, 0) * 0.6)),
			0 calc(var(--o, 0) * 4px) calc(var(--o, 0) * 14px) -8px rgb(var(--c) / calc(var(--o, 0) * 0.25));
	}
	.collapse--border .collapse__title,
	.collapse--border .collapse__caret { color: rgb(var(--c)); }
	.collapse--border.collapse--color-dark .collapse__title,
	.collapse--border.collapse--color-dark .collapse__caret { color: rgb(var(--text)); }
	.collapse--border .collapse__body-inner::before { background: rgb(var(--c)); opacity: calc(0.4 + var(--o, 0) * 0.6); }

	:where(.collapse--solid) {
		color: rgb(255 255 255);
	}
	.collapse--solid::before {
		background: rgb(var(--c));
		box-shadow: 0 calc(var(--o, 0) * 8px) calc(var(--o, 0) * 22px) calc(var(--o, 0) * -8px) rgb(var(--c) / calc(var(--o, 0) * 0.45));
	}
	:where(.collapse--solid.collapse--color-dark) { color: rgb(var(--text)); }
	.collapse--solid .collapse__body-inner::before { background: rgb(255 255 255); opacity: 0.28; }

	:where(.collapse--gradient) {
		color: rgb(255 255 255);
	}
	.collapse--gradient::before {
		background: rgb(var(--c));
		overflow: hidden;
		box-shadow: 0 calc(var(--o, 0) * 10px) calc(var(--o, 0) * 24px) calc(var(--o, 0) * -8px) rgb(var(--c) / calc(var(--o, 0) * 0.5));
	}
	.collapse--gradient::after {
		content: '';
		position: absolute;
		inset: 0;
		z-index: -1;
		border-radius: inherit;
		background: linear-gradient(30deg, rgb(var(--ge) / 0) 33%, rgb(var(--ge)) 100%);
		pointer-events: none;
	}
	.collapse--gradient .collapse__body-inner::before { background: rgb(255 255 255); opacity: 0.3; }

	:where(.collapse--relief) {
		color: rgb(255 255 255);
	}
	.collapse--relief::before {
		background: rgb(var(--c));
		box-shadow: 6px 6px 0 0 rgb(var(--c) / 0.32);
	}
	:where(.collapse--relief.collapse--color-dark) { color: rgb(var(--text)); }
	.collapse--relief .collapse__body-inner::before { background: rgb(255 255 255); opacity: 0.28; }

	:where(.collapse--ghost) {
		border-bottom: 1px solid rgb(var(--gray-3));
	}
	.collapse--ghost::before { display: none; }
	.collapse--ghost .collapse__body-inner::before { display: none; }
	.collapse--ghost .collapse__title,
	.collapse--ghost .collapse__caret {
		color: color-mix(in oklab, rgb(var(--text)), var(--c-bright) calc(var(--o, 0) * 100%));
	}

	:global([data-theme='dark']) .collapse--default::before {
		background: rgb(var(--gray-1));
		box-shadow:
			inset 0 0 0 1px rgb(var(--gray-2) / calc(1 - var(--o, 0))),
			inset 0 0 0 1px rgb(var(--c) / calc(0.5 * var(--o, 0))),
			inset calc(3px * var(--o, 0)) 0 0 0 rgb(var(--c)),
			0 calc(2px + var(--o, 0) * 6px) calc(8px + var(--o, 0) * 14px) calc(var(--o, 0) * -4px) rgb(0 0 0 / calc(var(--shadow-opacity) * (0.4 + var(--o, 0) * 0.4)));
	}
	:global([data-theme='dark']) .collapse--default .collapse__body-inner::before {
		background: rgb(var(--gray-2));
		opacity: 1;
	}
	:global([data-theme='dark']) .collapse--ghost {
		border-bottom-color: rgb(var(--gray-2));
	}

	/* Ripple — subtle accent wave on transparent variants, white wash on filled.
	   Filled variants with shadow get an inset + matching radius so the wave is clipped inside the bg fill (not bleeding onto the shadow halo). Transparent variants keep the layer at the host's edges. */
	.collapse--flat :global(.vs-ripple__layer),
	.collapse--border :global(.vs-ripple__layer),
	.collapse--ghost :global(.vs-ripple__layer) {
		opacity: 0.08;
		mix-blend-mode: multiply;
	}
	:global([data-theme='dark']) .collapse--flat :global(.vs-ripple__layer),
	:global([data-theme='dark']) .collapse--border :global(.vs-ripple__layer),
	:global([data-theme='dark']) .collapse--ghost :global(.vs-ripple__layer) {
		opacity: 0.14;
		mix-blend-mode: screen;
	}

	.collapse--solid :global(.vs-ripple__layer),
	.collapse--gradient :global(.vs-ripple__layer),
	.collapse--relief :global(.vs-ripple__layer) {
		inset: 2px;
		border-radius: calc(var(--collapse-radius) - 2px);
		opacity: 0.12;
	}
	.collapse--solid :global(.vs-ripple__effect),
	.collapse--gradient :global(.vs-ripple__effect),
	.collapse--relief :global(.vs-ripple__effect) {
		background: radial-gradient(circle,
			rgb(255 255 255) 0%,
			rgb(255 255 255) 78%,
			rgb(255 255 255 / 0.85) 92%,
			rgb(255 255 255) 100%);
	}
</style>
