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
			/** Render-delegation: receive the merged props + the kit's `body` snippet (the sliding thumb + items); render your own root element with `{@render body()}` inside it so the thumb is preserved. */
			child?: Snippet<[{ props: Record<string, unknown>; body: Snippet }]>;
			/** Class merged onto the root. */
			class?: string;
			/** Inline style merged onto the root. */
			style?: string;
		},
		HTMLDivElement
	>;
</script>

<script lang="ts" generics="V extends SegmentedValue">
	import '../../styles/segmented.css';
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

{#snippet body()}
	{@render thumb()}
	{@render children?.()}
{/snippet}

{#if child}
	{@render child({
		props: { ...merged, style: `--c:${triplet};--at:${activeTriplet};${userStyle ?? ''}` },
		body
	})}
{:else}
	<div {...merged} style:--c={triplet} style:--at={activeTriplet} style={userStyle}>
		{@render body()}
	</div>
{/if}

