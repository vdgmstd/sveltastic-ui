<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { Color, Placement } from '../../types';

	export type TooltipPlacement = Extract<Placement, 'top' | 'right' | 'bottom' | 'left'>;
	export type TooltipVariant = 'default' | 'shadow' | 'border';
	export type TooltipShape = 'default' | 'circle' | 'square';
	export type TooltipTrigger = 'hover' | 'click' | 'manual';

	export type TooltipProps = {
		/** Trigger content. Required. */
		children: Snippet;
		/** Tooltip body. */
		content: Snippet;
		/** Side of the trigger. */
		placement?: TooltipPlacement;
		/** Show / hide. Two-way bindable. */
		open?: boolean;
		/** Activation strategy. */
		trigger?: TooltipTrigger;
		/** Visual variant. */
		variant?: TooltipVariant;
		/** Border radius shape. */
		shape?: TooltipShape;
		/** Show the pointer arrow. */
		arrow?: boolean;
		/** Keep the bubble open while the pointer is over it. */
		interactive?: boolean;
		/** Show-delay in ms (hover/focus only). */
		delay?: number;
		/** Spinner overlay. */
		loading?: boolean;
		/** Palette color. */
		color?: Color;
		/** Class merged onto the trigger wrapper. */
		class?: string;
		/** Inline style merged onto the trigger wrapper. */
		style?: string;
	};
</script>

<script lang="ts">
	import { fade } from 'svelte/transition';
	import { portal } from '../../actions/portal';
	import { clickOutside } from '../../actions/clickOutside';
	import { rgbTriplet } from '../../utils/color';
	import { cn } from '../../utils/cn';
	import { watchAnchor } from '../../utils/anchor';
	import Spinner from '../../primitives/Spinner.svelte';

	let {
		children,
		content,
		placement = 'top',
		open = $bindable(false),
		trigger = 'hover',
		variant = 'default',
		shape = 'default',
		arrow = true,
		interactive = false,
		delay = 0,
		loading = false,
		color = 'dark',
		class: className,
		style: userStyle
	}: TooltipProps = $props();

	let triplet = $derived(rgbTriplet(color));
	let spinnerColor = $derived(variant === 'default' ? 'background' : color);
	let triggerEl: HTMLDivElement | undefined = $state();
	let bubbleEl: HTMLDivElement | undefined = $state();
	let coords = $state({ x: 0, y: 0 });
	let pointerOnBubble = $state(false);
	let timer: number | undefined;

	function clearTimer(): void {
		if (timer !== undefined) {
			window.clearTimeout(timer);
			timer = undefined;
		}
	}

	function show(): void {
		clearTimer();
		if (delay > 0) {
			timer = window.setTimeout(() => {
				open = true;
				timer = undefined;
			}, delay);
		} else {
			open = true;
		}
	}

	function hide(): void {
		clearTimer();
		if (interactive) {
			timer = window.setTimeout(() => {
				if (!pointerOnBubble) open = false;
				timer = undefined;
			}, 150);
		} else {
			open = false;
		}
	}

	function handleEnter(): void {
		if (trigger === 'hover') show();
	}
	function handleLeave(): void {
		if (trigger === 'hover') hide();
	}
	function handleClick(): void {
		if (trigger === 'click') open = !open;
	}
	function handleClickOutside(): void {
		if (trigger === 'click') open = false;
	}

	function reposition(): void {
		if (!open) return;
		if (!triggerEl || !bubbleEl) return;
		const t = triggerEl.getBoundingClientRect();
		const b = bubbleEl.getBoundingClientRect();
		const gap = 8;
		let x = 0;
		let y = 0;
		if (placement === 'top') {
			x = t.left + (t.width - b.width) / 2;
			y = t.top - b.height - gap;
		} else if (placement === 'bottom') {
			x = t.left + (t.width - b.width) / 2;
			y = t.bottom + gap;
		} else if (placement === 'left') {
			x = t.left - b.width - gap;
			y = t.top + (t.height - b.height) / 2;
		} else if (placement === 'right') {
			x = t.right + gap;
			y = t.top + (t.height - b.height) / 2;
		}
		x = Math.max(8, Math.min(window.innerWidth - b.width - 8, x));
		y = Math.max(8, Math.min(window.innerHeight - b.height - 8, y));
		coords = { x: x + window.scrollX, y: y + window.scrollY };
	}

	$effect(() => {
		if (!open || !triggerEl || !bubbleEl) return;
		return watchAnchor(triggerEl, bubbleEl, reposition);
	});

	$effect(() => () => clearTimer());
</script>

<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
<!-- The wrapper is decorative: keyboard + ARIA come from the interactive child (Button, link). Click bubbles from the child and toggles the bubble for trigger="click". -->
<div
	class={cn('tooltip-trigger', className)}
	style={userStyle}
	bind:this={triggerEl}
	onmouseenter={handleEnter}
	onmouseleave={handleLeave}
	onfocusin={handleEnter}
	onfocusout={handleLeave}
	onclick={handleClick}
	role="presentation"
	data-testid="tooltip-trigger"
>
	{@render children()}
</div>

{#if open}
	<div
		bind:this={bubbleEl}
		class="tooltip tooltip--{placement} tooltip--variant-{variant} tooltip--shape-{shape}"
		class:tooltip--no-arrow={!arrow}
		style:--c={triplet}
		style:left="{coords.x}px"
		style:top="{coords.y}px"
		role="tooltip"
		data-testid="tooltip"
		use:portal
		use:clickOutside={{ handler: handleClickOutside, include: triggerEl ? [triggerEl] : [], disabled: trigger !== 'click' }}
		onmouseenter={() => {
			pointerOnBubble = true;
			clearTimer();
		}}
		onmouseleave={() => {
			pointerOnBubble = false;
			if (trigger === 'hover') hide();
		}}
		transition:fade={{ duration: 150 }}
	>
		{#if loading}
			<span class="tooltip__spinner" aria-hidden="true">
				<Spinner color={spinnerColor} size={16} thickness={2} speed={800} />
			</span>
		{:else}
			{@render content()}
		{/if}
	</div>
{/if}

<style>
	:where(.tooltip-trigger) {
		display: inline-flex;
	}
	.tooltip {
		--c: var(--dark);
		--tooltip-bg: rgb(var(--c) / 0.92);
		position: absolute;
		z-index: 100000;
		max-width: 350px;
		min-width: 30px;
		min-height: 30px;
		padding: 6px 12px;
		font-size: 0.85rem;
		text-align: center;
		background: var(--tooltip-bg);
		color: rgb(var(--light));
		border-radius: 10px;
		-webkit-backdrop-filter: var(--frost);
		backdrop-filter: var(--frost);
	}
	:global([data-theme='dark']) .tooltip--variant-default {
		box-shadow: 0 0 0 1px rgb(255 255 255 / 0.08), 0 8px 24px -8px rgb(0 0 0 / 0.6);
	}
	.tooltip--shape-circle { border-radius: 50vmax; }
	.tooltip--shape-square { border-radius: 0; }
	.tooltip--no-arrow::after { display: none; }

	.tooltip::after {
		content: '';
		position: absolute;
		background: var(--tooltip-bg);
		-webkit-backdrop-filter: var(--frost);
		backdrop-filter: var(--frost);
		pointer-events: none;
	}
	.tooltip--top::after {
		top: 100%;
		left: 50%;
		width: 14px;
		height: 7px;
		transform: translateX(-50%);
		clip-path: polygon(0 0, 100% 0, 50% 100%);
	}
	.tooltip--bottom::after {
		bottom: 100%;
		left: 50%;
		width: 14px;
		height: 7px;
		transform: translateX(-50%);
		clip-path: polygon(50% 0, 0 100%, 100% 100%);
	}
	.tooltip--left::after {
		left: 100%;
		top: 50%;
		width: 7px;
		height: 14px;
		transform: translateY(-50%);
		clip-path: polygon(0 0, 0 100%, 100% 50%);
	}
	.tooltip--right::after {
		right: 100%;
		top: 50%;
		width: 7px;
		height: 14px;
		transform: translateY(-50%);
		clip-path: polygon(100% 0, 0 50%, 100% 100%);
	}

	.tooltip--variant-shadow,
	.tooltip--variant-border {
		--tooltip-bg: rgb(var(--background) / 0.82);
		color: rgb(var(--c));
	}
	.tooltip--variant-shadow {
		filter: drop-shadow(0 2px 10px rgb(0 0 0 / var(--shadow-opacity)));
	}
	.tooltip--variant-border {
		border: 2px solid rgb(var(--c));
	}

	.tooltip__spinner {
		display: inline-flex;
		align-items: center;
		justify-content: center;
	}
</style>
