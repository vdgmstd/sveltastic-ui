<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import type { Color } from '../../types';

	export type AlertVariant = 'relief' | 'gradient';

	export type AlertPageChangeDetail = { from: number; to: number };

	export type AlertProps = {
		/** Visual variant. */
		variant?: AlertVariant;
		/** Palette name, hex, `rgb(...)`, or `"r,g,b"` triplet. */
		color?: Color;
		/** End-stop color for the `gradient` variant. Defaults to the `--gradient-end` token. */
		gradientEnd?: Color;
		/** Show / hide the alert. Two-way bindable. */
		open?: boolean;
		/**
		 * Collapse toggle on the title. `undefined` disables the affordance entirely; `true`/`false`
		 * enables a click-to-collapse handle on the title with a `Plus` / `Minus` icon. Two-way bindable.
		 */
		collapsed?: boolean | undefined;
		/** Show a top-right close button. */
		closable?: boolean;
		/** Progress bar at the bottom, 0–100. `0` hides the bar. */
		progress?: number;
		/** Current page (1-based). `0` disables the pagination UI. Two-way bindable. */
		page?: number;
		/** Total page count. Required when `page > 0`. */
		pages?: number;
		/** Default content. */
		children?: Snippet;
		/** Icon rendered in the left strip (50px wide, centered). */
		icon?: Snippet;
		/** Title row. Click-to-collapse if `collapsed` is a boolean. */
		title?: Snippet;
		/** Footer row (bottom-right). */
		footer?: Snippet;
		/** Per-page content. Receives the current 1-based page as its argument. */
		pagesContent?: Snippet<[number]>;
		/** Fires when the close button is clicked. */
		onclose?: () => void;
		/** Fires right before `page` changes through the built-in pager. */
		onbeforechange?: (detail: AlertPageChangeDetail) => void;
	} & Omit<HTMLAttributes<HTMLDivElement>, 'color' | 'title'>;
</script>

<script lang="ts">
	import { slide } from 'svelte/transition';
	import { cubicInOut } from 'svelte/easing';
	import {
		CaretLeftIcon,
		CaretRightIcon,
		MinusIcon,
		PlusIcon,
		XIcon
	} from 'phosphor-svelte';

	import { rgbTriplet } from '../../utils/color';
	import { cn } from '../../utils/cn';

	let {
		variant = 'relief',
		color = 'primary',
		gradientEnd,
		open = $bindable(true),
		collapsed = $bindable(undefined),
		closable = false,
		progress = 0,
		page = $bindable(0),
		pages = 0,
		children,
		icon,
		title,
		footer,
		pagesContent,
		onclose,
		onbeforechange,
		class: className,
		style: userStyle,
		...rest
	}: AlertProps = $props();

	let triplet = $derived(rgbTriplet(color));
	let endTriplet = $derived(gradientEnd ? rgbTriplet(gradientEnd) : undefined);
	let hasCollapse = $derived(typeof collapsed === 'boolean');
	let isCollapsed = $derived(collapsed === true);
	let hasPagination = $derived(page > 0 && pages > 0);
	let progressPercent = $derived(Math.max(0, Math.min(100, progress)));

	function handleClickClose(): void {
		onclose?.();
		open = false;
	}

	function handleClickTitle(): void {
		if (!hasCollapse) return;
		collapsed = !collapsed;
	}

	function handleTitleKeydown(event: KeyboardEvent): void {
		if (!hasCollapse) return;
		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			collapsed = !collapsed;
		}
	}

	function goToPage(next: number): void {
		if (next === page) return;
		if (next < 1 || next > pages) return;
		onbeforechange?.({ from: page, to: next });
		page = next;
	}

	function handleClickPrev(): void {
		goToPage(page - 1);
	}

	function handleClickNext(): void {
		goToPage(page + 1);
	}
</script>

{#if open}
	<div
		class={cn('alert', `alert--${variant}`, hasPagination && 'alert--pages', className)}
		style:--c={triplet}
		style:--ge={endTriplet}
		style={userStyle}
		role="alert"
		data-testid="alert"
		transition:slide={{ duration: 250, easing: cubicInOut }}
		{...rest}
	>
		{#if icon}
			<div class="alert__icon">{@render icon()}</div>
		{/if}

		{#if title}
			{#if hasCollapse}
				<div
					class="alert__title alert__title--clickHidden"
					role="button"
					tabindex="0"
					aria-expanded={!isCollapsed}
					onclick={handleClickTitle}
					onkeydown={handleTitleKeydown}
				>
					<span class="alert__title-text">{@render title()}</span>
					{#if !closable}
						<span class="alert__collapse" aria-hidden="true">
							{#if isCollapsed}
								<PlusIcon size={18} weight="bold" />
							{:else}
								<MinusIcon size={18} weight="bold" />
							{/if}
						</span>
					{/if}
				</div>
			{:else}
				<div class="alert__title">
					<span class="alert__title-text">{@render title()}</span>
				</div>
			{/if}
		{/if}

		{#if !isCollapsed}
			<div class="alert__content" transition:slide={{ duration: 250, easing: cubicInOut }}>
				<div class="alert__content__text">
					{@render children?.()}
					{#if hasPagination && pagesContent}
						{@render pagesContent(page)}
					{/if}
				</div>
			</div>
		{/if}

		{#if closable}
			<button type="button" class="alert__close" onclick={handleClickClose} aria-label="Close">
				<XIcon size={18} weight="bold" />
			</button>
		{/if}

		{#if footer}
			<div class="alert__footer">{@render footer()}</div>
		{/if}

		{#if progress > 0}
			<div
				class="alert__progress"
				role="progressbar"
				aria-valuenow={progressPercent}
				aria-valuemin="0"
				aria-valuemax="100"
			>
				<div class="alert__progress__bar" style:width="{progressPercent}%"></div>
			</div>
		{/if}

		{#if hasPagination}
			<div class="alert__pagination">
				<button
					type="button"
					onclick={handleClickPrev}
					disabled={page <= 1 || undefined}
					aria-label="Previous page"
				>
					<CaretLeftIcon size={14} weight="bold" />
				</button>
				<span>{page} / {pages}</span>
				<button
					type="button"
					onclick={handleClickNext}
					disabled={page >= pages || undefined}
					aria-label="Next page"
				>
					<CaretRightIcon size={14} weight="bold" />
				</button>
			</div>
		{/if}
	</div>
{/if}

<style>
	:where(.alert) {
		--c: var(--primary);
		--ge: var(--gradient-end);

		position: relative;
		width: 100%;
		padding: 0 20px;
		background: rgb(var(--c));
		color: rgb(255 255 255);
		border-radius: 20px;
		font-size: 0.9rem;
		z-index: 10;
		overflow: hidden;
		box-sizing: border-box;
	}

	.alert ::selection { background: rgb(255 255 255 / 0.2); }

	.alert :global(b) { font-weight: 600; }
	.alert :global(a) {
		color: inherit;
		text-decoration: underline;
		transition: opacity 250ms cubic-bezier(0.4, 0, 0.2, 1);
	}
	.alert :global(a:hover) { opacity: 0.6; }

	:where(.alert--relief) {
		box-shadow: 6px 6px 0 0 rgb(var(--c) / 0.3);
	}

	.alert--gradient::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background: linear-gradient(30deg, rgb(var(--ge) / 0) 33%, rgb(var(--ge)) 100%);
		border-radius: inherit;
		z-index: -1;
		pointer-events: none;
		box-sizing: border-box;
	}

	.alert__icon :global(i),
	.alert__icon :global(svg) { color: rgb(255 255 255); fill: rgb(255 255 255); }
	.alert__close { color: rgb(255 255 255); }
	.alert__close:hover {
		transform: translate(0, -2px);
		box-shadow: 0 5px 18px 0 rgb(0 0 0 / 0.15);
	}
	.alert--relief .alert__close:hover {
		background: rgb(0 0 0 / 0.2);
	}

	.alert__title {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 15px;
		font-weight: 600;
		font-size: 1rem;
	}
	.alert__title--clickHidden {
		cursor: pointer;
		padding-right: 0;
	}
	.alert__title--clickHidden:focus-visible {
		outline: 2px solid rgb(255 255 255 / 0.6);
		outline-offset: -2px;
		border-radius: inherit;
	}
	.alert__title-text {
		display: inline-flex;
		align-items: center;
	}

	.alert__title ~ .alert__content .alert__content__text { padding-top: 0; }

	.alert__collapse {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 30px;
		height: 30px;
		transition: transform 300ms cubic-bezier(0.4, 0, 0.2, 1);
	}
	.alert__title--clickHidden:hover .alert__collapse { transform: rotate(-90deg); }

	.alert__content { overflow: hidden; }
	.alert__content__text {
		padding: 20px 15px;
	}

	.alert__close {
		position: absolute;
		top: 9px;
		right: 6px;
		width: 30px;
		height: 30px;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 0;
		background: transparent;
		color: rgb(255 255 255);
		border: 0;
		border-radius: 10px;
		cursor: pointer;
		transition: transform 250ms cubic-bezier(0.4, 0, 0.2, 1),
			box-shadow 250ms cubic-bezier(0.4, 0, 0.2, 1),
			background-color 250ms cubic-bezier(0.4, 0, 0.2, 1);
	}
	.alert__close:focus-visible {
		outline: 2px solid rgb(255 255 255 / 0.6);
		outline-offset: 2px;
	}
	.alert__close :global(svg) { fill: currentColor; }

	.alert__footer {
		position: relative;
		width: 100%;
		padding: 0 15px 10px;
		display: flex;
		align-items: center;
		justify-content: flex-end;
		box-sizing: border-box;
	}

	.alert__icon {
		position: absolute;
		top: 15px;
		left: 0;
		width: 50px;
		height: 1.5rem;
		display: flex;
		align-items: center;
		justify-content: center;
		padding-left: 2px;
		box-sizing: border-box;
	}
	.alert__icon :global(i) { font-size: 1.3rem; color: rgb(255 255 255); }
	.alert__icon :global(svg) { width: 24px; height: 24px; fill: rgb(255 255 255); }

	.alert__icon ~ .alert__title { padding-left: 35px; }
	.alert__icon ~ .alert__content .alert__content__text { padding-left: 35px; }
	.alert__icon ~ .alert__footer { padding-left: 35px; }

	.alert__progress {
		position: absolute;
		bottom: 0;
		left: 0;
		width: 100%;
		height: 2px;
		background: rgb(255 255 255 / 0.2);
	}
	.alert__progress__bar {
		position: relative;
		left: 0;
		width: 30%;
		height: 100%;
		background: rgb(255 255 255);
		transition: width 250ms cubic-bezier(0.4, 0, 0.2, 1);
	}

	.alert__pagination {
		position: relative;
		padding: 0 20px;
		margin-bottom: 10px;
		display: flex;
		align-items: center;
		justify-content: flex-start;
		color: rgb(255 255 255);
	}
	.alert__pagination span {
		margin: 0 8px;
		min-width: 28px;
		font-size: 0.8rem;
		text-align: center;
	}
	.alert__pagination button {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		padding: 3px 7px;
		background: rgb(255 255 255 / 0.15);
		color: rgb(255 255 255);
		border: 0;
		border-radius: 8px;
		font-size: 1rem;
		cursor: pointer;
		transition: background-color 250ms cubic-bezier(0.4, 0, 0.2, 1);
	}
	.alert__pagination button:hover:not(:disabled) {
		background: rgb(255 255 255 / 0.28);
	}
	.alert__pagination button:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}
	.alert__pagination button:focus-visible {
		outline: 2px solid rgb(255 255 255 / 0.6);
		outline-offset: 2px;
	}
</style>
