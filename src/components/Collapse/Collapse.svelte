<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import type { Color, Shape, Size, WithElementRef } from '../../types';
	import type { CollapseVariant } from './context';

	export type { CollapseVariant } from './context';

	export type CollapseProps = WithElementRef<
		{
			/** Stable key — required only inside a `Collapse.Group`. Auto-generated otherwise. */
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
			/** Open state. Two-way bindable. Ignored when wrapped by a `Collapse.Group`. */
			open?: boolean;
			/** Disabled. Trigger is non-interactive and dimmed. */
			disabled?: boolean;
			/** Accessible name for the trigger — use when the header has no visible text (icon-only). */
			ariaLabel?: string;
			children?: Snippet;
			/** Disable the ripple effect on trigger press. */
			ripple?: boolean;
			/** Fired after `open` flips. */
			onOpenChange?: (open: boolean) => void;
			/** Fired after the open/close slide transition finishes. */
			onOpenChangeComplete?: (open: boolean) => void;
			/** Render-delegation: receive the merged props and render your own root element. */
			child?: Snippet<[{ props: Record<string, unknown> }]>;
		} & Omit<HTMLAttributes<HTMLDivElement>, 'color' | 'title'>,
		HTMLDivElement
	>;
</script>

<script lang="ts">
	import { createAttachmentKey } from 'svelte/attachments';
	import { ripple as rippleAction } from '../../actions/ripple.svelte';
	import { reducedMotion } from '../../state/reducedMotion.svelte';
	import { rgbTriplet } from '../../utils/color';
	import { cn } from '../../utils/cn';
	import { boolAttr } from '../../utils/attrs';
	import { mergeProps } from '../../utils/mergeProps';
	import { attachRef } from '../../utils/ref';
	import { setCollapseItemContext, useCollapseGroupContext } from './context';
	import { CollapseRootState } from './collapseState.svelte';

	let {
		ref = $bindable(null),
		key,
		variant,
		color,
		gradientEnd,
		size,
		shape,
		open = $bindable(false),
		disabled = false,
		ariaLabel,
		children,
		ripple: rippleEnabled = true,
		onOpenChange,
		onOpenChangeComplete,
		child,
		class: className,
		style: userStyle,
		...rest
	}: CollapseProps = $props();

	const group = useCollapseGroupContext();
	const uid = $props.id();
	const bodyId = `${uid}-body`;
	const headerId = `${uid}-header`;
	const fallbackKey = group?.register() ?? uid;
	let itemKey = $derived(key ?? fallbackKey);

	let resolvedVariant = $derived(variant ?? group?.variant ?? 'default');
	let resolvedColor = $derived(color ?? group?.color ?? 'primary');
	let resolvedSize = $derived(size ?? group?.size ?? 'medium');
	let resolvedShape = $derived(shape ?? group?.shape ?? 'default');
	let orientation = $derived(group?.orientation ?? 'vertical');

	let triplet = $derived(rgbTriplet(resolvedColor));
	let endTriplet = $derived(gradientEnd ? rgbTriplet(gradientEnd) : undefined);
	let isDarkColor = $derived(resolvedColor === 'dark');
	let isFilledVariant = $derived(
		resolvedVariant === 'solid' || resolvedVariant === 'gradient' || resolvedVariant === 'relief'
	);

	function setOpen(next: boolean): void {
		if (group) {
			group.toggle(itemKey, next);
		} else {
			open = next;
		}
		onOpenChange?.(next);
	}

	const root = new CollapseRootState({
		bodyId,
		headerId,
		key: () => itemKey,
		group: () => group,
		open: () => (group ? group.isOpen(itemKey) : open),
		setOpen,
		disabled: () => disabled,
		ariaLabel: () => ariaLabel,
		onOpenChangeComplete: () => onOpenChangeComplete
	});
	setCollapseItemContext(root);

	let isOpen = $derived(root.isOpen);

	let rippleOptions = $derived({
		color: resolvedColor,
		disabled: disabled || !rippleEnabled || resolvedVariant === 'default',
		solidBg: isFilledVariant,
		trigger: '.collapse__header',
		textColor: 'currentColor' as const
	});

	$effect(() => reducedMotion.subscribe());

	$effect(() => {
		void isOpen;
		root.syncMotion();
	});

	const refKey = createAttachmentKey();

	const attrs = $derived({
		class: cn(
			'collapse',
			`collapse--${resolvedVariant}`,
			`collapse--size-${resolvedSize}`,
			`collapse--shape-${resolvedShape}`,
			isDarkColor && 'collapse--color-dark'
		),
		'data-state': isOpen ? ('open' as const) : ('closed' as const),
		'data-disabled': boolAttr(disabled),
		'data-orientation': group ? orientation : undefined,
		'data-testid': 'collapse'
	});

	const merged = $derived(
		mergeProps(rest, attrs, {
			class: className,
			[refKey]: attachRef<HTMLDivElement>((n) => (ref = n))
		})
	);
</script>

{#if child}
	{@render child({
		props: {
			...merged,
			style: `--c:${triplet};${endTriplet ? `--ge:${endTriplet};` : ''}--rot:${root.caret.current * -180}deg;--o:${root.openness.current};${userStyle ?? ''}`
		}
	})}
{:else}
	<div
		{...merged}
		style:--c={triplet}
		style:--ge={endTriplet}
		style:--rot={`${root.caret.current * -180}deg`}
		style:--o={root.openness.current}
		style={userStyle}
		use:rippleAction={rippleOptions}
	>
		{@render children?.()}
	</div>
{/if}

<style>
	:where(.collapse) {
		--c: var(--primary);
		--ge: var(--gradient-end);
		--c-bright: color-mix(in oklab, rgb(var(--c)), rgb(255 255 255) 38%);
		--collapse-radius: var(--rad-md);
		--collapse-pad-x: var(--space-7);
		--collapse-pad-y: var(--space-6);
		--collapse-font: var(--fs-md);
		--collapse-gap: var(--space-5);
		--collapse-body-pt: var(--space-6);
		--collapse-body-pb: var(--space-7);

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

	:where(.collapse[data-disabled]) { opacity: 0.55; }
	.collapse[data-disabled] :global(.collapse__header) { cursor: not-allowed; }

	.collapse :global(.collapse__header) {
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
		-webkit-user-select: none;
		user-select: none;
		border-radius: inherit;
		box-sizing: border-box;
	}
	.collapse :global(.collapse__header:focus-visible) {
		outline: 2px solid rgb(var(--c) / 0.6);
		outline-offset: 2px;
	}

	.collapse :global(.collapse__icon),
	.collapse :global(.collapse__extra) {
		display: inline-flex;
		align-items: center;
		flex: 0 0 auto;
	}

	.collapse :global(.collapse__title) {
		flex: 1 1 auto;
		min-width: 0;
		font-weight: 600;
	}

	.collapse :global(.collapse__caret) {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		flex: 0 0 auto;
		transform: rotate(var(--rot));
		will-change: transform;
	}

	.collapse :global(.collapse__body) {
		position: relative;
		overflow: hidden;
		border-radius: 0 0 var(--collapse-radius) var(--collapse-radius);
	}
	.collapse :global(.collapse__body-inner) {
		position: relative;
		padding: var(--collapse-body-pt) var(--collapse-pad-x) var(--collapse-body-pb);
		font-size: 0.92em;
		line-height: 1.6;
		color: inherit;
	}
	.collapse :global(.collapse__body-inner::before) {
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

	/* gap 14px kept literal: snaps onto neighbouring steps' tokens otherwise. */
	:where(.collapse--size-xl)     { --collapse-radius: var(--rad-xl); --collapse-pad-x: var(--space-9); --collapse-pad-y: var(--space-8); --collapse-font: var(--fs-xl); --collapse-gap: var(--space-7); --collapse-body-pt: var(--space-8); --collapse-body-pb: var(--space-9); }
	:where(.collapse--size-large)  { --collapse-radius: var(--rad-lg); --collapse-pad-x: var(--space-8); --collapse-pad-y: var(--space-7); --collapse-font: var(--fs-lg); --collapse-gap: 14px;            --collapse-body-pt: var(--space-7); --collapse-body-pb: var(--space-8); }
	:where(.collapse--size-medium) { --collapse-radius: var(--rad-md); --collapse-pad-x: var(--space-7); --collapse-pad-y: var(--space-6); --collapse-font: var(--fs-lg); --collapse-gap: var(--space-6); --collapse-body-pt: var(--space-6); --collapse-body-pb: var(--space-7); }
	:where(.collapse--size-small)  { --collapse-radius: var(--rad-sm); --collapse-pad-x: var(--space-6); --collapse-pad-y: var(--space-5); --collapse-font: var(--fs-md); --collapse-gap: var(--space-5); --collapse-body-pt: var(--space-5); --collapse-body-pb: var(--space-6); }
	:where(.collapse--size-mini)   { --collapse-radius: var(--rad-xs); --collapse-pad-x: var(--space-5); --collapse-pad-y: var(--space-4); --collapse-font: var(--fs-sm); --collapse-gap: var(--space-4); --collapse-body-pt: var(--space-4); --collapse-body-pb: var(--space-5); }

	:where(.collapse--shape-square) { --collapse-radius: 0; }
	:where(.collapse--shape-circle) { --collapse-radius: var(--rad-pill); }
	.collapse--shape-circle :global(.collapse__header),
	.collapse--shape-circle :global(.collapse__body-inner) { padding-inline: calc(var(--collapse-pad-x) + 6px); }

	.collapse--default::before {
		background: rgb(var(--gray-1));
		box-shadow:
			inset 0 0 0 1px rgb(var(--gray-4) / calc(1 - var(--o, 0))),
			inset 0 0 0 1px rgb(var(--c) / calc(0.5 * var(--o, 0))),
			inset calc(3px * var(--o, 0)) 0 0 0 rgb(var(--c)),
			0 calc(2px + var(--o, 0) * 6px) calc(8px + var(--o, 0) * 14px) calc(var(--o, 0) * -4px) rgb(var(--c) / calc(0.06 + var(--o, 0) * 0.22));
	}
	.collapse--default :global(.collapse__title),
	.collapse--default :global(.collapse__caret) {
		color: rgb(var(--text));
	}
	.collapse--default :global(.collapse__header),
	.collapse--default :global(.collapse__body-inner) {
		padding-left: calc(var(--collapse-pad-x) + var(--o, 0) * 4px);
	}
	.collapse--default :global(.collapse__body-inner::before) {
		background: color-mix(in oklab, rgb(var(--gray-4)), rgb(255 255 255) calc(var(--rp, 0) * 100%));
		opacity: 1;
	}

	.collapse--flat::before {
		background: rgb(var(--c) / calc(0.08 + var(--o, 0) * 0.05));
	}
	:where(.collapse--flat) { color: rgb(var(--text)); }
	.collapse--flat :global(.collapse__title),
	.collapse--flat :global(.collapse__icon),
	.collapse--flat :global(.collapse__caret) { color: rgb(var(--c)); }
	.collapse--flat.collapse--color-dark :global(.collapse__title),
	.collapse--flat.collapse--color-dark :global(.collapse__icon),
	.collapse--flat.collapse--color-dark :global(.collapse__caret) { color: rgb(var(--text)); }
	.collapse--flat :global(.collapse__body-inner::before) { background: rgb(var(--c)); opacity: 0.14; }

	.collapse--border::before {
		background: transparent;
		box-shadow:
			inset 0 0 0 1px rgb(var(--c) / calc(0.4 + var(--o, 0) * 0.6)),
			0 calc(var(--o, 0) * 4px) calc(var(--o, 0) * 14px) -8px rgb(var(--c) / calc(var(--o, 0) * 0.25));
	}
	.collapse--border :global(.collapse__title),
	.collapse--border :global(.collapse__caret) { color: rgb(var(--c)); }
	.collapse--border.collapse--color-dark :global(.collapse__title),
	.collapse--border.collapse--color-dark :global(.collapse__caret) { color: rgb(var(--text)); }
	.collapse--border :global(.collapse__body-inner::before) { background: rgb(var(--c)); opacity: calc(0.4 + var(--o, 0) * 0.6); }

	:where(.collapse--solid) {
		color: rgb(255 255 255);
	}
	.collapse--solid::before {
		background: rgb(var(--c));
		box-shadow: 0 calc(var(--o, 0) * 8px) calc(var(--o, 0) * 22px) calc(var(--o, 0) * -8px) rgb(var(--c) / calc(var(--o, 0) * 0.45));
	}
	:where(.collapse--solid.collapse--color-dark) { color: rgb(var(--text)); }
	.collapse--solid :global(.collapse__body-inner::before) { background: rgb(255 255 255); opacity: 0.28; }

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
	.collapse--gradient :global(.collapse__body-inner::before) { background: rgb(255 255 255); opacity: 0.3; }

	:where(.collapse--relief) {
		color: rgb(255 255 255);
	}
	.collapse--relief::before {
		background: rgb(var(--c));
		box-shadow: 6px 6px 0 0 rgb(var(--c) / 0.32);
	}
	:where(.collapse--relief.collapse--color-dark) { color: rgb(var(--text)); }
	.collapse--relief :global(.collapse__body-inner::before) { background: rgb(255 255 255); opacity: 0.28; }

	:where(.collapse--ghost) {
		border-bottom: 1px solid rgb(var(--gray-3));
	}
	.collapse--ghost::before { display: none; }
	.collapse--ghost :global(.collapse__body-inner::before) { display: none; }
	.collapse--ghost :global(.collapse__title),
	.collapse--ghost :global(.collapse__caret) {
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
	:global([data-theme='dark']) .collapse--default :global(.collapse__body-inner::before) {
		background: rgb(var(--gray-2));
		opacity: 1;
	}
	:global([data-theme='dark']) .collapse--ghost {
		border-bottom-color: rgb(var(--gray-2));
	}

	/* Filled variants clip the ripple inset so the wave stays inside the bg fill, not the shadow halo. */
	.collapse--flat :global(.ripple__layer),
	.collapse--border :global(.ripple__layer),
	.collapse--ghost :global(.ripple__layer) {
		opacity: 0.08;
		mix-blend-mode: multiply;
	}
	:global([data-theme='dark']) .collapse--flat :global(.ripple__layer),
	:global([data-theme='dark']) .collapse--border :global(.ripple__layer),
	:global([data-theme='dark']) .collapse--ghost :global(.ripple__layer) {
		opacity: 0.14;
		mix-blend-mode: screen;
	}

	.collapse--solid :global(.ripple__layer),
	.collapse--gradient :global(.ripple__layer),
	.collapse--relief :global(.ripple__layer) {
		inset: 2px;
		border-radius: calc(var(--collapse-radius) - 2px);
		opacity: 0.12;
	}
	.collapse--solid :global(.ripple__effect),
	.collapse--gradient :global(.ripple__effect),
	.collapse--relief :global(.ripple__effect) {
		background: radial-gradient(circle,
			rgb(255 255 255) 0%,
			rgb(255 255 255) 78%,
			rgb(255 255 255 / 0.85) 92%,
			rgb(255 255 255) 100%);
	}
</style>
