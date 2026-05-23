<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { Color, Size } from '../../types';

	export type SegmentedValue = string | number;

	export type SegmentedItem<V extends SegmentedValue = SegmentedValue> = {
		/** Stored when this segment is picked. */
		value: V;
		/** Visible label. */
		label?: string;
		/** Optional glyph rendered before the label. */
		icon?: Snippet;
		/** Inert segment. */
		disabled?: boolean;
		/** Per-item palette accent. Falls back to the group `color`. Drives the active label color and the click-ripple bloom on this segment. */
		color?: Color;
	};

	export type SegmentedVariant = 'default' | 'tonal' | 'border' | 'relief';

	export type SegmentedProps<V extends SegmentedValue = SegmentedValue> = {
		/** Selected token. Bindable. */
		value?: V;
		/** Items to render. */
		items: ReadonlyArray<SegmentedItem<V>>;
		/** Palette accent for the active thumb and (in `tonal`) the track tint. */
		color?: Color;
		/** Visual variant. `default` — gray track, accent thumb. `tonal` — accent-tinted track. `border` — outlined track, no fill. `relief` — sunken track, raised thumb. */
		variant?: SegmentedVariant;
		/** Sizing scale — shared with Button (`xl` | `large` | `medium` | `small` | `mini`). Outer height matches a Button at the same size. */
		size?: Size;
		/** Stretch the group to fill the container width. */
		block?: boolean;
		/** Disable the entire group. */
		disabled?: boolean;
		/** Accessible label for the radiogroup. */
		ariaLabel?: string;
		/** Fired on selection change. */
		onchange?: (value: V) => void;
		/** Class merged onto the root. */
		class?: string;
		/** Inline style merged onto the root. */
		style?: string;
	};
</script>

<script lang="ts" generics="V extends SegmentedValue">
	import { Spring, Tween } from 'svelte/motion';
	import { cubicOut, backOut } from 'svelte/easing';
	import { rgbTriplet } from '../../utils/color';
	import { cn } from '../../utils/cn';
	import { ripple as rippleAction } from '../../actions/ripple.svelte';

	let {
		value = $bindable(),
		items,
		color = 'primary',
		variant = 'default',
		size = 'medium',
		block = false,
		disabled = false,
		ariaLabel,
		onchange,
		class: className,
		style: userStyle
	}: SegmentedProps<V> = $props();

	let triplet = $derived(rgbTriplet(color));
	let activeIdx = $derived(items.findIndex((item) => item.value === value));
	let activeTriplet = $derived(
		activeIdx >= 0 ? rgbTriplet(items[activeIdx]?.color ?? color) : triplet
	);

	let container: HTMLDivElement | undefined = $state();
	let ripplesLayer: HTMLSpanElement | undefined = $state();
	let buttons: (HTMLButtonElement | undefined)[] = $state([]);

	const thumbX = new Spring(0, { stiffness: 0.18, damping: 0.78 });
	const thumbW = new Spring(0, { stiffness: 0.18, damping: 0.78 });
	const pressScale = new Tween(1, { duration: 110, easing: cubicOut });
	let pressToken = 0;
	let ready = $state(false);

	async function runPress(): Promise<void> {
		if (disabled) return;
		const token = ++pressToken;
		pressScale.set(1, { duration: 0 });
		await pressScale.set(0.85, { duration: 110, easing: cubicOut });
		if (token !== pressToken) return;
		await pressScale.set(1, { duration: 460, easing: backOut });
	}

	let onFilledThumb = $derived(variant === 'default' || variant === 'relief');
	function rippleOpts(item: SegmentedItem<V>) {
		return {
			disabled: disabled || item.disabled,
			color: onFilledThumb ? '255 255 255' : (item.color ?? color),
			soft: true,
			duration: 1000,
			mountTo: ripplesLayer,
			textColor: 'currentColor' as const
		};
	}

	function measure(): void {
		if (activeIdx < 0) {
			thumbW.set(0, ready ? undefined : { instant: true });
			return;
		}
		const btn = buttons[activeIdx];
		if (!btn) return;
		const opts = ready ? undefined : { instant: true };
		thumbX.set(btn.offsetLeft, opts);
		thumbW.set(btn.offsetWidth, opts);
	}

	$effect(() => {
		void activeIdx;
		void items.length;
		for (const item of items) {
			void item.label;
			void item.disabled;
		}
		measure();
		if (!ready && thumbW.current > 0) {
			const id = requestAnimationFrame(() => (ready = true));
			return () => cancelAnimationFrame(id);
		}
	});

	$effect(() => {
		if (!container) return;
		const ro = new ResizeObserver(() => measure());
		ro.observe(container);
		return () => ro.disconnect();
	});

	function select(item: SegmentedItem<V>): void {
		if (disabled || item.disabled) return;
		if (value === item.value) return;
		value = item.value;
		onchange?.(item.value);
	}

	function findEnabled(from: number, step: number): number {
		let i = from + step;
		while (i >= 0 && i < items.length) {
			if (!items[i]?.disabled) return i;
			i += step;
		}
		return -1;
	}

	function handleKeydown(event: KeyboardEvent, idx: number): void {
		if (disabled) return;
		let next = -1;
		switch (event.key) {
			case 'ArrowRight':
			case 'ArrowDown':
				next = findEnabled(idx, 1);
				break;
			case 'ArrowLeft':
			case 'ArrowUp':
				next = findEnabled(idx, -1);
				break;
			case 'Home':
				next = findEnabled(-1, 1);
				break;
			case 'End':
				next = findEnabled(items.length, -1);
				break;
		}
		if (next >= 0 && next !== idx) {
			event.preventDefault();
			const item = items[next];
			if (item) {
				select(item);
				buttons[next]?.focus();
			}
		}
	}
</script>

<div
	bind:this={container}
	class={cn(
		'segmented',
		`segmented--${size}`,
		`segmented--variant-${variant}`,
		block && 'segmented--block',
		disabled && 'segmented--disabled',
		ready && 'segmented--ready',
		className
	)}
	role="radiogroup"
	aria-label={ariaLabel}
	aria-disabled={disabled || undefined}
	style:--c={triplet}
	style:--at={activeTriplet}
	style:--n={items.length}
	style={userStyle}
	data-testid="segmented"
>
	<span
		class="segmented__thumb"
		class:segmented__thumb--hidden={thumbW.current === 0}
		aria-hidden="true"
		style:--x={`${thumbX.current}px`}
		style:--w={`${thumbW.current}px`}
		style:--ps={pressScale.current}
	>
		<span bind:this={ripplesLayer} class="segmented__thumb-ripples" aria-hidden="true"></span>
	</span>
	{#each items as item, i (item.value)}
		{@const isActive = item.value === value}
		{@const isDisabled = disabled || item.disabled}
		<button
			bind:this={buttons[i]}
			type="button"
			class="segmented__item"
			class:segmented__item--active={isActive}
			role="radio"
			aria-checked={isActive}
			tabindex={isActive || (activeIdx < 0 && i === 0) ? 0 : -1}
			disabled={isDisabled}
			onpointerdown={() => {
				if (isDisabled) return;
				void runPress();
			}}
			onclick={() => select(item)}
			onkeydown={(e) => handleKeydown(e, i)}
			use:rippleAction={rippleOpts(item)}
		>
			{#if item.icon}
				<span class="segmented__icon">{@render item.icon()}</span>
			{/if}
			{#if item.label}{item.label}{/if}
		</button>
	{/each}
</div>

<style>
	:where(.segmented) {
		--c: var(--primary);
		--at: var(--c);
		--x: 0px;
		--w: 0px;
		--pad: 3px;
		--radius: 13px;
		--inner-radius: 10px;
		--item-py: 5px;
		--item-px: 12px;
		--font-size: 0.8rem;
		--ripple-soft-alpha: 0.2;

		position: relative;
		display: inline-flex;
		align-items: stretch;
		padding: var(--pad);
		background: rgb(var(--gray-2));
		border-radius: var(--radius);
		user-select: none;
		isolation: isolate;
	}

	:where(.segmented--xl) {
		--pad: 5px;
		--item-py: 10px;
		--item-px: 20px;
		--font-size: 1.1rem;
		--radius: 22px;
		--inner-radius: 17px;
	}

	:where(.segmented--large) {
		--pad: 4px;
		--item-py: 6px;
		--item-px: 15px;
		--font-size: 1rem;
		--radius: 17px;
		--inner-radius: 13px;
	}

	:where(.segmented--small) {
		--pad: 2px;
		--item-py: 3px;
		--item-px: 10px;
		--font-size: 0.75rem;
		--radius: 10px;
		--inner-radius: 8px;
	}

	:where(.segmented--mini) {
		--pad: 1px;
		--item-py: 2px;
		--item-px: 8px;
		--font-size: 0.6rem;
		--radius: 7px;
		--inner-radius: 6px;
	}

	:where(.segmented--block) {
		display: grid;
		grid-template-columns: repeat(var(--n), 1fr);
		width: 100%;
	}

	:where(.segmented--disabled) {
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
		transition: background-color 220ms cubic-bezier(0.4, 0, 0.2, 1);
	}

	.segmented__thumb-ripples {
		position: absolute;
		inset: 0;
		overflow: hidden;
		pointer-events: none;
		border-radius: inherit;
	}

	.segmented__thumb--hidden {
		opacity: 0;
	}

	.segmented__item {
		position: relative;
		z-index: 2;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 6px;
		padding: var(--item-py) var(--item-px);
		background: transparent;
		border: 0;
		color: rgb(var(--text) / 0.6);
		font: inherit;
		font-size: var(--font-size);
		font-weight: 500;
		cursor: pointer;
		border-radius: var(--inner-radius);
		white-space: nowrap;
		outline: none;
		transition: color 220ms cubic-bezier(0.4, 0, 0.2, 1);
	}

	.segmented__item:hover:not(.segmented__item--active):not(:disabled) {
		color: rgb(var(--text) / 0.95);
	}

	.segmented__item:focus-visible:not(.segmented__item--active) {
		color: rgb(var(--c));
	}

	.segmented__item--active {
		color: rgb(var(--on-accent));
	}

	/* tonal — soft accent-tinted thumb, accent text (mirrors Button flat) */
	:where(.segmented--variant-tonal) {
		background: rgb(var(--c) / 0.08);
	}
	.segmented--variant-tonal .segmented__thumb {
		background: rgb(var(--at) / 0.15);
	}
	.segmented--variant-tonal .segmented__item {
		color: color-mix(in oklab, rgb(var(--text) / 0.55), rgb(var(--c)) 35%);
	}
	.segmented--variant-tonal .segmented__item:hover:not(.segmented__item--active):not(:disabled) {
		color: rgb(var(--c));
	}
	.segmented--variant-tonal .segmented__item--active {
		color: rgb(var(--at));
	}

	/* border — outlined thumb, accent text (mirrors Button border) */
	:where(.segmented--variant-border) {
		background: transparent;
		box-shadow: inset 0 0 0 1px rgb(var(--text) / 0.18);
	}
	.segmented--variant-border .segmented__thumb {
		background: transparent;
		box-shadow: inset 0 0 0 2px rgb(var(--at));
	}
	.segmented--variant-border .segmented__item--active {
		color: rgb(var(--at));
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

	.segmented__item:disabled {
		opacity: 0.45;
		cursor: not-allowed;
	}

	.segmented__icon {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		font-size: 1.05em;
	}
</style>
