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
	import '../../styles/collapse.css';
	import { createAttachmentKey } from 'svelte/attachments';
	import { ripple as rippleAction } from '../../actions/ripple.svelte';
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
		open = $bindable(),
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
		open: () => (group ? group.isOpen(itemKey) : (open ?? false)),
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
