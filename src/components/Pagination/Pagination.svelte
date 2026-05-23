<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import type { Color, Shape, Size } from '../../types';

	export type PaginationMode = 'numbers' | 'dots';
	export type PaginationVariant = 'default' | 'flat' | 'border' | 'transparent';

	export type PaginationProps = {
		/** Currently selected page (1-based). */
		value?: number;
		/** Total number of pages. */
		length?: number;
		/** Max number of buttons rendered before ellipses appear. */
		max?: number;
		/** Pages to jump when an ellipsis is clicked. */
		dottedJump?: number;
		/** Wrap around at the edges. */
		infinite?: boolean;
		/** Render a thin progress bar below the control. */
		progress?: boolean;
		/** Numeric buttons or dot indicators. */
		mode?: PaginationMode;
		/** Show prev/next arrows. */
		arrows?: boolean;
		/** Hide the buttons; render only prev/next arrows. */
		arrowsOnly?: boolean;
		/** Visual variant of the page buttons. */
		variant?: PaginationVariant;
		/** Predefined size (matches the kit's Button sizes). */
		size?: Size;
		/** Border-radius shape. */
		shape?: Shape;
		/** Disable individual pages (non-clickable). */
		disabledItems?: number[];
		/** Pages that show a loading spinner. */
		loadingItems?: number[];
		/** Disable the entire control. */
		disabled?: boolean;
		/** Disable the click ripple. */
		ripple?: boolean;
		/** Stretch the control to the parent's width. */
		block?: boolean;
		/** Palette color (`'primary' | 'success' | ...`) or hex / `rgb(...)`. */
		color?: Color;
		/** Label for the wrapping `<nav>`. Defaults to `'Pagination'`. */
		ariaLabel?: string;
		/** Aria-label for the prev arrow. */
		ariaLabelPrev?: string;
		/** Aria-label for the next arrow. */
		ariaLabelNext?: string;
		/** Replaces the page buttons with arbitrary content (still wrapped by arrows). */
		children?: Snippet;
		/** Custom previous arrow icon. */
		arrowPrev?: Snippet;
		/** Custom next arrow icon. */
		arrowNext?: Snippet;
		/** Fired on selection. */
		onchange?: (page: number) => void;
	} & Omit<HTMLAttributes<HTMLElement>, 'children'>;
</script>

<script lang="ts">
	import { CaretLeftIcon, CaretRightIcon, DotsThreeIcon } from 'phosphor-svelte';
	import { rgbTriplet } from '../../utils/color';
	import { cn } from '../../utils/cn';
	import { ripple as rippleAction } from '../../actions/ripple.svelte';
	import Spinner from '../../primitives/Spinner.svelte';

	let {
		value = $bindable(1),
		length = 0,
		max = 9,
		dottedJump = 5,
		infinite = false,
		progress = false,
		mode = 'numbers',
		arrows = true,
		arrowsOnly = false,
		variant = 'flat',
		size = 'medium',
		shape = 'default',
		disabledItems = [],
		loadingItems = [],
		disabled = false,
		ripple: rippleEnabled = true,
		block = false,
		color = 'primary',
		ariaLabel = 'Pagination',
		ariaLabelPrev = 'Previous page',
		ariaLabelNext = 'Next page',
		children,
		arrowPrev,
		arrowNext,
		onchange,
		class: className,
		style: userStyle,
		...rest
	}: PaginationProps = $props();

	let triplet = $derived(rgbTriplet(color));

	type Item = { kind: 'page'; n: number } | { kind: 'gap'; direction: 'prev' | 'next' };

	let items = $derived.by<Item[]>(() => {
		if (length <= 0) return [];
		if (mode === 'dots') return Array.from({ length }, (_, i) => ({ kind: 'page', n: i + 1 }) as Item);
		if (length <= 6 || max >= length) return Array.from({ length }, (_, i) => ({ kind: 'page', n: i + 1 }) as Item);

		const half = Math.floor(max / 2);
		const result: Item[] = [];
		const startCutoff = half;
		const endCutoff = length - half + 1;

		if (value > startCutoff && value < endCutoff) {
			result.push({ kind: 'page', n: 1 });
			result.push({ kind: 'gap', direction: 'prev' });
			const start = Math.max(2, value - Math.floor((max - 4) / 2));
			const end = Math.min(length - 1, start + max - 5);
			for (let i = start; i <= end; i += 1) result.push({ kind: 'page', n: i });
			result.push({ kind: 'gap', direction: 'next' });
			result.push({ kind: 'page', n: length });
		} else {
			for (let i = 1; i <= half; i += 1) result.push({ kind: 'page', n: i });
			result.push({ kind: 'gap', direction: 'next' });
			for (let i = endCutoff; i <= length; i += 1) result.push({ kind: 'page', n: i });
		}
		return result;
	});

	function setPage(n: number): void {
		if (disabled) return;
		const clamped = Math.max(1, Math.min(length, n));
		if (clamped === value) return;
		value = clamped;
		onchange?.(clamped);
	}

	function goPrev(): void {
		if (value > 1) setPage(value - 1);
		else if (infinite) setPage(length);
	}
	function goNext(): void {
		if (value < length) setPage(value + 1);
		else if (infinite) setPage(1);
	}
	function jump(direction: 'prev' | 'next'): void {
		setPage(direction === 'next' ? value + dottedJump : value - dottedJump);
	}

	let progressPercent = $derived(
		length > 1 ? ((value - 1) * 100) / (length - 1) : length === 1 ? 100 : 0
	);
</script>

<nav
	class={cn(
		'pagination',
		`pagination--variant-${variant}`,
		`pagination--size-${size}`,
		`pagination--shape-${shape}`,
		`pagination--mode-${mode}`,
		disabled && 'pagination--disabled',
		block && 'pagination--block',
		progress && 'pagination--has-progress',
		className
	)}
	style:--c={triplet}
	style={userStyle}
	aria-label={ariaLabel}
	data-testid="pagination"
	{...rest}
>
	{#if arrows}
		<button
			type="button"
			class="pagination__arrow pagination__arrow--prev"
			disabled={disabled || (!infinite && value <= 1)}
			onclick={goPrev}
			aria-label={ariaLabelPrev}
			use:rippleAction={{ disabled: !rippleEnabled || disabled }}
		>
			<span class="pagination__icon">
				{#if arrowPrev}{@render arrowPrev()}{:else}<CaretLeftIcon size={14} weight="bold" />{/if}
			</span>
		</button>
	{/if}

	{#if children}
		<div class="pagination__slot">{@render children()}</div>
	{:else if !arrowsOnly}
		<div class="pagination__list">
			{#each items as item, i (i)}
				{#if item.kind === 'page'}
					{@const isActive = item.n === value}
					{@const isItemDisabled = disabledItems.includes(item.n)}
					{@const isItemLoading = loadingItems.includes(item.n)}
					<button
						type="button"
						class="pagination__button"
						class:pagination__button--active={isActive}
						class:pagination__button--loading={isItemLoading}
						aria-current={isActive ? 'page' : undefined}
						aria-label={mode === 'dots' ? `Page ${item.n}` : undefined}
						disabled={disabled || isItemDisabled || isItemLoading}
						onclick={() => setPage(item.n)}
						use:rippleAction={{
							disabled: !rippleEnabled || disabled || isItemDisabled || isItemLoading,
							solidBg: isActive && (variant === 'default' || variant === 'border')
						}}
					>
						{#if mode === 'numbers'}
							<span class="pagination__label">{item.n}</span>
						{/if}
						{#if isItemLoading}
							<span class="pagination__loading" aria-hidden="true">
								<Spinner color={triplet} size={14} thickness={2} speed={800} />
							</span>
						{/if}
					</button>
				{:else}
					<button
						type="button"
						class="pagination__gap pagination__gap--{item.direction}"
						aria-label={item.direction === 'next' ? 'Next pages' : 'Previous pages'}
						onclick={() => jump(item.direction)}
						use:rippleAction={{ disabled: !rippleEnabled || disabled }}
					>
						<span class="pagination__icon">
							<DotsThreeIcon size={14} weight="bold" />
						</span>
					</button>
				{/if}
			{/each}
		</div>
	{/if}

	{#if arrows}
		<button
			type="button"
			class="pagination__arrow pagination__arrow--next"
			disabled={disabled || (!infinite && value >= length)}
			onclick={goNext}
			aria-label={ariaLabelNext}
			use:rippleAction={{ disabled: !rippleEnabled || disabled }}
		>
			<span class="pagination__icon">
				{#if arrowNext}{@render arrowNext()}{:else}<CaretRightIcon size={14} weight="bold" />{/if}
			</span>
		</button>
	{/if}

	{#if progress}
		<span
			class="pagination__progress"
			role="progressbar"
			aria-valuenow={value}
			aria-valuemin={1}
			aria-valuemax={length || 1}
		>
			<span class="pagination__progress-bar" style:width="{progressPercent}%"></span>
		</span>
	{/if}
</nav>

<style>
	:where(.pagination) {
		--c: var(--primary);
		--sa-color: var(--c);
		--ease: cubic-bezier(0.4, 0, 0.2, 1);

		position: relative;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 4px;
		padding: 4px 0;
		margin: 5px 0;
		border-radius: 12px;
		font: inherit;
	}
	:where(.pagination--block) {
		display: flex;
		width: 100%;
	}
	:where(.pagination--has-progress) {
		padding-bottom: 10px;
	}
	:where(.pagination--disabled) {
		opacity: 0.5;
		pointer-events: none;
	}

	.pagination__list {
		display: inline-flex;
		align-items: center;
		gap: 4px;
		flex: 0 1 auto;
		min-width: 0;
	}

	.pagination__button,
	.pagination__arrow,
	.pagination__gap {
		position: relative;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-width: var(--btn-size);
		height: var(--btn-size);
		padding: 0 6px;
		box-sizing: border-box;
		border: 0;
		border-radius: var(--btn-radius);
		background: transparent;
		color: inherit;
		font: inherit;
		font-size: var(--btn-font);
		cursor: pointer;
		outline: none;
		transition:
			background-color 200ms var(--ease),
			box-shadow 200ms var(--ease),
			transform 200ms var(--ease);
	}

	.pagination__label {
		position: relative;
		z-index: 2;
		font-variant-numeric: tabular-nums;
	}

	:where(.pagination--size-xl)     { --btn-size: 44px; --btn-font: 1.05rem; --btn-radius: 14px; }
	:where(.pagination--size-large)  { --btn-size: 38px; --btn-font: 0.95rem; --btn-radius: 12px; }
	:where(.pagination--size-medium) { --btn-size: 32px; --btn-font: 0.85rem; --btn-radius: 10px; }
	:where(.pagination--size-small)  { --btn-size: 28px; --btn-font: 0.78rem; --btn-radius: 8px; }
	:where(.pagination--size-mini)   { --btn-size: 22px; --btn-font: 0.7rem;  --btn-radius: 6px; }

	.pagination--shape-circle .pagination__button,
	.pagination--shape-circle .pagination__arrow,
	.pagination--shape-circle .pagination__gap { border-radius: 50vmax; }
	.pagination--shape-square .pagination__button,
	.pagination--shape-square .pagination__arrow,
	.pagination--shape-square .pagination__gap { border-radius: 0; }

	.pagination--variant-default .pagination__button:not(.pagination__button--active),
	.pagination--variant-default .pagination__arrow,
	.pagination--variant-default .pagination__gap {
		color: rgb(var(--text));
	}
	.pagination--variant-default .pagination__button:hover:not(:disabled),
	.pagination--variant-default .pagination__arrow:hover:not(:disabled),
	.pagination--variant-default .pagination__gap:hover:not(:disabled) {
		background: rgb(var(--gray-2));
	}
	.pagination--variant-default .pagination__button--active {
		background: rgb(var(--c));
		color: rgb(var(--on-accent));
	}
	.pagination--variant-default .pagination__button--active:hover:not(:disabled) {
		background: rgb(var(--c));
	}

	.pagination--variant-flat .pagination__button:hover:not(:disabled),
	.pagination--variant-flat .pagination__arrow:hover:not(:disabled),
	.pagination--variant-flat .pagination__gap:hover:not(:disabled) {
		background: rgb(var(--c) / 0.1);
		color: rgb(var(--c));
	}
	.pagination--variant-flat .pagination__button--active {
		background: rgb(var(--c) / 0.18);
		color: rgb(var(--c));
		font-weight: 600;
	}

	.pagination--variant-border .pagination__button,
	.pagination--variant-border .pagination__arrow,
	.pagination--variant-border .pagination__gap {
		box-shadow: inset 0 0 0 1px rgb(var(--text) / 0.12);
	}
	.pagination--variant-border .pagination__button:hover:not(:disabled),
	.pagination--variant-border .pagination__arrow:hover:not(:disabled),
	.pagination--variant-border .pagination__gap:hover:not(:disabled) {
		box-shadow: inset 0 0 0 1px rgb(var(--c) / 0.5);
		color: rgb(var(--c));
	}
	.pagination--variant-border .pagination__button--active {
		background: rgb(var(--c));
		color: rgb(var(--on-accent));
		box-shadow: inset 0 0 0 1px rgb(var(--c));
	}

	.pagination--variant-transparent .pagination__button:hover:not(:disabled),
	.pagination--variant-transparent .pagination__arrow:hover:not(:disabled),
	.pagination--variant-transparent .pagination__gap:hover:not(:disabled) {
		color: rgb(var(--c));
	}
	.pagination--variant-transparent .pagination__button--active {
		color: rgb(var(--c));
		font-weight: 600;
	}

	.pagination__button:disabled,
	.pagination__arrow:disabled,
	.pagination__gap:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}
	.pagination__button--loading {
		opacity: 1;
		cursor: progress;
	}
	.pagination__button--loading .pagination__label {
		visibility: hidden;
	}
	.pagination__loading {
		position: absolute;
		left: 50%;
		top: 50%;
		z-index: 2;
		display: flex;
		transform: translate(-50%, -50%);
		pointer-events: none;
	}

	.pagination__icon {
		position: relative;
		z-index: 2;
		display: inline-flex;
		align-items: center;
		justify-content: center;
	}

	.pagination__button:focus-visible,
	.pagination__arrow:focus-visible,
	.pagination__gap:focus-visible {
		outline: 2px solid rgb(var(--c) / 0.6);
		outline-offset: 2px;
	}

	.pagination--mode-dots .pagination__list { gap: 6px; }
	.pagination--mode-dots .pagination__button {
		min-width: calc(var(--btn-size) * 0.4);
		width: calc(var(--btn-size) * 0.4);
		height: calc(var(--btn-size) * 0.4);
		padding: 0;
		border-radius: 50%;
		background: rgb(var(--text) / 0.18);
		box-shadow: none;
		transition:
			background-color 200ms var(--ease),
			transform 200ms var(--ease);
	}
	.pagination--mode-dots .pagination__button:hover:not(:disabled) {
		background: rgb(var(--text) / 0.32);
		transform: scale(1.15);
	}
	.pagination--mode-dots .pagination__button--active {
		background: rgb(var(--c));
		transform: scale(1.2);
	}

	.pagination__progress {
		position: absolute;
		left: 2rem;
		right: 2rem;
		bottom: 2px;
		height: 2px;
		background: rgb(var(--text) / 0.08);
		border-radius: 2px;
		overflow: hidden;
		display: block;
	}
	.pagination__progress-bar {
		display: block;
		height: 100%;
		background: rgb(var(--c));
		border-radius: inherit;
		transition: width 250ms var(--ease);
	}

	.pagination__slot {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		flex: 1 1 auto;
		min-width: 0;
		padding: 0 6px;
	}
</style>
