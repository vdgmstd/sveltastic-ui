<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import type { WithElementRef } from '../types';

	export type PopoverPlacement =
		| 'bottom'
		| 'bottom-start'
		| 'bottom-end'
		| 'top'
		| 'top-start'
		| 'top-end';

	export type PopoverTriggerOn = 'click' | 'hover' | 'manual';

	export type PopoverOpenAnim = 'pop' | 'slide' | 'fade' | 'spring';

	/** WAI-ARIA role for the popup. `'none'` skips role + ARIA wiring. */
	export type PopoverRole = 'menu' | 'dialog' | 'listbox' | 'none';

	/** ARIA role applied to the anchor element (the wrapper around the trigger snippet). */
	export type PopoverTriggerRole = 'button' | 'combobox';

	export type PopoverProps = WithElementRef<
		Omit<HTMLAttributes<HTMLDivElement>, 'children'>
	> & {
		/** Open state (bindable). */
		open?: boolean;
		/** Popup placement relative to the trigger. */
		placement?: PopoverPlacement;
		/** How the popover opens. `'manual'` means the consumer drives `open` directly. */
		triggerOn?: PopoverTriggerOn;
		/** Px gap between trigger and popup. */
		offset?: number;
		/** Close when pointer lands outside. Defaults to `triggerOn !== 'manual'`. */
		closeOnClickOutside?: boolean;
		/** Close on Esc key. */
		closeOnEsc?: boolean;
		/** Close when an interactive descendant is clicked inside the body. */
		closeOnSelect?: boolean;
		/** Disable interaction. */
		disabled?: boolean;
		/** Stretch the trigger anchor to its parent's width. */
		block?: boolean;
		/** Match the trigger's width on the popup. */
		matchWidth?: boolean;
		/** Open / close animation preset. */
		openAnim?: PopoverOpenAnim;
		/** Override animation duration (ms). */
		openDuration?: number;
		/** Override JS easing function (from `svelte/easing` or custom). */
		openEasing?: (t: number) => number;
		/** Popup ARIA role. */
		popupRole?: PopoverRole;
		/** ARIA role for the anchor wrapper. Defaults to `'button'`; pass `'combobox'` for select-like inputs. */
		triggerRole?: PopoverTriggerRole;
		/** Focus the first focusable on keyboard-initiated open (Enter / Space / ArrowDown). */
		autoFocus?: boolean;
		/** Trap focus + emit aria-modal. Defaults to `popupRole === 'dialog'`; pass `false` for a non-modal popup (e.g. editable date field) where focus stays in the trigger. */
		modal?: boolean;
		/** Accessible label for the popup when it has no visible heading. */
		ariaLabel?: string;
		/** Anchor / trigger content. Receives `open` for visual state sync. */
		trigger?: Snippet<[boolean]>;
		/** Sticky popup header. Receives a `close` callback. */
		header?: Snippet<[() => void]>;
		/** Popup body. Receives a `close` callback so items can dismiss the popover. */
		children?: Snippet<[() => void]>;
		/** Sticky popup footer. Receives a `close` callback. */
		footer?: Snippet<[() => void]>;
		/** Fires when `open` changes. */
		onopenchange?: (open: boolean) => void;
		/** Fires after the close transition finishes (popup fully removed). */
		onopenchangecomplete?: (open: boolean) => void;
		/** Class merged onto the anchor (trigger wrapper). */
		class?: string;
		/** Inline style merged onto the anchor (trigger wrapper). */
		style?: string;
	};
</script>

<script lang="ts">
	import { untrack } from 'svelte';
	import type { TransitionConfig } from 'svelte/transition';
	import { backOut, cubicOut } from 'svelte/easing';
	import { portal } from '../actions/portal';
	import { escapeLayer } from '../actions/escapeLayer';
	import { dismissibleLayer } from '../actions/dismissibleLayer';
	import { focusTrap } from '../actions/focusTrap';
	import { isUsingKeyboard } from '../state/isUsingKeyboard.svelte';
	import { computeAnchorPosition, watchAnchor, type AnchorFlipState } from '../utils/anchor';
	import { cn } from '../utils/cn';
	import { boolAttr, dataState } from '../utils/attrs';

	let {
		open = $bindable(false),
		placement = 'bottom-start',
		triggerOn = 'click',
		offset = 4,
		closeOnClickOutside,
		closeOnEsc = true,
		closeOnSelect = true,
		disabled = false,
		block = false,
		matchWidth = false,
		openAnim = 'pop',
		openDuration,
		openEasing,
		popupRole = 'menu',
		triggerRole = 'button',
		autoFocus = true,
		modal,
		ariaLabel,
		ref = $bindable(null),
		trigger,
		header,
		children,
		footer,
		onopenchange,
		onopenchangecomplete,
		class: className,
		style: userStyle,
		...rest
	}: PopoverProps = $props();

	const uid = $props.id();
	const popupId = `popover-${uid}`;
	const anchorName = `--popover-anchor-${uid}`;

	let triggerEl = $state<HTMLDivElement | null>(null);
	let popupEl = $state<HTMLDivElement | null>(null);
	let coords = $state({ x: 0, y: 0 });
	let triggerWidth = $state(0);
	let resolvedPlacement = $state<PopoverPlacement>(untrack(() => placement));
	let visible = $state(false);
	let returnFocusEl: HTMLElement | null = null;
	let everHeldFocus = false;
	let pendingFocus = false;
	let focusFrame = 0;
	let openedWithKeyboard = $state(false);
	let hoverCloseTimer: number | undefined;
	const flip: AnchorFlipState = { side: null, align: null };

	let supportsAnchor = $state(false);
	let supportsPopover = $state(false);

	$effect(() => {
		if (typeof window === 'undefined') return;
		supportsAnchor =
			typeof CSS !== 'undefined' &&
			CSS.supports('position-anchor: --x') &&
			CSS.supports('top: anchor(bottom)');
		supportsPopover = typeof HTMLElement !== 'undefined' && 'popover' in HTMLElement.prototype;
	});

	let closeOnOutside = $derived(closeOnClickOutside ?? triggerOn !== 'manual');
	let popupAriaRole = $derived(popupRole === 'none' ? undefined : popupRole);
	$effect(() => isUsingKeyboard.subscribe());
	let isModal = $derived(modal ?? popupRole === 'dialog');
	let trapsFocus = $derived(open && visible && isModal);
	let side = $derived<'top' | 'bottom'>(resolvedPlacement.startsWith('top') ? 'top' : 'bottom');
	let align = $derived<'start' | 'center' | 'end'>(
		resolvedPlacement.endsWith('-end')
			? 'end'
			: resolvedPlacement.endsWith('-start')
				? 'start'
				: 'center'
	);

	function setOpen(next: boolean): void {
		if (disabled) return;
		if (open === next) return;
		if (next) {
			returnFocusEl = (document.activeElement as HTMLElement | null) ?? null;
			everHeldFocus = false;
			openedWithKeyboard = isUsingKeyboard.current;
		}
		open = next;
		onopenchange?.(next);
		if (!next) restoreFocusOnClose();
	}

	function restoreFocusOnClose(): void {
		const active = document.activeElement;
		const focusOrphaned = active === document.body || active === null;
		const focusInside = popupEl?.contains(active) ?? false;
		if ((everHeldFocus || focusInside || focusOrphaned) && returnFocusEl?.isConnected) {
			returnFocusEl.focus({ preventScroll: true });
		}
		returnFocusEl = null;
		pendingFocus = false;
		everHeldFocus = false;
		openedWithKeyboard = false;
	}

	const close = () => setOpen(false);
	const openPopup = () => setOpen(true);
	const toggle = () => setOpen(!open);

	function clearHoverClose(): void {
		if (hoverCloseTimer === undefined) return;
		window.clearTimeout(hoverCloseTimer);
		hoverCloseTimer = undefined;
	}

	function handleTriggerClick(): void {
		if (triggerOn !== 'click') return;
		pendingFocus = false;
		toggle();
	}
	function handleTriggerKeydown(e: KeyboardEvent): void {
		if (triggerOn === 'manual') return;
		if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
			e.preventDefault();
			pendingFocus = true;
			openPopup();
		}
	}
	function handleEnter(): void {
		if (triggerOn !== 'hover') return;
		clearHoverClose();
		pendingFocus = false;
		openPopup();
	}
	function handleLeave(): void {
		if (triggerOn !== 'hover') return;
		clearHoverClose();
		hoverCloseTimer = window.setTimeout(() => {
			close();
			hoverCloseTimer = undefined;
		}, 140);
	}

	function reposition(): void {
		if (!triggerEl || !popupEl) return;
		const result = computeAnchorPosition(triggerEl, popupEl, placement, offset, flip);
		coords = { x: result.x, y: result.y };
		triggerWidth = result.triggerWidth;
		resolvedPlacement = result.placement;
	}

	$effect(() => {
		if (!open) {
			flip.side = null;
			flip.align = null;
			return;
		}
		visible = false;
		if (!triggerEl || !popupEl) return;

		let stop: (() => void) | undefined;
		if (supportsAnchor) {
			resolvedPlacement = placement;
			if (matchWidth) {
				const anchor = triggerEl;
				triggerWidth = anchor.getBoundingClientRect().width;
				stop = watchAnchor(anchor, popupEl, () => {
					triggerWidth = anchor.getBoundingClientRect().width;
				});
			}
		} else {
			stop = watchAnchor(triggerEl, popupEl, reposition);
		}

		if (supportsPopover && popupEl.popover) {
			try {
				popupEl.showPopover();
			} catch {
				/* already shown */
			}
		}

		visible = true;
		if (autoFocus && pendingFocus) {
			pendingFocus = false;
			focusFrame = requestAnimationFrame(() => {
				focusFrame = 0;
				if (open && visible) focusFirstItem();
			});
		}
		return () => {
			if (focusFrame) {
				cancelAnimationFrame(focusFrame);
				focusFrame = 0;
			}
			stop?.();
		};
	});

	$effect(() => () => clearHoverClose());

	function getMenuItems(): HTMLElement[] {
		if (!popupEl) return [];
		return Array.from(
			popupEl.querySelectorAll<HTMLElement>(
				'button:not(:disabled):not([aria-disabled="true"]),a[href]:not([aria-disabled="true"]),[role="menuitem"]:not([aria-disabled="true"]),[role="option"]:not([aria-disabled="true"])'
			)
		);
	}

	function focusFirstItem(): void {
		everHeldFocus = true;
		getMenuItems()[0]?.focus();
	}

	function handlePopupKey(e: KeyboardEvent): void {
		if (popupRole !== 'menu' && popupRole !== 'listbox') return;
		const items = getMenuItems();
		if (!items.length) return;
		const cur = items.indexOf(document.activeElement as HTMLElement);
		if (e.key === 'ArrowDown') {
			e.preventDefault();
			items[(cur + 1 + items.length) % items.length].focus();
		} else if (e.key === 'ArrowUp') {
			e.preventDefault();
			items[(cur - 1 + items.length) % items.length].focus();
		} else if (e.key === 'Home') {
			e.preventDefault();
			items[0].focus();
		} else if (e.key === 'End') {
			e.preventDefault();
			items[items.length - 1].focus();
		} else if (e.key === 'Tab' && !trapsFocus) {
			e.preventDefault();
			const back = returnFocusEl?.isConnected ? returnFocusEl : triggerEl;
			close();
			back?.focus({ preventScroll: true });
		}
	}

	function handleBodyClick(e: MouseEvent): void {
		if (!closeOnSelect) return;
		const t = e.target as HTMLElement | null;
		if (!t) return;
		if (t.closest('button, a, [role="menuitem"], [role="option"], [data-popover-close]')) close();
	}

	function handlePopupFocusin(): void {
		everHeldFocus = true;
	}

	const variantConfig = {
		pop: { duration: 180, easing: backOut },
		slide: { duration: 220, easing: cubicOut },
		fade: { duration: 160, easing: cubicOut },
		spring: { duration: 380, easing: backOut }
	} as const;

	function popoverMotion(
		_node: HTMLElement,
		params: { variant: PopoverOpenAnim; placement: PopoverPlacement }
	): TransitionConfig {
		const cfg = variantConfig[params.variant];
		const duration = openDuration ?? cfg.duration;
		const easing = openEasing ?? cfg.easing;
		const fromTop = params.placement.startsWith('top');
		return {
			duration,
			easing,
			css: (t, u) => {
				const op = `opacity:${t};`;
				if (params.variant === 'fade') return op;
				if (params.variant === 'slide')
					return `${op}transform:translateY(${fromTop ? 8 * u : -8 * u}px);`;
				if (params.variant === 'spring') return `${op}transform:scale(${0.4 + 0.6 * t});`;
				return `${op}transform:scale(${0.92 + 0.08 * t});`;
			}
		};
	}
</script>

<!-- Anchor takes role="combobox"/"button" and is the popover's keyboard target; the static check can't follow the dynamic role. -->
<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
<div
	{@attach (node) => {
		triggerEl = node;
		ref = node;
		return () => {
			triggerEl = null;
			ref = null;
		};
	}}
	class={cn('popover-anchor', block && 'popover-anchor--block', className)}
	style:anchor-name={anchorName}
	style={userStyle}
	role={triggerRole}
	tabindex={triggerRole === 'combobox' && !disabled ? 0 : -1}
	aria-haspopup={popupAriaRole}
	aria-expanded={popupAriaRole ? open : undefined}
	aria-controls={popupAriaRole && open ? popupId : undefined}
	data-state={dataState(open ? 'open' : 'closed')}
	data-disabled={boolAttr(disabled)}
	onclick={handleTriggerClick}
	onkeydown={handleTriggerKeydown}
	onmouseenter={handleEnter}
	onmouseleave={handleLeave}
	{...rest}
>
	{#if trigger}{@render trigger(open)}{/if}
</div>

{#if open}
	<div
		bind:this={popupEl}
		id={popupId}
		class="popover popover--{resolvedPlacement}"
		class:popover--anchored={supportsAnchor}
		popover={supportsPopover ? 'manual' : undefined}
		role={popupAriaRole ?? 'group'}
		aria-modal={popupRole === 'dialog' && trapsFocus ? 'true' : undefined}
		aria-orientation={popupRole === 'menu' ? 'vertical' : undefined}
		aria-label={ariaLabel}
		tabindex="-1"
		data-state={dataState(visible ? 'open' : 'closed')}
		data-placement={resolvedPlacement}
		data-side={side}
		data-align={align}
		style:--popover-anchor-name={anchorName}
		style:--popover-offset="{offset}px"
		style:--popover-coord-x={!supportsAnchor ? `${coords.x}px` : null}
		style:--popover-coord-y={!supportsAnchor ? `${coords.y}px` : null}
		style:width={matchWidth && triggerWidth ? `${triggerWidth}px` : null}
		style:visibility={visible ? null : 'hidden'}
		use:portal
		use:escapeLayer={{
			disabled: !closeOnEsc,
			onEscape: () => close()
		}}
		use:dismissibleLayer={{
			disabled: !closeOnOutside,
			anchor: triggerEl,
			onDismiss: () => close()
		}}
		use:focusTrap={{
			disabled: !trapsFocus,
			noAutoFocus: !openedWithKeyboard,
			noReturnFocus: true
		}}
		onmouseenter={handleEnter}
		onmouseleave={handleLeave}
		onkeydown={handlePopupKey}
		onfocusin={handlePopupFocusin}
		in:popoverMotion={{ variant: openAnim, placement: resolvedPlacement }}
		out:popoverMotion={{ variant: openAnim, placement: resolvedPlacement }}
		onoutroend={() => onopenchangecomplete?.(false)}
	>
		{#if header}
			<div class="popover__header">{@render header(close)}</div>
		{/if}
		<div class="popover__body" onclick={handleBodyClick} role="presentation">
			{#if children}{@render children(close)}{/if}
		</div>
		{#if footer}
			<div class="popover__footer">{@render footer(close)}</div>
		{/if}
	</div>
{/if}

<style>
	:where(.popover-anchor) {
		display: inline-flex;
		max-width: 100%;
		min-width: 0;
	}
	:where(.popover-anchor--block) {
		display: flex;
		width: 100%;
	}

	.popover {
		position: fixed;
		z-index: 90000;
		min-width: 180px;
		margin: 0;
		padding: var(--space-3);
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
		background: rgb(var(--gray-2) / 0.52);
		-webkit-backdrop-filter: var(--frost);
		backdrop-filter: var(--frost);
		color: rgb(var(--text));
		border: 0;
		border-radius: var(--rad-xl);
		box-shadow:
			0 0 0 1px rgb(var(--text) / 0.06),
			var(--shadow-3),
			0 5px 12px -2px rgb(0 0 0 / 0.1);
		top: var(--popover-coord-y, 0);
		left: var(--popover-coord-x, 0);
	}
	@supports not ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px))) {
		.popover {
			background: rgb(var(--gray-2));
		}
	}
	.popover[role='dialog'] {
		min-width: 0;
		padding: 0;
		gap: 0;
	}
	.popover[popover] {
		inset: auto;
		margin: 0;
		overflow: visible;
	}
	.popover[popover]:not(.popover--anchored) {
		top: var(--popover-coord-y, 0);
		left: var(--popover-coord-x, 0);
	}
	.popover[popover]::backdrop {
		background: transparent;
	}

	.popover__body {
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
		min-height: 0;
	}
	.popover__header,
	.popover__footer {
		flex-shrink: 0;
	}

	.popover--bottom-start { transform-origin: top left; }
	.popover--bottom { transform-origin: top center; }
	.popover--bottom-end { transform-origin: top right; }
	.popover--top-start { transform-origin: bottom left; }
	.popover--top { transform-origin: bottom center; }
	.popover--top-end { transform-origin: bottom right; }

	.popover--anchored {
		position-anchor: var(--popover-anchor-name);
		top: auto;
		left: auto;
		right: auto;
		bottom: auto;
		position-try-fallbacks: flip-block, flip-inline, flip-block flip-inline;
	}
	.popover--anchored.popover--bottom-start {
		top: anchor(bottom);
		left: anchor(left);
		margin-top: var(--popover-offset);
	}
	.popover--anchored.popover--bottom {
		top: anchor(bottom);
		left: anchor(center);
		translate: -50% 0;
		margin-top: var(--popover-offset);
	}
	.popover--anchored.popover--bottom-end {
		top: anchor(bottom);
		right: anchor(right);
		margin-top: var(--popover-offset);
	}
	.popover--anchored.popover--top-start {
		bottom: anchor(top);
		left: anchor(left);
		margin-bottom: var(--popover-offset);
	}
	.popover--anchored.popover--top {
		bottom: anchor(top);
		left: anchor(center);
		translate: -50% 0;
		margin-bottom: var(--popover-offset);
	}
	.popover--anchored.popover--top-end {
		bottom: anchor(top);
		right: anchor(right);
		margin-bottom: var(--popover-offset);
	}
</style>
