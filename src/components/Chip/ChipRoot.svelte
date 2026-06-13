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
	import '../../styles/chip.css';
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

	const root = setChipCtx(
		new ChipRootState({ getDisabled: () => disabled, getInteractive: () => isInteractive })
	);

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
		if (event.key === 'Delete' || event.key === 'Backspace') {
			event.preventDefault();
			root.requestClose(event);
			return;
		}
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
			// role=button with no focusable descendants — interactive Chip.Close goes presentational, Delete/Backspace removes.
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

