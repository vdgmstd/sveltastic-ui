<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { Color, WithElementRef } from '../../types';
	import type { HTMLAttributes } from 'svelte/elements';
	import type { RatingGroupOrientation } from './context';
	import type { RatingGroupValueText } from './ratingGroupState.svelte';

	export type RatingGroupRootProps = WithElementRef<
		Omit<HTMLAttributes<HTMLDivElement>, 'children'> & {
			/** Current rating. Two-way bindable. */
			value?: number;
			/** Number of items (and the maximum value). */
			max?: number;
			/** Minimum allowed value. */
			min?: number;
			/** Allow half-step ratings (e.g. 3.5). */
			allowHalf?: boolean;
			/** View-only — keyboard + pointer cannot change the value. */
			readonly?: boolean;
			/** Disable the whole control. */
			disabled?: boolean;
			/** Show a live fill preview on hover. */
			hoverPreview?: boolean;
			/** Layout + arrow-key axis. */
			orientation?: RatingGroupOrientation;
			/** Palette color for the filled stars. */
			color?: Color;
			/** Submit a hidden input with this name. */
			name?: string;
			/** Accessible name for the slider. */
			ariaLabel?: string;
			/** Screen-reader value text; defaults to "{value} out of {max}". */
			ariaValueText?: RatingGroupValueText;
			/** Fires whenever the value changes. */
			onValueChange?: (value: number) => void;
			children?: Snippet;
		},
		HTMLDivElement
	>;
</script>

<script lang="ts">
	import { cn } from '../../utils/cn';
	import { attachRef } from '../../utils/ref';
	import { boolAttr } from '../../utils/attrs';
	import { setRatingGroupCtx } from './context';
	import { RatingGroupRootState } from './ratingGroupState.svelte';
	import Item from './RatingGroupItem.svelte';

	let {
		value = $bindable(0),
		max = 5,
		min = 0,
		allowHalf = false,
		readonly = false,
		disabled = false,
		hoverPreview = true,
		orientation = 'horizontal',
		color = 'warning',
		name,
		ariaLabel,
		ariaValueText,
		onValueChange,
		ref = $bindable(null),
		class: className,
		children,
		...rest
	}: RatingGroupRootProps = $props();

	const root = setRatingGroupCtx(
		new RatingGroupRootState({
			getValue: () => value,
			setValueProp: (v) => {
				value = v;
			},
			onValueChange: () => onValueChange,
			get max() {
				return max;
			},
			get min() {
				return min;
			},
			get allowHalf() {
				return allowHalf;
			},
			get readonly() {
				return readonly;
			},
			get disabled() {
				return disabled;
			},
			get hoverPreview() {
				return hoverPreview;
			},
			get orientation() {
				return orientation;
			},
			get color() {
				return color;
			},
			get name() {
				return name;
			},
			get ariaLabel() {
				return ariaLabel;
			},
			get ariaValueText() {
				return ariaValueText;
			}
		})
	);

	function dirOf(el: HTMLElement): 'ltr' | 'rtl' {
		return getComputedStyle(el).direction === 'rtl' ? 'rtl' : 'ltr';
	}

	/** Resolve the rating value under the pointer via event delegation on the slider. */
	function valueFromEvent(e: PointerEvent | MouseEvent): number | null {
		const itemEl = (e.target as HTMLElement | null)?.closest('[data-rating-group-item]') as
			| HTMLElement
			| null
			| undefined;
		if (!itemEl) return null;
		const index = Number(itemEl.getAttribute('data-index'));
		const r = itemEl.getBoundingClientRect();
		const vertical = orientation === 'vertical';
		let ratio = vertical ? (e.clientY - r.top) / r.height : (e.clientX - r.left) / r.width;
		if (!vertical && dirOf(itemEl) === 'rtl') ratio = 1 - ratio;
		const firstHalf = ratio <= 0.5;
		return index + (allowHalf && firstHalf ? 0.5 : 1);
	}
</script>

<div
	role="slider"
	class={cn('rating', orientation === 'vertical' && 'rating--vertical', className)}
	style:--c={root.triplet}
	tabindex={disabled ? -1 : 0}
	aria-valuemin={min}
	aria-valuemax={max}
	aria-valuenow={value}
	aria-valuetext={root.ariaValueText}
	aria-orientation={orientation}
	aria-label={ariaLabel}
	aria-readonly={readonly || undefined}
	aria-disabled={disabled || undefined}
	data-rating-group-root=""
	data-orientation={orientation}
	data-disabled={boolAttr(disabled)}
	data-readonly={boolAttr(readonly)}
	onkeydown={(e) => root.handleKeydown(e, dirOf(e.currentTarget))}
	onpointermove={(e) => {
		const v = valueFromEvent(e);
		if (v !== null) root.setHover(v);
	}}
	onpointerleave={() => root.clearHover()}
	onclick={(e) => {
		const v = valueFromEvent(e);
		if (v !== null) root.setValue(v);
	}}
	{@attach attachRef<HTMLDivElement>((n) => (ref = n))}
	{...rest}
>
	{#if children}
		{@render children()}
	{:else}
		{#each { length: max } as _, i (i)}
			<Item index={i} />
		{/each}
	{/if}
</div>

{#if name}
	<input type="hidden" {name} value={value} />
{/if}

<style>
	.rating {
		display: inline-flex;
		align-items: center;
		gap: var(--space-1);
		color: rgb(var(--c, var(--warn)));
	}
	.rating--vertical {
		flex-direction: column;
	}
	.rating:focus-visible {
		outline: 2px solid rgb(var(--c, var(--warn)));
		outline-offset: 3px;
		border-radius: var(--rad-sm);
	}
</style>
