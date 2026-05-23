<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import type { Color } from '../../types';

	/** Card layout variants:
	 * `'default'` — plain vertical card with hover lift.
	 * `'caption'` — image card with gradient text caption revealed on hover.
	 * `'horizontal'` — image-left row card.
	 * `'compact'` — pill-shaped row card: square avatar / icon-plate (`img`), optional badge (`interactions`), text column, and a floating `actions` row that hangs half outside the bottom edge.
	 * `'frosted'` — full-bleed image with frosted-glass info panel on hover.
	 * `'peek'` — image peeks above a text frame and rises on hover.
	 */
	export type CardVariant = 'default' | 'caption' | 'horizontal' | 'compact' | 'frosted' | 'peek';

	export type CardProps = {
		/** Visual variant. */
		variant?: CardVariant;
		/** Palette name (`'primary' | 'success' | 'danger' | 'warning' | 'dark' | 'light' | social`) or hex / `rgb(...)` / `r,g,b`. Exposes `--c` for descendants (Buttons, Avatars). */
		color?: Color;
		/** Reserved for future visual states. Has no effect today. */
		active?: boolean;
		/** Wider max-width (`480px` instead of the default `350px`). */
		wide?: boolean;
		/** Render the image with insets / padding around it instead of
		 * edge-to-edge. Gives the image its own rounded frame and a soft
		 * margin from the card edges — the visual idiom the `compact`
		 * variant is built on. */
		imgInset?: boolean;
		/** Override the image cell's main dimension. Variant-dependent: `compact` uses it as the square edge, `horizontal` as the left column width, vertical variants (`default`, `caption`, `frosted`, `peek`) as the image area's max-height. Number is treated as `px`; any CSS length is accepted as a string. */
		imgSize?: number | string;
		/** Image slot — rendered inside `.card__img`. */
		img?: Snippet;
		/** Title slot — rendered inside `.card__title` (nested inside `.card__text`). */
		title?: Snippet;
		/** Body slot — rendered inside `.card__text` below the title. */
		body?: Snippet;
		/** Button strip — rendered inside `.card__buttons` (in normal flow, below the body). */
		buttons?: Snippet;
		/** Floating action strip — rendered inside `.card__actions`, absolutely centered, pinned to the card's bottom edge and translated by `50%` of its own height so the row hangs exactly half outside the card regardless of the action content's actual height. Use for hero / compact-style cards. */
		actions?: Snippet;
		/** Floating overlay over the image — rendered inside `.card__interactions`. */
		interactions?: Snippet;
		/** Free-form children. Appended after the named snippets when any are set; replaces them when none are. */
		children?: Snippet;
	} & Omit<HTMLAttributes<HTMLDivElement>, 'children' | 'title'>;
</script>

<script lang="ts">
	import { rgbTriplet } from '../../utils/color';
	import { cn } from '../../utils/cn';

	let {
		variant = 'default',
		color = 'primary',
		active = false,
		wide = false,
		imgInset = false,
		imgSize,
		img,
		title,
		body,
		buttons,
		actions,
		interactions,
		children,
		class: className,
		style: userStyle,
		...rest
	}: CardProps = $props();

	let isImgInset = $derived(imgInset || variant === 'compact');

	let triplet = $derived(rgbTriplet(color));
	let imgSizeCss = $derived(
		imgSize === undefined ? undefined : typeof imgSize === 'number' ? `${imgSize}px` : imgSize
	);
	let hasNamed = $derived(!!img || !!title || !!body || !!buttons || !!actions || !!interactions);
</script>

<div
	class={cn(
		'card-content',
		`card-content--${variant}`,
		active && 'card-content--active',
		wide && 'card-content--wide',
		isImgInset && 'card-content--img-inset',
		className
	)}
	style:--c={triplet}
	style:--img-size={imgSizeCss}
	style={userStyle}
	data-testid="card"
	{...rest}
>
	<div class="card">
		{#if img}
			<div class="card__img">
				<div class="card__img-clip">
					{@render img()}
				</div>
				{#if interactions}
					<div class="card__interactions">
						{@render interactions()}
					</div>
				{/if}
			</div>
		{/if}

		{#if body}
			<div class="card__text">
				{#if title}
					<div class="card__title">
						{@render title()}
					</div>
				{/if}
				{@render body()}
			</div>
		{/if}

		{#if buttons}
			<div class="card__buttons">
				{@render buttons()}
			</div>
		{/if}

		{#if actions}
			<div class="card__actions px-3 items-center">
				{@render actions()}
			</div>
		{/if}

		{#if children}
			{#if !hasNamed}
				{@render children()}
			{:else}
				<div class="card__children">
					{@render children()}
				</div>
			{/if}
		{/if}
	</div>
</div>

<style>
	:where(.card-content) {
		--c: var(--primary);
		display: block;
	}

	.card {
		background: rgb(var(--gray-1));
		color: rgb(var(--text));
		width: 100%;
		max-width: 350px;
		margin: 0 auto;
		box-shadow: 0 5px 20px 0 rgb(0 0 0 / var(--shadow-opacity));
		border-radius: 20px;
		transition:
			transform 250ms cubic-bezier(0.4, 0, 0.2, 1),
			box-shadow 250ms cubic-bezier(0.4, 0, 0.2, 1),
			border-radius 250ms cubic-bezier(0.4, 0, 0.2, 1);
		cursor: pointer;
		position: relative;
	}

	.card__img {
		position: relative;
		max-height: var(--img-size, 250px);
		overflow: visible;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 20px;
		transition:
			transform 250ms cubic-bezier(0.4, 0, 0.2, 1),
			border-radius 250ms cubic-bezier(0.4, 0, 0.2, 1);
	}

	.card__img-clip {
		width: 100%;
		height: 100%;
		max-height: inherit;
		display: flex;
		align-items: center;
		justify-content: center;
		overflow: hidden;
		border-radius: inherit;
	}

	.card__img :global(img) {
		width: 100%;
		max-height: inherit;
		object-fit: cover;
		border-radius: 20px;
		display: block;
	}
	.card__img-clip > :global(*) {
		transition: transform 250ms cubic-bezier(0.4, 0, 0.2, 1);
	}

	.card__text {
		font-size: 0.85rem;
		padding: 0 15px;
		padding-bottom: 10px;
	}

	.card__text :global(p) {
		font-size: inherit;
		margin: 0;
		opacity: 0.8;
	}

	.card__title {
		padding-top: 10px;
		padding-bottom: 5px;
	}

	.card__title :global(:is(h2, h3, h4, h5, h6)) {
		padding: 0;
		margin: 0;
		font-size: 1.1rem;
		font-weight: 600;
		line-height: 1.3;
		text-transform: none;
		letter-spacing: normal;
		opacity: 1;
		color: inherit;
	}

	.card__interactions {
		position: absolute;
		bottom: 0;
		padding: 5px 16px;
		display: flex;
		align-items: center;
		justify-content: flex-start;
		left: 0;
	}

	.card__buttons {
		display: flex;
		align-items: center;
		justify-content: center;
		flex-wrap: wrap;
		gap: 8px;
		padding: 0 14px 14px;
	}

	.card__actions {
		position: absolute;
		left: 0;
		right: 0;
		bottom: 0;
		transform: translateY(50%);
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 4px;
		z-index: 20;
	}

	.card__children {
		display: contents;
	}

	.card-content--wide .card {
		max-width: 480px;
	}

	.card-content--img-inset .card {
		display: flow-root;
	}
	.card-content--img-inset .card__img {
		margin: 16px;
		border-radius: 16px;
		overflow: visible;
	}
	.card-content--img-inset .card__img-clip {
		border-radius: inherit;
	}
	.card-content--img-inset .card__img :global(img) {
		border-radius: inherit;
	}

	.card-content--default .card:hover {
		box-shadow: 0 0 0 0 rgb(0 0 0 / var(--shadow-opacity));
		transform: translate(0, 5px);
	}
	.card-content--default .card:hover .card__img-clip > :global(*) {
		transform: scale(1.15);
	}
	.card-content--default .card__interactions {
		bottom: 0;
		transform: translateY(50%);
		z-index: 5;
	}
	.card-content--default .card__text {
		padding-top: 24px;
		padding-bottom: 30px;
	}
	.card-content--default .card__title {
		padding-top: 0;
	}

	.card-content--caption .card {
		box-shadow: none;
		background: transparent;
	}
	.card-content--caption .card__img {
		transform-origin: bottom center;
	}
	.card-content--caption .card:hover .card__img {
		transform: scale(0.94);
	}
	.card-content--caption .card:hover .card__img-clip > :global(*) {
		transform: scale(1.15);
	}
	.card-content--caption .card__interactions {
		right: 0;
		top: 0;
		left: auto;
		bottom: auto;
		align-items: flex-end;
	}
	.card-content--caption .card__text {
		position: absolute;
		left: 0;
		right: 0;
		bottom: 0;
		z-index: 5;
		display: grid;
		grid-template-rows: 0fr;
		padding: 12px 24px 24px;
		border-radius: 0 0 20px 20px;
		color: rgb(255 255 255);
		font-size: 0.9rem;
		clip-path: inset(-200px 0 0 0 round 0 0 20px 20px);
		transition:
			grid-template-rows 260ms cubic-bezier(0.4, 0, 0.2, 1),
			padding 260ms cubic-bezier(0.4, 0, 0.2, 1);
	}
	.card-content--caption .card:hover .card__text {
		grid-template-rows: 1fr;
	}
	.card-content--caption .card__text::before {
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
			opacity 260ms cubic-bezier(0.4, 0, 0.2, 1),
			transform 260ms cubic-bezier(0.4, 0, 0.2, 1);
		z-index: -1;
	}
	.card-content--caption .card:hover .card__text::before {
		opacity: 1;
		transform: scale(0.95);
	}
	.card-content--caption .card__title {
		position: absolute;
		top: 0;
		left: 16px;
		transform: translateY(-50%);
		z-index: 20;
		padding: 0;
		font-weight: 700;
	}
	.card-content--caption .card__text > :global(p) {
		min-height: 0;
		overflow: hidden;
		opacity: 0;
		transform: translateY(8px);
		transition:
			opacity 240ms cubic-bezier(0.4, 0, 0.2, 1),
			transform 260ms cubic-bezier(0.4, 0, 0.2, 1);
	}
	.card-content--caption .card:hover .card__text > :global(p) {
		opacity: 1;
		transform: translateY(0);
		transition:
			opacity 240ms cubic-bezier(0.4, 0, 0.2, 1) 60ms,
			transform 260ms cubic-bezier(0.4, 0, 0.2, 1) 60ms;
	}
	.card-content--caption .card__actions {
		opacity: 0;
		transform: translateY(50%) translateY(10px);
		pointer-events: none;
		transition:
			opacity 240ms cubic-bezier(0.4, 0, 0.2, 1),
			transform 280ms cubic-bezier(0.4, 0, 0.2, 1);
	}
	.card-content--caption .card:hover .card__actions {
		opacity: 1;
		transform: translateY(50%) translateY(0);
		pointer-events: auto;
		transition:
			opacity 240ms cubic-bezier(0.4, 0, 0.2, 1) 100ms,
			transform 280ms cubic-bezier(0.4, 0, 0.2, 1) 100ms;
	}

	.card-content--horizontal .card {
		display: grid;
		grid-template-columns: var(--img-size, 180px) 1fr;
		grid-template-rows: 1fr auto;
		max-width: 460px;
	}
	.card-content--horizontal .card:hover {
		transform: translateY(-3px);
		box-shadow: 0 12px 28px 0 rgb(0 0 0 / calc(var(--shadow-opacity) * 1.5));
	}
	.card-content--horizontal .card:hover .card__img-clip > :global(*) {
		transform: scale(1.08);
	}
	.card-content--horizontal .card__img {
		grid-column: 1;
		grid-row: 1 / -1;
		max-height: none;
		width: 100%;
		height: 100%;
	}
	.card-content--horizontal .card__img :global(img) {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}
	.card-content--horizontal .card__text {
		grid-column: 2;
		grid-row: 1;
		min-width: 0;
		padding: 18px 20px 8px;
	}
	.card-content--horizontal .card__title :global(:is(h2, h3, h4, h5, h6)) {
		padding: 0;
		font-size: 1rem;
	}
	.card-content--horizontal .card__buttons {
		grid-column: 2;
		grid-row: 2;
		justify-content: flex-end;
		padding: 0 16px 16px;
	}

	.card-content--frosted .card {
		box-shadow: none;
		max-width: 300px;
		overflow: hidden;
	}
	.card-content--frosted .card:hover {
		transform: translate(0, -5px);
	}
	.card-content--frosted .card:hover .card__img-clip > :global(*) {
		transform: scale(1);
	}
	.card-content--frosted .card__actions {
		left: 16px;
		right: 16px;
		bottom: 32px;
		opacity: 0;
		transform: translateY(50%) translateY(10px);
		pointer-events: none;
		transition:
			opacity 240ms cubic-bezier(0.4, 0, 0.2, 1),
			transform 280ms cubic-bezier(0.4, 0, 0.2, 1);
	}
	.card-content--frosted .card:hover .card__actions {
		opacity: 1;
		transform: translateY(50%) translateY(0);
		pointer-events: auto;
		transition:
			opacity 240ms cubic-bezier(0.4, 0, 0.2, 1) 100ms,
			transform 280ms cubic-bezier(0.4, 0, 0.2, 1) 100ms;
	}
	.card-content--frosted .card__img {
		align-items: center;
		max-height: var(--img-size, 600px);
	}
	.card-content--frosted .card__img-clip > :global(*) {
		transform: scale(1.2);
	}
	.card-content--frosted .card__interactions {
		top: 0;
		bottom: auto;
	}
	.card-content--frosted .card__text {
		position: absolute;
		left: 16px;
		right: 16px;
		bottom: 0;
		z-index: 5;
		display: grid;
		grid-template-rows: 0fr;
		padding: 12px 24px 24px;
		border-radius: 20px;
		transition:
			grid-template-rows 260ms cubic-bezier(0.4, 0, 0.2, 1),
			padding 260ms cubic-bezier(0.4, 0, 0.2, 1),
			bottom 260ms cubic-bezier(0.4, 0, 0.2, 1);
	}
	.card-content--frosted .card:hover .card__text {
		grid-template-rows: 1fr;
		bottom: 32px;
		padding: 28px 16px 16px;
	}
	.card-content--frosted .card__text::before {
		content: '';
		position: absolute;
		inset: 0;
		background: rgb(var(--gray-1) / 0.6);
		backdrop-filter: saturate(180%) blur(20px);
		-webkit-backdrop-filter: saturate(180%) blur(20px);
		border-radius: inherit;
		opacity: 0;
		transform: translateY(100%);
		transition:
			opacity 260ms cubic-bezier(0.4, 0, 0.2, 1),
			transform 260ms cubic-bezier(0.4, 0, 0.2, 1);
		z-index: -1;
	}
	.card-content--frosted .card:hover .card__text::before {
		opacity: 1;
		transform: translateY(0);
	}
	.card-content--frosted .card__text :global(p) {
		opacity: 1;
	}
	.card-content--frosted .card__title {
		position: absolute;
		top: 0;
		left: 0;
		transform: translateY(-50%);
		z-index: 20;
		padding: 0;
		font-weight: 700;
	}
	.card-content--frosted .card__text > :global(:not(.card__title)) {
		min-height: 0;
		overflow: hidden;
		opacity: 0;
		transform: translateY(8px);
		transition:
			opacity 240ms cubic-bezier(0.4, 0, 0.2, 1),
			transform 260ms cubic-bezier(0.4, 0, 0.2, 1);
	}
	.card-content--frosted .card:hover .card__text > :global(:not(.card__title)) {
		opacity: 1;
		transform: translateY(0);
		transition:
			opacity 240ms cubic-bezier(0.4, 0, 0.2, 1) 60ms,
			transform 260ms cubic-bezier(0.4, 0, 0.2, 1) 60ms;
	}

	.card-content--peek .card {
		box-shadow: none;
		background: transparent;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-direction: column;
	}
	.card-content--peek .card__img {
		align-self: stretch;
	}
	.card-content--peek .card__img-clip {
		transform: translateY(40px);
		transition: transform 250ms cubic-bezier(0.4, 0, 0.2, 1);
	}
	.card-content--peek .card:hover .card__img-clip {
		transform: translateY(0);
	}
	.card-content--peek .card__actions {
		left: 15px;
		right: 15px;
		opacity: 0;
		pointer-events: none;
		transition: opacity 250ms cubic-bezier(0.4, 0, 0.2, 1);
	}
	.card-content--peek .card:hover .card__actions {
		opacity: 1;
		pointer-events: auto;
	}
	.card-content--peek .card:hover .card__text {
		transform: translate(0, 0);
		opacity: 1;
		box-shadow: 0 0 30px 0 rgb(0 0 0 / var(--shadow-opacity));
	}
	.card-content--peek .card:hover .card__img {
		border-radius: 6px 40px 6px 40px;
	}
	.card-content--peek .card:hover .card__img-clip > :global(*) {
		transform: scale(1.1);
	}
	.card-content--peek .card__img {
		border-radius: 6px 20px 6px 20px;
	}
	.card-content--peek .card__interactions {
		bottom: 50px;
		left: 8px;
		transform: translateY(80px);
		z-index: 15;
		transition: transform 250ms cubic-bezier(0.4, 0, 0.2, 1);
	}
	.card-content--peek .card:hover .card__interactions {
		transform: translateY(50%);
	}
	.card-content--peek .card__text {
		background: rgb(var(--background));
		box-shadow: 0 0 0 0 rgb(0 0 0 / var(--shadow-opacity));
		border-radius: 6px 20px 6px 20px;
		margin-top: -50px;
		z-index: 10;
		position: relative;
		width: calc(100% - 30px);
		padding-top: 32px;
		padding-bottom: 40px;
		padding-inline: 20px;
		transition:
			transform 250ms cubic-bezier(0.4, 0, 0.2, 1),
			opacity 250ms cubic-bezier(0.4, 0, 0.2, 1),
			box-shadow 250ms cubic-bezier(0.4, 0, 0.2, 1);
		transform: translate(0, 25px);
		opacity: 0;
	}

	.card-content--compact .card {
		width: 400px;
		max-width: 100%;
		min-height: calc(var(--img-size, 100px) + 46px);
		display: flex;
		align-items: center;
		padding: 24px 24px;
		border-radius: 35px;
		box-shadow: 0 15px 30px -8px rgb(0 0 0 / 0.08);
		overflow: visible;
		cursor: default;
		transition: none;
	}
	.card-content--compact .card:hover {
		transform: none;
		box-shadow: 0 15px 30px -8px rgb(0 0 0 / 0.08);
	}
	.card-content--compact .card__img {
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
	.card-content--compact .card__img-clip {
		border-radius: inherit;
	}
	.card-content--compact .card__img :global(img) {
		width: 100%;
		height: 100%;
		border-radius: inherit;
		object-fit: cover;
	}
	.card-content--compact .card__img-clip > :global(*) {
		transition: transform 350ms cubic-bezier(0.4, 0, 0.2, 1);
	}
	.card-content--compact .card:hover .card__img-clip > :global(*) {
		transform: scale(1.12);
	}
	.card-content--compact .card__interactions {
		top: calc(24px + var(--img-size, 100px) * 0.52);
		left: calc(24px + var(--img-size, 100px) * 0.62);
		bottom: auto;
		width: 20px;
		height: 20px;
		padding: 0;
		background: rgb(255 71 87);
		color: rgb(255 255 255);
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 0.6rem;
		font-weight: 700;
		box-shadow: 0 4px 10px 0 rgb(255 71 87 / 0.6);
		user-select: none;
	}
	.card-content--compact .card__text {
		flex: 1 1 auto;
		min-width: 0;
		padding: 0 20px 0 23px;
	}
	.card-content--compact .card__title {
		padding: 0 0 5px;
	}
	.card-content--compact .card__title :global(:is(h2, h3, h4, h5, h6)) {
		font-size: 1rem;
		line-height: 1.25;
	}
	.card-content--compact .card__text :global(p) {
		font-size: 0.8rem;
		line-height: 1.7;
		opacity: 0.6;
	}
	.card-content--compact .card__actions {
		left: calc(var(--img-size, 100px) + 10px);
		right: 10px;
		gap: 0;
	}

	.card-content--default .card:not(:has(.card__interactions)) .card__text {
		padding-top: 10px;
	}
	.card-content--default .card:not(:has(.card__actions)) .card__text {
		padding-bottom: 10px;
	}

	.card-content--caption .card:has(.card__title):hover .card__text {
		padding-top: 28px;
	}
	.card-content--caption .card:has(.card__actions):hover .card__text {
		padding-bottom: 30px;
	}

	.card-content--frosted .card:has(.card__actions):hover .card__text {
		padding-bottom: 38px;
	}
	.card-content--frosted .card:not(:has(.card__title)):hover .card__text {
		padding-top: 12px;
	}

	.card-content--peek .card:not(:has(.card__interactions)) .card__text {
		padding-top: 16px;
	}
	.card-content--peek .card:not(:has(.card__actions)) .card__text {
		padding-bottom: 16px;
	}

	.card-content--compact .card:not(:has(.card__actions)) {
		min-height: 0;
	}
</style>
