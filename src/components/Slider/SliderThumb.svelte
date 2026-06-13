<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { WithElementRef } from '../../types';

	export type SliderThumbProps = WithElementRef<
		{
			/** Thumb index — `0` (low / single) or `1` (high, range only). Auto-derived from mount order when omitted; pass it only to force a position (escape hatch for out-of-order or single-tooltip-style composition). */
			index?: 0 | 1;
			/** Accessible name override for this thumb's input. Falls back to the Root `ariaLabel`/`ariaLabelMin`/`ariaLabelMax`. */
			ariaLabel?: string;
			/** Render-delegation: receive the merged input props and render your own range input. */
			child?: Snippet<[{ props: Record<string, unknown> }]>;
			/** Extra classes merged onto the native input. */
			class?: string;
		},
		HTMLInputElement
	>;
</script>

<script lang="ts">
	import { createAttachmentKey } from 'svelte/attachments';
	import { mergeProps } from '../../utils/mergeProps';
	import { attachRef } from '../../utils/ref';
	import { getSliderCtx } from './context';

	let {
		ref = $bindable(null),
		index: indexProp,
		ariaLabel,
		child,
		class: className,
		...rest
	}: SliderThumbProps = $props();
	const root = getSliderCtx();

	// Auto-index from mount order unless an explicit `index` is passed (explicit wins).
	const token = Symbol('SliderThumb');
	let autoIndex = $derived(indexProp === undefined);
	$effect(() => {
		if (autoIndex) return root.registerThumb(token);
	});
	let index = $derived<0 | 1>(autoIndex ? root.thumbIndex(token) : (indexProp as 0 | 1));

	const isHigh = $derived(index === 1);
	const thumbClass = $derived(isHigh ? 'slider__thumb--high' : 'slider__thumb--low');
	const inputClass = $derived(
		root.isRange ? (isHigh ? 'slider__input--high' : 'slider__input--low') : ''
	);
	const refKey = createAttachmentKey();
	const attrs = $derived({
		type: 'range' as const,
		min: root.min,
		max: root.max,
		step: root.step,
		disabled: root.disabled,
		value: root.valueAt(index),
		'aria-label': ariaLabel ?? root.ariaLabelAt(index),
		'aria-valuetext': root.hasFormat ? root.fmt(root.valueAt(index)) : undefined,
		oninput: (e: Event) => root.handleInput(index, e),
		onchange: () => root.handleChange()
	});
	const merged = $derived(
		mergeProps(rest, attrs, {
			class: ['slider__input', inputClass, className].filter(Boolean).join(' '),
			[refKey]: attachRef<HTMLInputElement>((n) => (ref = n))
		})
	);
</script>

<span class="slider__thumb {thumbClass}" aria-hidden="true"></span>
{#if child}
	{@render child({ props: merged })}
{:else}
	<input {...merged} />
{/if}
