<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import type { Color, WithElementRef } from '../../types';

	/** Card layout variants:
	 * `'default'` — plain vertical card with hover lift.
	 * `'caption'` — image card with gradient text caption revealed on hover.
	 * `'horizontal'` — image-left row card.
	 * `'compact'` — pill-shaped row card: square avatar / icon-plate, optional badge, text column, and a floating actions row that hangs half outside the bottom edge.
	 * `'frosted'` — full-bleed image with frosted-glass info panel on hover.
	 * `'peek'` — image peeks above a text frame and rises on hover.
	 */
	export type CardVariant = 'default' | 'caption' | 'horizontal' | 'compact' | 'frosted' | 'peek';

	export type CardRootProps = WithElementRef<
		{
			/** Visual variant. */
			variant?: CardVariant;
			/** Palette name or hex / `rgb(...)` / `r,g,b`. Exposes `--c` for descendants (Buttons, Avatars). */
			color?: Color;
			/** Render the image with insets / padding around it instead of edge-to-edge. */
			imgInset?: boolean;
			/** Override the image cell's main dimension. Number is treated as `px`; any CSS length is accepted as a string. */
			imgSize?: number | string;
			/** Class merged onto the inner `.card` surface (the visible, styled element — for a glass/flush/lift treatment or a `max-width` constraint). */
			cardClass?: string;
			/** Inline style merged onto the inner `.card` surface. */
			cardStyle?: string;
			/** Card parts — rendered inside the inner `.card` surface. */
			children?: Snippet;
			/** Render-delegation: receive the merged prop bag and the kit's `card` snippet, then render your own root element (e.g. `<article>` / `<a>`) with `{@render card()}` inside it. */
			child?: Snippet<[{ props: Record<string, unknown>; card: Snippet }]>;
		} & Omit<HTMLAttributes<HTMLDivElement>, 'children' | 'title'>,
		HTMLDivElement
	>;
</script>

<script lang="ts">
	import { createAttachmentKey } from 'svelte/attachments';
	import { rgbTriplet } from '../../utils/color';
	import { cn } from '../../utils/cn';
	import { boolAttr, dataState } from '../../utils/attrs';
	import { attachRef } from '../../utils/ref';
	import { mergeProps } from '../../utils/mergeProps';

	let {
		variant = 'default',
		color = 'primary',
		imgInset = false,
		imgSize,
		cardClass,
		cardStyle,
		children,
		child,
		ref = $bindable(null),
		class: className,
		style: userStyle,
		...rest
	}: CardRootProps = $props();

	let isImgInset = $derived(imgInset || variant === 'compact');

	let triplet = $derived(rgbTriplet(color));
	let imgSizeCss = $derived(
		imgSize === undefined ? undefined : typeof imgSize === 'number' ? `${imgSize}px` : imgSize
	);

	let styleVars = $derived(
		`--c:${triplet};${imgSizeCss === undefined ? '' : `--img-size:${imgSizeCss};`}${userStyle ?? ''}`
	);

	const refKey = createAttachmentKey();

	let rootProps = $derived(
		mergeProps(rest, {
			class: cn(
				'card-content',
				`card-content--${variant}`,
				isImgInset && 'card-content--img-inset',
				className
			),
			'data-testid': 'card',
			'data-variant': dataState(variant),
			'data-img-inset': boolAttr(isImgInset),
			style: styleVars,
			[refKey]: attachRef<HTMLDivElement>((n) => (ref = n))
		})
	);
</script>

{#snippet tree()}
	<div class={cn('card', cardClass)} style={cardStyle}>
		{@render children?.()}
	</div>
{/snippet}

{#if child}
	{@render child({ props: rootProps, card: tree })}
{:else}
	<div {...rootProps}>
		{@render tree()}
	</div>
{/if}

<style>
	:where(:global(.card-content)) {
		--c: var(--primary);
		display: block;
	}

	.card {
		background: rgb(var(--gray-1));
		color: rgb(var(--text));
		width: 100%;
		box-shadow: var(--shadow-2);
		border-radius: var(--rad-xl);
		transition:
			transform var(--dur) var(--ease-standard),
			box-shadow var(--dur) var(--ease-standard),
			border-radius var(--dur) var(--ease-standard);
		cursor: pointer;
		position: relative;
	}

	:global(.card__img) {
		position: relative;
		max-height: var(--img-size, 250px);
		overflow: visible;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: var(--rad-xl);
		transition:
			transform var(--dur) var(--ease-standard),
			border-radius var(--dur) var(--ease-standard);
	}

	:global(.card__img-clip) {
		width: 100%;
		height: 100%;
		max-height: inherit;
		display: flex;
		align-items: center;
		justify-content: center;
		overflow: hidden;
		border-radius: inherit;
	}

	:global(.card__img) :global(img) {
		width: 100%;
		max-height: inherit;
		object-fit: cover;
		border-radius: var(--rad-xl);
		display: block;
	}
	:global(.card__img-clip) > :global(*) {
		transition: transform var(--dur) var(--ease-standard);
	}

	:global(.card__text) {
		font-size: var(--fs-md);
		padding: 0 var(--space-7);
		padding-bottom: var(--space-5);
	}

	:global(.card__text) :global(p) {
		font-size: inherit;
		margin: 0;
		opacity: 0.8;
	}

	:global(.card__title) {
		padding-top: var(--space-5);
		padding-bottom: var(--space-3);
	}

	:global(.card__title) :global(:is(h2, h3, h4, h5, h6)) {
		padding: 0;
		margin: 0;
		font-size: var(--fs-xl);
		font-weight: 600;
		line-height: 1.3;
		text-transform: none;
		letter-spacing: normal;
		opacity: 1;
		color: inherit;
	}

	:global(.card__interactions) {
		position: absolute;
		bottom: 0;
		padding: var(--space-3) var(--space-7);
		display: flex;
		align-items: center;
		justify-content: flex-start;
		left: 0;
	}

	:global(.card__buttons) {
		display: flex;
		align-items: center;
		justify-content: center;
		flex-wrap: wrap;
		gap: var(--space-4);
		padding: 0 var(--space-7) var(--space-7);
	}

	:global(.card__actions) {
		position: absolute;
		left: 0;
		right: 0;
		bottom: 0;
		transform: translateY(50%);
		display: flex;
		align-items: center;
		justify-content: center;
		gap: var(--space-3);
		padding-inline: var(--space-6);
		z-index: 20;
	}

	:global(.card-content--img-inset) .card {
		display: flow-root;
	}
	:global(.card-content--img-inset) :global(.card__img) {
		margin: var(--space-7);
		border-radius: var(--rad-lg);
		overflow: visible;
	}
	:global(.card-content--img-inset) :global(.card__img-clip) {
		border-radius: inherit;
	}
	:global(.card-content--img-inset) :global(.card__img) :global(img) {
		border-radius: inherit;
	}

	:global(.card-content--default) .card:hover,
	:global(.card-content--default) .card:focus-within {
		box-shadow: 0 0 0 0 rgb(0 0 0 / var(--shadow-opacity));
	}
	:global(.card-content--default) .card:hover :global(.card__img-clip) > :global(*),
	:global(.card-content--default) .card:focus-within :global(.card__img-clip) > :global(*) {
		transform: scale(1.15);
	}
	:global(.card-content--default) :global(.card__interactions) {
		bottom: 0;
		transform: translateY(50%);
		z-index: 5;
	}
	:global(.card-content--default) :global(.card__text) {
		padding-top: var(--space-9);
		padding-bottom: var(--space-9);
	}
	:global(.card-content--default) :global(.card__title) {
		padding-top: 0;
	}

	:global(.card-content--caption) .card {
		box-shadow: none;
		background: transparent;
	}
	:global(.card-content--caption) :global(.card__img) {
		transform-origin: bottom center;
	}
	:global(.card-content--caption) .card:hover :global(.card__img),
	:global(.card-content--caption) .card:focus-within :global(.card__img) {
		transform: scale(0.94);
	}
	:global(.card-content--caption) .card:hover :global(.card__img-clip) > :global(*),
	:global(.card-content--caption) .card:focus-within :global(.card__img-clip) > :global(*) {
		transform: scale(1.15);
	}
	:global(.card-content--caption) :global(.card__interactions) {
		inset-inline-end: 0;
		top: 0;
		inset-inline-start: auto;
		bottom: auto;
		align-items: flex-end;
	}
	:global(.card-content--caption) :global(.card__text) {
		position: absolute;
		left: 0;
		right: 0;
		bottom: 0;
		z-index: 5;
		display: grid;
		grid-template-rows: 0fr;
		padding: var(--space-6) var(--space-9) var(--space-9);
		border-radius: 0 0 var(--rad-xl) var(--rad-xl);
		color: rgb(255 255 255);
		font-size: var(--fs-md);
		clip-path: inset(-200px 0 0 0 round 0 0 var(--rad-xl) var(--rad-xl));
		transition:
			grid-template-rows 260ms var(--ease-standard),
			padding 260ms var(--ease-standard);
	}
	:global(.card-content--caption) .card:hover :global(.card__text),
	:global(.card-content--caption) .card:focus-within :global(.card__text) {
		grid-template-rows: 1fr;
	}
	:global(.card-content--caption) :global(.card__text)::before {
		content: '';
		position: absolute;
		inset: 0;
		background: linear-gradient(
			180deg,
			rgb(0 0 0 / 0) 0%,
			rgb(0 0 0 / 0.55) 55%,
			rgb(0 0 0 / 0.8) 100%
		);
		border-radius: inherit;
		opacity: 0;
		transform: scale(1);
		transform-origin: bottom center;
		transition:
			opacity 260ms var(--ease-standard),
			transform 260ms var(--ease-standard);
		z-index: -1;
	}
	:global(.card-content--caption) .card:hover :global(.card__text)::before,
	:global(.card-content--caption) .card:focus-within :global(.card__text)::before {
		opacity: 1;
		transform: scale(0.95);
	}
	:global(.card-content--caption) :global(.card__title) {
		position: absolute;
		top: 0;
		inset-inline-start: 16px;
		transform: translateY(-50%);
		z-index: 20;
		padding: 0;
		font-weight: 700;
	}
	:global(.card-content--caption) :global(.card__text) > :global(p) {
		min-height: 0;
		overflow: hidden;
		opacity: 0;
		transform: translateY(8px);
		transition:
			opacity 240ms var(--ease-standard),
			transform 260ms var(--ease-standard);
	}
	:global(.card-content--caption) .card:hover :global(.card__text) > :global(p),
	:global(.card-content--caption) .card:focus-within :global(.card__text) > :global(p) {
		opacity: 1;
		transform: translateY(0);
		transition:
			opacity 240ms var(--ease-standard) 60ms,
			transform 260ms var(--ease-standard) 60ms;
	}
	:global(.card-content--caption) :global(.card__actions) {
		opacity: 0;
		transform: translateY(calc(50% + 10px));
		pointer-events: none;
		transition:
			opacity 240ms var(--ease-standard),
			transform 280ms var(--ease-standard);
	}
	:global(.card-content--caption) .card:hover :global(.card__actions),
	:global(.card-content--caption) .card:focus-within :global(.card__actions) {
		opacity: 1;
		transform: translateY(50%);
		pointer-events: auto;
		transition:
			opacity 240ms var(--ease-standard) 100ms,
			transform 280ms var(--ease-standard) 100ms;
	}

	:global(.card-content--horizontal) .card {
		display: grid;
		grid-template-columns: var(--img-size, 180px) 1fr;
		grid-template-rows: 1fr auto;
	}
	:global(.card-content--horizontal) .card:hover,
	:global(.card-content--horizontal) .card:focus-within {
		box-shadow: 0 12px 28px 0 rgb(0 0 0 / calc(var(--shadow-opacity) * 1.5));
	}
	:global(.card-content--horizontal) .card:hover :global(.card__img-clip) > :global(*),
	:global(.card-content--horizontal) .card:focus-within :global(.card__img-clip) > :global(*) {
		transform: scale(1.08);
	}
	:global(.card-content--horizontal) :global(.card__img) {
		grid-column: 1;
		grid-row: 1 / -1;
		max-height: none;
		width: 100%;
		height: 100%;
	}
	:global(.card-content--horizontal) :global(.card__img) :global(img) {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}
	:global(.card-content--horizontal) :global(.card__text) {
		grid-column: 2;
		grid-row: 1;
		min-width: 0;
		padding: var(--space-8) var(--space-7) var(--space-4);
	}
	:global(.card-content--horizontal) :global(.card__title) :global(:is(h2, h3, h4, h5, h6)) {
		padding: 0;
		font-size: var(--fs-lg);
	}
	:global(.card-content--horizontal) :global(.card__buttons) {
		grid-column: 2;
		grid-row: 2;
		justify-content: flex-end;
		padding: 0 var(--space-7) var(--space-7);
	}

	:global(.card-content--frosted) .card {
		box-shadow: none;
		overflow: hidden;
	}
	:global(.card-content--frosted) .card:hover :global(.card__img-clip) > :global(*),
	:global(.card-content--frosted) .card:focus-within :global(.card__img-clip) > :global(*) {
		transform: scale(1);
	}
	:global(.card-content--frosted) :global(.card__actions) {
		left: 16px;
		right: 16px;
		bottom: 32px;
		opacity: 0;
		transform: translateY(calc(50% + 10px));
		pointer-events: none;
		transition:
			opacity 240ms var(--ease-standard),
			transform 280ms var(--ease-standard);
	}
	:global(.card-content--frosted) .card:hover :global(.card__actions),
	:global(.card-content--frosted) .card:focus-within :global(.card__actions) {
		opacity: 1;
		transform: translateY(50%);
		pointer-events: auto;
		transition:
			opacity 240ms var(--ease-standard) 100ms,
			transform 280ms var(--ease-standard) 100ms;
	}
	:global(.card-content--frosted) :global(.card__img) {
		align-items: center;
		max-height: var(--img-size, 600px);
	}
	:global(.card-content--frosted) :global(.card__img-clip) > :global(*) {
		transform: scale(1.2);
	}
	:global(.card-content--frosted) :global(.card__interactions) {
		top: 0;
		bottom: auto;
	}
	:global(.card-content--frosted) :global(.card__text) {
		position: absolute;
		left: 16px;
		right: 16px;
		bottom: 0;
		z-index: 5;
		display: grid;
		grid-template-rows: 0fr;
		padding: var(--space-6) var(--space-9) var(--space-9);
		border-radius: var(--rad-xl);
		transition:
			grid-template-rows 260ms var(--ease-standard),
			padding 260ms var(--ease-standard),
			bottom 260ms var(--ease-standard);
	}
	:global(.card-content--frosted) .card:hover :global(.card__text),
	:global(.card-content--frosted) .card:focus-within :global(.card__text) {
		grid-template-rows: 1fr;
		bottom: 32px;
		padding: var(--space-9) var(--space-7) var(--space-7);
	}
	:global(.card-content--frosted) :global(.card__text)::before {
		content: '';
		position: absolute;
		inset: 0;
		background: rgb(var(--gray-1) / 0.6);
		-webkit-backdrop-filter: var(--frost);
		backdrop-filter: var(--frost);
		border-radius: inherit;
		opacity: 0;
		transform: translateY(100%);
		transition:
			opacity 260ms var(--ease-standard),
			transform 260ms var(--ease-standard);
		z-index: -1;
	}
	:global(.card-content--frosted) .card:hover :global(.card__text)::before,
	:global(.card-content--frosted) .card:focus-within :global(.card__text)::before {
		opacity: 1;
		transform: translateY(0);
	}
	:global(.card-content--frosted) :global(.card__text) :global(p) {
		opacity: 1;
	}
	:global(.card-content--frosted) :global(.card__title) {
		position: absolute;
		top: 0;
		left: 0;
		transform: translateY(-50%);
		z-index: 20;
		padding: var(--space-2) var(--space-5);
		font-weight: 700;
		background: rgb(var(--gray-1) / 0.7);
		-webkit-backdrop-filter: var(--frost);
		backdrop-filter: var(--frost);
		border-radius: var(--rad-pill);
	}
	:global(.card-content--frosted) :global(.card__text) > :global(:not(.card__title)) {
		min-height: 0;
		overflow: hidden;
		opacity: 0;
		transform: translateY(8px);
		transition:
			opacity 240ms var(--ease-standard),
			transform 260ms var(--ease-standard);
	}
	:global(.card-content--frosted) .card:hover :global(.card__text) > :global(:not(.card__title)),
	:global(.card-content--frosted) .card:focus-within :global(.card__text) > :global(:not(.card__title)) {
		opacity: 1;
		transform: translateY(0);
		transition:
			opacity 240ms var(--ease-standard) 60ms,
			transform 260ms var(--ease-standard) 60ms;
	}

	/* Block, not flex: in a flex column Firefox ignores the panel's negative margin-top (the overlap collapses), and flex `justify-content` + the panel margin land the frame differently per engine. Plain block honours `margin-top: -50px` identically in Chrome + Firefox. */
	:global(.card-content--peek) .card {
		box-shadow: none;
		background: transparent;
		display: block;
	}
	:global(.card-content--peek) :global(.card__img-clip) {
		transform: translateY(40px);
		transition: transform var(--dur) var(--ease-standard);
	}
	:global(.card-content--peek) .card:hover :global(.card__img-clip),
	:global(.card-content--peek) .card:focus-within :global(.card__img-clip) {
		transform: translateY(0);
	}
	:global(.card-content--peek) :global(.card__actions) {
		left: 15px;
		right: 15px;
		opacity: 0;
		pointer-events: none;
		transition: opacity var(--dur) var(--ease-standard);
	}
	:global(.card-content--peek) .card:hover :global(.card__actions),
	:global(.card-content--peek) .card:focus-within :global(.card__actions) {
		opacity: 1;
		pointer-events: auto;
	}
	:global(.card-content--peek) .card:hover :global(.card__text),
	:global(.card-content--peek) .card:focus-within :global(.card__text) {
		transform: translate(0, 0);
		opacity: 1;
		box-shadow: 0 0 30px 0 rgb(0 0 0 / var(--shadow-opacity));
	}
	:global(.card-content--peek) .card:hover :global(.card__img),
	:global(.card-content--peek) .card:focus-within :global(.card__img) {
		border-radius: 6px 40px 6px 40px;
	}
	:global(.card-content--peek) .card:hover :global(.card__img-clip) > :global(*),
	:global(.card-content--peek) .card:focus-within :global(.card__img-clip) > :global(*) {
		transform: scale(1.1);
	}
	:global(.card-content--peek) :global(.card__img) {
		border-radius: 6px 20px 6px 20px;
	}
	/* Reactions are ALWAYS visible and just shift up on hover (the design). Move via `bottom`, never `transform`/`opacity`: those composite the overlay, and the continuously-floating mosaic neighbours make Firefox cull the composited layer — the bubble SVG vanishes. Plain `bottom` keeps the icon painted and animates the shift cleanly. */
	:global(.card-content--peek) :global(.card__interactions) {
		bottom: -5px;
		inset-inline-start: 8px;
		z-index: 15;
		transition: bottom var(--dur) var(--ease-standard);
	}
	:global(.card-content--peek) .card:hover :global(.card__interactions),
	:global(.card-content--peek) .card:focus-within :global(.card__interactions) {
		bottom: 20px;
	}
	:global(.card-content--peek) :global(.card__text) {
		background: rgb(var(--background));
		box-shadow: 0 0 0 0 rgb(0 0 0 / var(--shadow-opacity));
		border-radius: 6px 20px 6px 20px;
		/* Overlap via `top` (position:relative) — Firefox doesn't honour a negative margin-top here, but `top` rides identically in both engines. `margin-inline: auto` centres the narrower panel. */
		top: -50px;
		margin-inline: auto;
		z-index: 10;
		position: relative;
		width: calc(100% - 30px);
		padding-top: var(--space-9);
		padding-bottom: var(--space-9);
		padding-inline: var(--space-8);
		transition:
			transform var(--dur) var(--ease-standard),
			opacity var(--dur) var(--ease-standard),
			box-shadow var(--dur) var(--ease-standard);
		transform: translate(0, 25px);
		opacity: 0;
	}

	:global(.card-content--compact) .card {
		width: 400px;
		max-width: 100%;
		min-height: calc(var(--img-size, 100px) + 46px);
		display: flex;
		align-items: center;
		padding: var(--space-9) var(--space-9);
		border-radius: 35px;
		box-shadow: 0 15px 30px -8px rgb(0 0 0 / 0.08);
		overflow: visible;
		cursor: default;
		transition: none;
	}
	:global(.card-content--compact) .card:hover {
		transform: none;
		box-shadow: 0 15px 30px -8px rgb(0 0 0 / 0.08);
	}
	:global(.card-content--compact) :global(.card__img) {
		position: relative;
		width: var(--img-size, 100px);
		height: var(--img-size, 100px);
		flex: 0 0 var(--img-size, 100px);
		max-height: none;
		margin: 0;
		border-radius: 30%;
		overflow: visible;
		filter: drop-shadow(0 14px 16px rgb(0 0 0 / 0.18));
	}
	:global(.card-content--compact) :global(.card__img-clip) {
		border-radius: inherit;
	}
	:global(.card-content--compact) :global(.card__img) :global(img) {
		width: 100%;
		height: 100%;
		border-radius: inherit;
		object-fit: cover;
	}
	:global(.card-content--compact) :global(.card__img-clip) > :global(*) {
		transition: transform 350ms var(--ease-standard);
	}
	:global(.card-content--compact) .card:hover :global(.card__img-clip) > :global(*),
	:global(.card-content--compact) .card:focus-within :global(.card__img-clip) > :global(*) {
		transform: scale(1.12);
	}
	:global(.card-content--compact) :global(.card__interactions) {
		top: calc(24px + var(--img-size, 100px) * 0.52);
		inset-inline-start: calc(24px + var(--img-size, 100px) * 0.62);
		bottom: auto;
		width: 20px;
		height: 20px;
		padding: 0;
		background: rgb(var(--danger));
		color: rgb(255 255 255);
		border-radius: var(--rad-circle);
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: var(--fs-xs);
		font-weight: 700;
		box-shadow: 0 4px 10px 0 rgb(var(--danger) / 0.6);
		-webkit-user-select: none;
		user-select: none;
	}
	:global(.card-content--compact) :global(.card__text) {
		flex: 1 1 auto;
		min-width: 0;
		padding: 0 var(--space-8) 0 var(--space-9);
	}
	:global(.card-content--compact) :global(.card__title) {
		padding: 0 0 var(--space-3);
	}
	:global(.card-content--compact) :global(.card__title) :global(:is(h2, h3, h4, h5, h6)) {
		font-size: var(--fs-lg);
		line-height: 1.25;
	}
	:global(.card-content--compact) :global(.card__text) :global(p) {
		font-size: var(--fs-sm);
		line-height: 1.7;
		opacity: 0.6;
	}
	:global(.card-content--compact) :global(.card__actions) {
		inset-inline-start: calc(var(--img-size, 100px) + 10px);
		inset-inline-end: 10px;
		gap: 0;
	}

	:global(.card-content--default) .card:not(:has(:global(.card__interactions))) :global(.card__text) {
		padding-top: var(--space-5);
	}
	:global(.card-content--default) .card:not(:has(:global(.card__actions))) :global(.card__text) {
		padding-bottom: var(--space-5);
	}

	:global(.card-content--caption) .card:has(:global(.card__title)):hover :global(.card__text),
	:global(.card-content--caption) .card:has(:global(.card__title)):focus-within :global(.card__text) {
		padding-top: var(--space-9);
	}
	:global(.card-content--caption) .card:has(:global(.card__actions)):hover :global(.card__text),
	:global(.card-content--caption) .card:has(:global(.card__actions)):focus-within :global(.card__text) {
		padding-bottom: var(--space-9);
	}

	:global(.card-content--frosted) .card:has(:global(.card__actions)):hover :global(.card__text),
	:global(.card-content--frosted) .card:has(:global(.card__actions)):focus-within :global(.card__text) {
		padding-bottom: var(--space-9);
	}
	:global(.card-content--frosted) .card:not(:has(:global(.card__title))):hover :global(.card__text),
	:global(.card-content--frosted) .card:not(:has(:global(.card__title))):focus-within :global(.card__text) {
		padding-top: var(--space-6);
	}

	:global(.card-content--peek) .card:not(:has(:global(.card__interactions))) :global(.card__text) {
		padding-top: var(--space-7);
	}
	:global(.card-content--peek) .card:not(:has(:global(.card__actions))) :global(.card__text) {
		padding-bottom: var(--space-7);
	}

	:global(.card-content--compact) .card:not(:has(:global(.card__actions))) {
		min-height: 0;
	}
</style>
