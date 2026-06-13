<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import type { Variant, Shape, Color, WithElementRef } from '../../types';

	export type TooltipContentProps = WithElementRef<
		Omit<HTMLAttributes<HTMLDivElement>, 'children'> & {
			/** Visual variant. Only `default` / `shadow` / `border` are styled. */
			variant?: Variant;
			/** Border radius shape. */
			shape?: Shape;
			/** Spinner overlay. */
			loading?: boolean;
			/** Palette color — overrides the Root color for this bubble. */
			color?: Color;
			/** Accessible label for the bubble. */
			ariaLabel?: string;
			/** Tooltip body — Content has no render-delegation; the kit-owned bubble carries all anchoring/dismiss/transition wiring. */
			children?: Snippet;
		},
		HTMLDivElement
	>;
</script>

<script lang="ts">
	import { fade } from 'svelte/transition';
	import { createAttachmentKey } from 'svelte/attachments';
	import { portal } from '../../actions/portal';
	import { escapeLayer } from '../../actions/escapeLayer';
	import { dismissibleLayer } from '../../actions/dismissibleLayer';
	import { rgbTriplet } from '../../utils/color';
	import { cn } from '../../utils/cn';
	import { mergeProps } from '../../utils/mergeProps';
	import { attachRef } from '../../utils/ref';
	import { dataState } from '../../utils/attrs';
	import { watchAnchor, computeSidePosition } from '../../utils/anchor';
	import Spinner from '../../primitives/Spinner.svelte';
	import { getTooltipCtx } from './context';

	let {
		ref = $bindable(null),
		class: className,
		style: userStyle,
		variant = 'default',
		shape = 'default',
		loading = false,
		color,
		ariaLabel,
		children,
		...rest
	}: TooltipContentProps = $props();
	const root = getTooltipCtx();

	const bubbleId = $props.id();
	root.bubbleId = bubbleId;

	let triplet = $derived(color !== undefined ? rgbTriplet(color) : root.triplet);
	let spinnerColor = $derived(variant === 'default' ? 'background' : (color ?? root.color));

	let bubbleEl = $state<HTMLDivElement | null>(null);
	let coords = $state({ x: 0, y: 0 });
	let visible = $state(false);
	let supportsPopover = $state(false);

	const refKey = createAttachmentKey();

	$effect(() => {
		supportsPopover = typeof HTMLElement !== 'undefined' && 'popover' in HTMLElement.prototype;
	});

	function reposition(): void {
		if (!root.triggerRef || !bubbleEl) return;
		coords = computeSidePosition(root.triggerRef, bubbleEl, root.placement);
		visible = true;
	}

	$effect(() => {
		if (!root.open) {
			// forceMount keeps the bubble mounted; hide it on close instead of relying on unmount.
			if (root.portal.forceMount) {
				visible = false;
				if (supportsPopover && bubbleEl?.popover && bubbleEl.matches(':popover-open')) {
					try {
						bubbleEl.hidePopover();
					} catch {
						/* already hidden */
					}
				}
			}
			return;
		}
		if (!root.triggerRef || !bubbleEl) return;
		// Hide only until positioned for THIS open; never on close, or visibility:hidden would kill the out:fade.
		visible = false;
		// Join the top layer so the bubble paints above a modal <dialog> (showModal); plain z-index can't beat it.
		if (supportsPopover && bubbleEl.popover) {
			try {
				bubbleEl.showPopover();
			} catch {
				/* already shown */
			}
		}
		return watchAnchor(root.triggerRef, bubbleEl, reposition);
	});

	const attrs = $derived({
		id: bubbleId,
		class: cn('tooltip', className),
		role: 'tooltip' as const,
		'aria-label': ariaLabel,
		'data-placement': root.placement,
		'data-variant': variant,
		'data-shape': shape,
		'data-state': dataState(root.open ? 'open' : 'closed'),
		'data-testid': 'tooltip'
	});
	const merged = $derived(
		mergeProps(rest, attrs, {
			style: userStyle,
			[refKey]: attachRef<HTMLDivElement>((n) => {
				bubbleEl = n;
				ref = n;
			})
		})
	);
</script>

{#if root.open || root.portal.forceMount}
	<div
		{...merged}
		popover={supportsPopover ? 'manual' : undefined}
		style:--c={triplet}
		style:left="{coords.x}px"
		style:top="{coords.y}px"
		style:visibility={visible ? null : 'hidden'}
		use:portal={{ target: root.portal.target, disabled: root.portal.disabled }}
		use:escapeLayer={{ disabled: root.trigger === 'manual', onEscape: () => root.setOpen(false) }}
		use:dismissibleLayer={{
			disabled: root.trigger !== 'click',
			anchor: root.triggerRef,
			onDismiss: () => root.setOpen(false)
		}}
		onmouseenter={root.bubbleEnter}
		onmouseleave={root.bubbleLeave}
		transition:fade={{ duration: 150 }}
		onoutroend={() => root.completeClose()}
	>
		{#if loading}
			<span class="tooltip__spinner" aria-hidden="true">
				<Spinner color={spinnerColor} size={16} thickness={2} speed={800} />
			</span>
		{:else}
			{@render children?.()}
		{/if}
	</div>
{/if}

<style>
	.tooltip {
		--c: var(--dark);
		--tooltip-bg: rgb(var(--c) / 0.92);
		position: fixed;
		z-index: 100000;
		max-width: 350px;
		min-width: 30px;
		min-height: 30px;
		padding: var(--space-3) var(--space-6);
		font-size: var(--fs-md);
		text-align: center;
		background: var(--tooltip-bg);
		color: rgb(var(--light));
		border-radius: var(--rad-md);
		-webkit-user-select: none;
		user-select: none;
		-webkit-backdrop-filter: var(--frost);
		backdrop-filter: var(--frost);
	}
	.tooltip[popover] {
		inset: auto;
		margin: 0;
		overflow: visible;
	}
	.tooltip[popover]::backdrop {
		background: transparent;
	}
	:global([data-theme='dark']) .tooltip[data-variant='default'] {
		box-shadow: 0 0 0 1px rgb(255 255 255 / 0.08), 0 8px 24px -8px rgb(0 0 0 / 0.6);
	}
	.tooltip[data-shape='circle'] { border-radius: var(--rad-pill); }
	.tooltip[data-shape='square'] { border-radius: 0; }

	.tooltip[data-variant='shadow'],
	.tooltip[data-variant='border'] {
		--tooltip-bg: rgb(var(--background) / 0.82);
		color: rgb(var(--c));
	}
	.tooltip[data-variant='shadow'] {
		filter: drop-shadow(0 2px 10px rgb(0 0 0 / var(--shadow-opacity)));
	}
	.tooltip[data-variant='border'] {
		border: 2px solid rgb(var(--c));
	}

	.tooltip__spinner {
		display: inline-flex;
		align-items: center;
		justify-content: center;
	}
</style>
