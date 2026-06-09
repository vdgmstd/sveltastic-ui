<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import type { Color, Shape, Size, WithElementRef } from '../../types';
	import type { ChipVariant } from './chip.svelte';

	export type { ChipVariant };

	export type ChipRootProps = WithElementRef<
		{
			/** Visual variant. Mirrors Button vocabulary so chips and buttons read as the same family. */
			variant?: ChipVariant;
			/** Palette name or hex / `rgb(...)` / `r,g,b`. */
			color?: Color;
			/** End-stop color for the `gradient` variant. Defaults to the `--gradient-end` token. */
			gradientEnd?: Color;
			/** Predefined size matching Button's scale (chip glyph proportions are tighter). */
			size?: Size;
			/** Default = pill (chip identity). `square` = `var(--chip-radius)` corners. `circle` = round icon-only chip. */
			shape?: Shape;
			/** Pressed / selected look — for filter and toggle chips. Pairs with `onclick`. */
			active?: boolean;
			/** Fired when a clickable chip toggles, with the next pressed value. */
			onActiveChange?: (active: boolean) => void;
			/** Disabled — blocks click and close. */
			disabled?: boolean;
			/** Visually-hidden suffix announced for a selected (`active`) chip. Override for localized labels. */
			selectedLabel?: string;
			/** Default content — place `Chip.Icon`, the chip text, and `Chip.Close`. */
			children?: Snippet;
			/** Render-delegation: receive the merged props + the styled body (bg + content) and render your own host element. */
			child?: Snippet<[{ props: Record<string, unknown>; body: Snippet }]>;
			/** Click handler. Promotes the chip body to an interactive `role="button"` (keyboard-activatable). */
			onclick?: (event: MouseEvent) => void;
		} & Omit<HTMLAttributes<HTMLSpanElement>, 'children' | 'color' | 'onclick'>,
		HTMLSpanElement
	>;
</script>

<script lang="ts">
	import { untrack } from 'svelte';
	import { ripple as rippleAction } from '../../actions/ripple.svelte';
	import { rgbTriplet } from '../../utils/color';
	import { cn } from '../../utils/cn';
	import { boolAttr } from '../../utils/attrs';
	import { attachRef } from '../../utils/ref';
	import { mergeProps } from '../../utils/mergeProps';
	import { createAttachmentKey, type Attachment } from 'svelte/attachments';
	import { setChipCtx } from './context';
	import { ChipRootState } from './chip.svelte';

	let {
		variant = 'default',
		color = 'primary',
		gradientEnd,
		size = 'medium',
		shape = 'default',
		active = $bindable(false),
		onActiveChange,
		disabled = false,
		selectedLabel = 'selected',
		children,
		child,
		onclick,
		ref = $bindable(null),
		class: className,
		style: userStyle,
		...rest
	}: ChipRootProps = $props();

	let bgEl = $state<HTMLElement>();
	let triplet = $derived(rgbTriplet(color));
	let endTriplet = $derived(gradientEnd ? rgbTriplet(gradientEnd) : undefined);
	let isToggle = $derived(onActiveChange !== undefined);
	let isInteractive = $derived(!!onclick || isToggle);

	setChipCtx(new ChipRootState({ getDisabled: () => disabled }));

	let solidBg = $derived(
		variant === 'default' ||
			variant === 'gradient' ||
			(active && (variant === 'flat' || variant === 'border'))
	);
	let rippleOptions = $derived({
		disabled: !isInteractive || disabled,
		solidBg,
		// On-accent shift only over a solid accent fill; flat/outline keep their own label color.
		textColor: (solidBg ? undefined : 'currentColor') as 'currentColor' | undefined,
		mountTo: bgEl
	});

	function setActive(value: boolean): void {
		if (active === value) return;
		active = value;
		onActiveChange?.(value);
	}

	function handleClick(event: MouseEvent): void {
		if (disabled) return;
		// Only opt-in toggle chips self-toggle; action and one-way controlled chips stay at baseline.
		if (isToggle) setActive(!active);
		onclick?.(event);
	}

	function handleKeydown(event: KeyboardEvent): void {
		if (disabled) return;
		if (event.key !== 'Enter' && event.key !== ' ') return;
		event.preventDefault();
		handleClick(event as unknown as MouseEvent);
	}

	let rippleHandle: ReturnType<typeof rippleAction> | undefined;

	// Hoisted attachment keys so reactive recompute of the prop bag never re-runs the attachments.
	const refKey = createAttachmentKey();
	const rippleKey = createAttachmentKey();

	const attachRipple: Attachment = (node) => {
		untrack(() => {
			rippleHandle = rippleAction(node as HTMLElement, rippleOptions);
		});
		return () => {
			rippleHandle?.destroy?.();
			rippleHandle = undefined;
		};
	};

	$effect(() => {
		rippleHandle?.update?.(rippleOptions);
	});

	let styleVars = $derived(
		`--c:${triplet};${endTriplet ? `--ge:${endTriplet};` : ''}${userStyle ?? ''}`
	);

	let merged = $derived(
		mergeProps(rest, {
			'data-testid': 'chip',
			'data-active': boolAttr(active),
			'data-disabled': boolAttr(disabled),
			style: styleVars,
			class: cn(
				'chip',
				`chip--${variant}`,
				`chip--size-${size}`,
				`chip--shape-${shape}`,
				isInteractive && 'chip--clickable',
				className
			),
			// role=button (not a real <button>) so a nested Chip.Close button stays valid HTML.
			...(isInteractive
				? {
						role: 'button' as const,
						tabindex: disabled ? -1 : 0,
						'aria-disabled': disabled ? ('true' as const) : undefined,
						'aria-pressed': isToggle ? active : undefined,
						onclick: handleClick,
						onkeydown: handleKeydown
					}
				: {}),
			[refKey]: attachRef<HTMLSpanElement>((n) => (ref = n)),
			[rippleKey]: attachRipple
		})
	);
</script>

{#snippet inner()}
	<span class="chip__bg" aria-hidden="true" bind:this={bgEl}></span>
	{@render children?.()}
	{#if active && !isInteractive}<span class="chip__sr">{selectedLabel}</span>{/if}
{/snippet}

{#if child}
	{@render child({ props: merged, body: inner })}
{:else}
	<span {...merged}>
		{@render inner()}
	</span>
{/if}

<style>
	:where(.chip) {
		--c: var(--primary);
		--ge: var(--gradient-end);
		--sa-color: var(--c);

		--chip-font: var(--fs-md);
		--chip-pad-x: var(--space-6);
		--chip-pad-y: var(--space-4);
		--chip-gap: var(--space-3);
		--chip-close-size: 18px;
		--chip-close-icon: 11px;
		--chip-radius: var(--radius);

		position: relative;
		display: inline-flex;
		align-items: center;
		gap: var(--chip-gap);
		box-sizing: border-box;
		margin: 0;
		padding: var(--chip-pad-y) var(--chip-pad-x);
		border: 0;
		border-radius: var(--rad-pill);
		background: transparent;
		font: inherit;
		font-size: var(--chip-font);
		line-height: var(--line-height);
		text-align: inherit;
		color: rgb(var(--c));
		white-space: nowrap;
		outline: none;
		-webkit-user-select: none;
		user-select: none;
		isolation: isolate;
		transform-origin: center;
		transition: transform 320ms var(--ease-spring);
	}
	.chip:not([data-disabled]):hover {
		transform: scale(1.08);
	}
	/* Optical cap-height trim the dropped `.chip__text` wrapper used to receive from tokens.css. */
	@supports (text-box: trim-both cap alphabetic) {
		:where(.chip) {
			text-box: trim-both cap alphabetic;
		}
	}
	.chip--clickable {
		cursor: pointer;
	}
	.chip--clickable[data-disabled] {
		cursor: not-allowed;
	}
	.chip:focus-visible {
		box-shadow: 0 0 0 2px rgb(var(--background)), 0 0 0 4px rgb(var(--c) / 0.6);
	}

	.chip__bg {
		position: absolute;
		inset: 0;
		border-radius: inherit;
		pointer-events: none;
		z-index: -1;
		transition:
			background 200ms var(--ease-standard),
			box-shadow 200ms var(--ease-standard);
	}

	.chip__sr {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		margin: -1px;
		overflow: hidden;
		clip: rect(0, 0, 0, 0);
		white-space: nowrap;
		border: 0;
	}

	:where(.chip:has(:global(.chip__close))) {
		padding-right: calc(var(--chip-close-size) + var(--chip-pad-x) / 2 + var(--chip-gap) / 2);
	}

	:where(.chip[data-disabled]) {
		pointer-events: none;
		opacity: 0.45;
	}

	:where(.chip--shape-default) {
		border-radius: var(--rad-pill);
	}
	:where(.chip--shape-square) {
		border-radius: var(--chip-radius);
	}
	:where(.chip--shape-circle) {
		border-radius: var(--rad-pill);
		aspect-ratio: 1 / 1;
		justify-content: center;
		padding-left: var(--chip-pad-y);
		padding-right: var(--chip-pad-y);
		gap: 0;
	}

	/* Sizes mirror Button so chips and buttons line up at the same height. */
	:where(.chip--size-xl) {
		--chip-font: var(--fs-xl);
		--chip-pad-x: var(--space-8);
		--chip-pad-y: var(--space-6);
		--chip-gap: var(--space-5);
		--chip-close-size: 24px;
		--chip-close-icon: 14px;
		--chip-radius: var(--rad-xl);
	}
	:where(.chip--size-large) {
		--chip-font: var(--fs-lg);
		--chip-pad-x: var(--space-7);
		--chip-pad-y: var(--space-5);
		--chip-gap: var(--space-4);
		--chip-close-size: 22px;
		--chip-close-icon: 13px;
		--chip-radius: var(--rad-lg);
	}
	:where(.chip--size-medium) {
		--chip-font: var(--fs-md);
		--chip-pad-x: var(--space-6);
		--chip-pad-y: var(--space-4);
		--chip-gap: var(--space-3);
		--chip-close-size: 18px;
		--chip-close-icon: 11px;
		--chip-radius: var(--rad-md);
	}
	:where(.chip--size-small) {
		--chip-font: var(--fs-sm);
		--chip-pad-x: var(--space-5);
		--chip-pad-y: var(--space-3);
		/* Kept literal: 5px between tokens 4 and 6, both taken by adjacent ramp steps. */
		--chip-gap: 5px;
		--chip-close-size: 16px;
		--chip-close-icon: 10px;
		--chip-radius: var(--rad-sm);
	}
	:where(.chip--size-mini) {
		--chip-font: var(--fs-xs);
		--chip-pad-x: var(--space-4);
		--chip-pad-y: var(--space-2);
		--chip-gap: var(--space-2);
		--chip-close-size: 13px;
		--chip-close-icon: 8px;
		--chip-radius: var(--rad-xs);
	}

	:where(.chip--default) {
		color: rgb(var(--on-accent));
	}
	.chip--default .chip__bg {
		background: rgb(var(--c));
	}

	.chip--flat {
		color: rgb(var(--c));
	}
	.chip--flat .chip__bg {
		background: rgb(var(--c) / 0.15);
	}
	.chip--flat[data-active] {
		color: rgb(var(--on-accent));
	}
	.chip--flat[data-active] .chip__bg {
		background: rgb(var(--c));
	}

	.chip--border {
		color: rgb(var(--c));
	}
	.chip--border .chip__bg {
		background: transparent;
		box-shadow: inset 0 0 0 2px rgb(var(--c));
	}
	.chip--border[data-active] {
		color: rgb(var(--on-accent));
	}
	.chip--border[data-active] .chip__bg {
		background: rgb(var(--c));
		box-shadow: inset 0 0 0 2px rgb(var(--c));
	}

	.chip--transparent {
		color: rgb(var(--c));
	}
	.chip--transparent .chip__bg {
		background: transparent;
	}
	.chip--transparent[data-active] .chip__bg {
		background: rgb(var(--c) / 0.12);
	}

	:where(.chip--gradient) {
		color: rgb(var(--on-accent));
	}
	.chip--gradient .chip__bg {
		background: linear-gradient(120deg, rgb(var(--c)) 0%, rgb(var(--ge)) 100%);
	}

	:where(.chip--shadow) {
		color: rgb(var(--text));
	}
	.chip--shadow .chip__bg {
		background: rgb(var(--gray-1));
		box-shadow:
			0 10px 28px -6px rgb(0 0 0 / 0.22),
			0 3px 10px -2px rgb(0 0 0 / 0.12),
			inset 0 0 0 1px rgb(var(--gray-3));
	}
	.chip--shadow[data-active] {
		color: rgb(var(--c));
	}
	.chip--shadow[data-active] .chip__bg {
		box-shadow:
			0 10px 22px -6px rgb(var(--c) / 0.5),
			0 3px 8px -2px rgb(0 0 0 / 0.08),
			inset 0 0 0 1px rgb(var(--gray-3));
	}

	.chip--clickable.chip--default:not([data-disabled]):hover .chip__bg,
	.chip--clickable.chip--gradient:not([data-disabled]):hover .chip__bg {
		box-shadow: 0 6px 16px -4px rgb(var(--c) / 0.55);
	}
	.chip--clickable.chip--flat:not([data-disabled]):not([data-active]):hover .chip__bg {
		background: rgb(var(--c) / 0.22);
	}
	.chip--clickable.chip--transparent:not([data-disabled]):hover .chip__bg {
		background: rgb(var(--c) / 0.1);
	}
	.chip--clickable.chip--border:not([data-disabled]):not([data-active]):hover .chip__bg {
		background: rgb(var(--c) / 0.08);
	}
	.chip--clickable.chip--shadow:not([data-disabled]):hover .chip__bg {
		box-shadow:
			0 14px 32px -6px rgb(0 0 0 / 0.26),
			0 5px 14px -2px rgb(0 0 0 / 0.14),
			inset 0 0 0 1px rgb(var(--gray-3));
	}

	.chip--clickable.chip--default[data-active] .chip__bg,
	.chip--clickable.chip--gradient[data-active] .chip__bg {
		box-shadow: 0 6px 18px -4px rgb(var(--c) / 0.6);
	}
</style>
