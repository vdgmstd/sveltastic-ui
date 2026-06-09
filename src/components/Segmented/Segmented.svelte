<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { Color, Size, WithElementRef } from '../../types';
	import type { SegmentedValue, SegmentedVariant } from './context';

	export type { SegmentedValue, SegmentedVariant } from './context';

	export type SegmentedRootProps<V extends SegmentedValue = SegmentedValue> = WithElementRef<
		{
			/** Selected token. Bindable. */
			value?: V;
			/** Palette accent for the active thumb and (in `flat`) the track tint. */
			color?: Color;
			/** Visual variant. */
			variant?: SegmentedVariant;
			/** Sizing scale — shared with Button (`xl` | `large` | `medium` | `small` | `mini`). Outer height matches a Button at the same size. */
			size?: Size;
			/** Stretch the group to fill the container width. */
			block?: boolean;
			/** Disable the entire group. */
			disabled?: boolean;
			/** Emit a click ripple on selection. */
			ripple?: boolean;
			/** Wrap arrow navigation past the ends. Default `false`. */
			loop?: boolean;
			/** Accessible label for the radiogroup. */
			ariaLabel?: string;
			/** Composition slot — `<Segmented.Item>` children, in any order. */
			children?: Snippet;
			/** Fired on selection change. */
			onValueChange?: (value: V) => void;
			/** Render-delegation: receive the merged props and render your own root element. */
			child?: Snippet<[{ props: Record<string, unknown> }]>;
			/** Class merged onto the root. */
			class?: string;
			/** Inline style merged onto the root. */
			style?: string;
		},
		HTMLDivElement
	>;
</script>

<script lang="ts" generics="V extends SegmentedValue">
	import { createAttachmentKey } from 'svelte/attachments';
	import { rgbTriplet } from '../../utils/color';
	import { boolAttr } from '../../utils/attrs';
	import { mergeProps } from '../../utils/mergeProps';
	import { attachRef } from '../../utils/ref';
	import { setSegmentedContext } from './context';
	import { SegmentedRootState } from './segmentedState.svelte';

	let {
		ref = $bindable(null),
		value = $bindable(),
		color = 'primary',
		variant = 'default',
		size = 'medium',
		block = false,
		disabled = false,
		ripple = true,
		loop = false,
		ariaLabel,
		children,
		onValueChange,
		child,
		class: className,
		style: userStyle,
		...rest
	}: SegmentedRootProps<V> = $props();

	const baseId = $props.id();
	let triplet = $derived(rgbTriplet(color));

	const root = setSegmentedContext(
		new SegmentedRootState({
			baseId,
			getValue: () => value,
			setValueProp: (next) => {
				value = next as V;
			},
			color: () => color,
			variant: () => variant,
			size: () => size,
			block: () => block,
			disabled: () => disabled,
			ripple: () => ripple,
			loop: () => loop,
			onValueChange: () => onValueChange as ((value: SegmentedValue) => void) | undefined
		})
	);

	let activeTriplet = $derived(rgbTriplet(root.activeColor));
	let ripplesLayer = $state<HTMLSpanElement>();

	$effect(() => {
		root.roving.loop = loop;
	});

	$effect(() => {
		if (value !== undefined) root.roving.setCurrent(root.itemId(value));
	});

	$effect(() => {
		root.setRipplesLayer(ripplesLayer);
		return () => root.setRipplesLayer(undefined);
	});

	$effect(() => {
		void value;
		void variant;
		void size;
		root.measure();
	});

	$effect(() => {
		const track = root.track;
		if (!track) return;
		return root.thumb.observe(track, () => root.measure());
	});

	$effect(() => () => root.thumb.destroy());

	const attrs = $derived({
		class: [
			'segmented',
			`segmented--${size}`,
			`segmented--variant-${variant}`,
			block ? 'segmented--block' : undefined
		]
			.filter(Boolean)
			.join(' '),
		role: 'radiogroup' as const,
		'aria-label': ariaLabel,
		'aria-disabled': disabled || undefined,
		'data-orientation': 'horizontal' as const,
		'data-disabled': boolAttr(disabled),
		'data-testid': 'segmented'
	});
	const trackKey = createAttachmentKey();
	const merged = $derived(
		mergeProps(rest, attrs, {
			class: className,
			[trackKey]: attachRef<HTMLDivElement>((n) => {
				ref = n;
				root.setTrack(n);
			})
		})
	);
</script>

{#snippet thumb()}
	<span
		class="segmented__thumb"
		data-hidden={boolAttr(root.thumb.w === 0)}
		aria-hidden="true"
		style:--x={`${root.thumb.x}px`}
		style:--w={`${root.thumb.w}px`}
		style:--ps={root.press.scale}
	>
		<span bind:this={ripplesLayer} class="segmented__thumb-ripples" aria-hidden="true"></span>
	</span>
{/snippet}

{#if child}
	{@render child({
		props: { ...merged, style: `--c:${triplet};--at:${activeTriplet};${userStyle ?? ''}` }
	})}
{:else}
	<div {...merged} style:--c={triplet} style:--at={activeTriplet} style={userStyle}>
		{@render thumb()}
		{@render children?.()}
	</div>
{/if}

<style>
	:where(.segmented) {
		--c: var(--primary);
		--at: var(--c);
		--x: 0px;
		--w: 0px;
		--pad: 3px;
		--radius: var(--rad-md);
		--inner-radius: 10px;
		--item-py: 5px;
		--item-px: var(--space-6);
		--font-size: var(--fs-md);
		--ripple-soft-alpha: 0.2;

		position: relative;
		display: inline-flex;
		align-items: stretch;
		padding: var(--pad);
		background: rgb(var(--gray-2));
		border-radius: var(--radius);
		-webkit-user-select: none;
		user-select: none;
		isolation: isolate;
	}

	:where(.segmented--xl) {
		--pad: var(--space-3);
		--item-py: var(--space-5);
		--item-px: var(--space-8);
		--font-size: var(--fs-xl);
		--radius: var(--rad-xl);
		--inner-radius: var(--rad-lg);
	}

	:where(.segmented--large) {
		--pad: var(--space-2);
		--item-py: var(--space-3);
		--item-px: var(--space-7);
		--font-size: var(--fs-lg);
		--radius: var(--rad-lg);
		--inner-radius: var(--rad-md);
	}

	:where(.segmented--small) {
		--pad: var(--space-1);
		--item-py: var(--space-2);
		--item-px: var(--space-5);
		--font-size: var(--fs-sm);
		--radius: var(--rad-sm);
		--inner-radius: var(--rad-sm);
	}

	:where(.segmented--mini) {
		--pad: 1px;
		--item-py: var(--space-1);
		--item-px: var(--space-4);
		--font-size: var(--fs-xs);
		--radius: var(--rad-xs);
		--inner-radius: var(--rad-xs);
	}

	:where(.segmented--block) {
		display: grid;
		grid-auto-flow: column;
		grid-auto-columns: 1fr;
		width: 100%;
	}

	:where(.segmented[data-disabled]) {
		opacity: 0.55;
	}

	.segmented__thumb {
		position: absolute;
		top: var(--pad);
		bottom: var(--pad);
		left: 0;
		width: var(--w);
		transform: translateX(var(--x)) scale(var(--ps, 1));
		transform-origin: center;
		background: rgb(var(--at));
		border-radius: var(--inner-radius);
		pointer-events: none;
		z-index: 1;
		transition: background-color 220ms var(--ease-standard);
	}

	.segmented__thumb-ripples {
		position: absolute;
		inset: 0;
		overflow: hidden;
		pointer-events: none;
		border-radius: inherit;
	}

	.segmented__thumb[data-hidden] {
		opacity: 0;
	}

	/* flat — soft accent-tinted thumb (mirrors Button flat) */
	:where(.segmented--variant-flat) {
		background: rgb(var(--c) / 0.08);
	}
	.segmented--variant-flat .segmented__thumb {
		background: rgb(var(--at) / 0.15);
	}

	/* border — outlined track and thumb (mirrors Button border) */
	:where(.segmented--variant-border) {
		background: transparent;
		box-shadow: inset 0 0 0 1px rgb(var(--text) / 0.18);
	}
	.segmented--variant-border .segmented__thumb {
		background: transparent;
		box-shadow: inset 0 0 0 2px rgb(var(--at));
	}

	/* relief — solid accent thumb with bottom-border depth (mirrors Button relief) */
	.segmented--variant-relief {
		background: rgb(var(--gray-2));
	}
	.segmented--variant-relief .segmented__thumb {
		box-shadow:
			inset 0 -3px 0 color-mix(in oklab, rgb(var(--at)), black 28%),
			0 1px 2px rgb(0 0 0 / 0.1);
	}
</style>
