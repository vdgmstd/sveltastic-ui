<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import type { Color, WithElementRef } from '../../types';
	import type { ProgressShape } from './progress.svelte';

	export type { ProgressShape };

	export type ProgressRootProps = WithElementRef<
		{
			/** Current value, clamped to `[min, max]`. `null` ⇒ indeterminate (bar slides, ring spins). */
			value?: number | null;
			/** Lower bound for `value`. */
			min?: number;
			/** Upper bound for `value`. */
			max?: number;
			/** `linear` (bar) or `circular` (ring). */
			shape?: ProgressShape;
			/** Bar height (linear) or stroke width (circular), in px. */
			thickness?: number;
			/** Diameter in px (circular only). */
			size?: number;
			/** Palette accent driving fill and track. */
			color?: Color;
			/** Spoken text overriding the computed percentage. */
			ariaValueText?: string;
			/** ARIA label for assistive tech when no visible label is supplied. */
			ariaLabel?: string;
			/** Default content — place `Progress.Track`, `Progress.Indicator`, `Progress.Label`. */
			children?: Snippet;
			/** Render-delegation: receive the merged props and render your own root element. */
			child?: Snippet<[{ props: Record<string, unknown> }]>;
		} & Omit<HTMLAttributes<HTMLDivElement>, 'children' | 'color'>,
		HTMLDivElement
	>;
</script>

<script lang="ts">
	import { createAttachmentKey } from 'svelte/attachments';
	import { cn } from '../../utils/cn';
	import { attachRef } from '../../utils/ref';
	import { boolAttr, dataState } from '../../utils/attrs';
	import { mergeProps } from '../../utils/mergeProps';
	import { setProgressCtx } from './context';
	import { ProgressRootState } from './progress.svelte';
	import Track from './ProgressTrack.svelte';
	import Indicator from './ProgressIndicator.svelte';

	let {
		value = 0,
		min = 0,
		max = 100,
		shape = 'linear',
		thickness = 8,
		size = 64,
		color = 'primary',
		ariaValueText,
		ariaLabel,
		children,
		child,
		ref = $bindable(null),
		id: idProp,
		class: className,
		style: userStyle,
		...rest
	}: ProgressRootProps = $props();

	const uid = $props.id();
	let id = $derived(idProp ?? uid);

	const root = setProgressCtx(
		new ProgressRootState({
			getValue: () => value,
			getMin: () => min,
			getMax: () => max,
			getShape: () => shape,
			getThickness: () => thickness,
			getSize: () => size,
			getColor: () => color,
			getId: () => id
		})
	);

	$effect(() => root.sync());

	let sizeStyle = $derived(
		shape === 'circular' ? `width:${size}px;height:${size}px;` : `--h:${thickness}px;`
	);

	const refKey = createAttachmentKey();
	const merged = $derived(
		mergeProps(rest, {
			class: cn('progress', `progress--${shape}`, className),
			style: `--c:${root.triplet};${sizeStyle}` + (userStyle ?? ''),
			role: 'progressbar' as const,
			'aria-label': root.hasLabel ? undefined : ariaLabel,
			'aria-valuemin': min,
			'aria-valuemax': max,
			'aria-valuenow': root.isIndeterminate ? undefined : root.clamped,
			'aria-valuetext': ariaValueText,
			'aria-busy': root.isIndeterminate ? ('true' as const) : undefined,
			'data-state': dataState(root.state),
			'data-value': root.isIndeterminate ? undefined : root.clamped,
			'data-min': min,
			'data-max': max,
			'data-indeterminate': boolAttr(root.isIndeterminate),
			'data-shape': shape,
			'data-testid': 'progress',
			[refKey]: attachRef<HTMLDivElement>((n) => (ref = n))
		})
	);
</script>

{#snippet defaults()}
	{#if shape === 'circular'}
		<Track />
		<Indicator />
	{:else}
		<Track><Indicator /></Track>
	{/if}
{/snippet}

{#if child}
	{@render child({ props: merged })}
{:else}
	<div {...merged}>{#if children}{@render children()}{:else}{@render defaults()}{/if}</div>
{/if}

<style>
	:where(.progress) {
		--c: var(--primary);
		color: rgb(var(--c));
	}

	:where(.progress--linear) {
		position: relative;
		width: 100%;
		height: var(--h);
	}

	:where(.progress--circular) {
		position: relative;
		display: inline-flex;
		align-items: center;
		justify-content: center;
	}
</style>
