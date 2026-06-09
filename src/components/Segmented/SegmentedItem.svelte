<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { Color, WithElementRef } from '../../types';
	import type { HTMLButtonAttributes } from 'svelte/elements';
	import type { SegmentedValue } from './context';

	export type SegmentedItemProps<V extends SegmentedValue = SegmentedValue> = WithElementRef<
		{
			/** Stored when this segment is picked. Must be unique within the parent `Segmented.Root`. */
			value: V;
			/** Inert segment. */
			disabled?: boolean;
			/** Per-item palette accent. Falls back to the group `color`. Drives the active label color, the active thumb tint, and the click-ripple bloom on this segment. */
			color?: Color;
			/** Label content. Place `<Segmented.ItemIcon>` here for a leading glyph. */
			children?: Snippet;
			/** Render-delegation: receive the merged props and render your own segment element. */
			child?: Snippet<[{ props: Record<string, unknown> }]>;
		} & Omit<HTMLButtonAttributes, 'children' | 'disabled' | 'value' | 'color'>,
		HTMLButtonElement
	>;
</script>

<script lang="ts" generics="V extends SegmentedValue">
	import { createAttachmentKey } from 'svelte/attachments';
	import { ripple as rippleAction } from '../../actions/ripple.svelte';
	import { cn } from '../../utils/cn';
	import { boolAttr } from '../../utils/attrs';
	import { mergeProps } from '../../utils/mergeProps';
	import { attachRef } from '../../utils/ref';
	import { useSegmentedContext } from './context';
	import { SegmentedItemState } from './segmentedState.svelte';

	let {
		ref = $bindable(null),
		value,
		disabled = false,
		color,
		children,
		child,
		class: className,
		...rest
	}: SegmentedItemProps<V> = $props();
	const ctx = useSegmentedContext();

	const item = ctx
		? new SegmentedItemState(
				ctx,
				() => value,
				() => disabled
			)
		: undefined;

	let variant = $derived(ctx?.variant ?? 'default');
	let groupColor = $derived(ctx?.color ?? 'primary');
	let isActive = $derived(item?.isActive ?? false);
	let isInert = $derived(item?.isInert ?? disabled);
	let onFilledThumb = $derived(ctx?.onFilledThumb ?? true);

	$effect(() => {
		if (isActive) ctx?.setActiveColor(color);
	});

	$effect(() => ctx?.registerValue(value));

	let rippleOptions = $derived({
		disabled: isInert || !(ctx?.ripple ?? true),
		color: onFilledThumb ? '255 255 255' : (color ?? groupColor),
		soft: true,
		duration: 1000,
		mountTo: ctx?.ripplesLayer,
		textColor: 'currentColor' as const
	});

	// Mint once: re-minting in the $derived re-runs the attachment every recompute.
	const refKey = createAttachmentKey();
	const rovingKey = createAttachmentKey();

	// Stable identity — inlining re-ran register/deregister each recompute (loop vs tabindexFor).
	const registerRoving = (node: HTMLElement) =>
		ctx ? ctx.roving.register(ctx.itemId(value), node) : undefined;

	const attrs = $derived({
		type: 'button' as const,
		class: cn(`segmented__item segmented__item--variant-${variant}`, className),
		role: 'radio' as const,
		id: ctx?.itemId(value),
		'aria-checked': isActive,
		tabindex: ctx?.roving.tabindexFor(ctx.itemId(value)) ?? (isActive ? 0 : -1),
		disabled: isInert || undefined,
		'data-state': isActive ? ('active' as const) : ('inactive' as const),
		'data-value': String(value),
		'data-disabled': boolAttr(isInert),
		'data-testid': 'segmented-item',
		onpointerdown: (e: PointerEvent) => {
			if (isInert) return;
			ctx?.press.onpointerdown(e);
		},
		onclick: () => item?.select(),
		onkeydown: (e: KeyboardEvent) => item?.handleKeydown(e)
	});
	const merged = $derived(
		mergeProps(rest, attrs, {
			[refKey]: attachRef<HTMLButtonElement>((n) => (ref = n)),
			[rovingKey]: registerRoving
		})
	);
</script>

{#if child}
	{@render child({ props: merged })}
{:else}
	<button {...merged} use:rippleAction={rippleOptions}>
		{@render children?.()}
	</button>
{/if}

<style>
	/* :global so the contract reaches consumer elements rendered via the `child` snippet (out of scope); :where keeps zero specificity. */
	:global(:where(.segmented__item)) {
		position: relative;
		z-index: 2;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: var(--space-3);
		padding: var(--item-py, 5px) var(--item-px, var(--space-6));
		background: transparent;
		border: 0;
		color: rgb(var(--text) / 0.6);
		font: inherit;
		font-size: var(--font-size, var(--fs-md));
		font-weight: 500;
		cursor: pointer;
		border-radius: var(--inner-radius, 10px);
		white-space: nowrap;
		outline: none;
		transition: color 220ms var(--ease-standard);
	}

	:global(:where(.segmented__item:hover[data-state='inactive']:not(:disabled))) {
		color: rgb(var(--text) / 0.95);
	}

	:global(:where(.segmented__item:focus-visible[data-state='inactive'])) {
		color: rgb(var(--c));
	}

	/* Ramp the active colour in step with the spring thumb — neither front-loaded (white-on-track flash) nor back-loaded (late). */
	:global(:where(.segmented__item[data-state='active'])) {
		color: rgb(var(--on-accent));
		transition: color 240ms cubic-bezier(0.35, 0, 0.65, 1);
	}

	:global(:where(.segmented__item:disabled)),
	:global(:where(.segmented__item[data-disabled])) {
		opacity: 0.45;
		cursor: not-allowed;
	}

	/* flat — accent-mixed inactive label, accent active label */
	:global(:where(.segmented__item--variant-flat)) {
		color: color-mix(in oklab, rgb(var(--text) / 0.55), rgb(var(--c)) 35%);
	}
	:global(:where(.segmented__item--variant-flat:hover[data-state='inactive']:not(:disabled))) {
		color: rgb(var(--c));
	}
	:global(:where(.segmented__item--variant-flat[data-state='active'])) {
		color: rgb(var(--at));
	}

	/* border — accent active label */
	:global(:where(.segmented__item--variant-border[data-state='active'])) {
		color: rgb(var(--at));
	}
</style>
