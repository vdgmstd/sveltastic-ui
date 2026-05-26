<script lang="ts" module>
	import type { Snippet } from 'svelte';

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

	export type PopoverProps = {
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
	import { clickOutside } from '../actions/clickOutside';
	import { watchAnchor } from '../utils/anchor';
	import { nextId } from '../state/ids.svelte';
	import { cn } from '../utils/cn';

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
		trigger,
		header,
		children,
		footer,
		onopenchange,
		class: className,
		style: userStyle
	}: PopoverProps = $props();

	const popupId = nextId('popover');
	const anchorName = `--popover-anchor-${nextId('a')}`;

	let triggerEl = $state<HTMLDivElement>();
	let popupEl = $state<HTMLDivElement>();
	let coords = $state({ x: 0, y: 0 });
	let triggerWidth = $state(0);
	let resolvedPlacement = $state<PopoverPlacement>(untrack(() => placement));
	let visible = $state(false);
	let returnFocusEl: HTMLElement | null = null;
	let pendingFocus = false;
	let hoverCloseTimer: number | undefined;
	let currentSide: 'top' | 'bottom' | null = null;
	let currentAlign: 'start' | 'center' | 'end' | null = null;

	let supportsAnchor = $state(false);
	let supportsPopover = $state(false);

	$effect(() => {
		if (typeof window === 'undefined') return;
		supportsAnchor =
			typeof CSS !== 'undefined' &&
			CSS.supports('position-anchor: --x') &&
			CSS.supports('top: anchor(bottom)');
		supportsPopover =
			typeof HTMLElement !== 'undefined' && 'popover' in HTMLElement.prototype;
	});

	let closeOnOutside = $derived(closeOnClickOutside ?? triggerOn !== 'manual');

	function setOpen(next: boolean): void {
		if (disabled) return;
		if (open === next) return;
		if (next) returnFocusEl = (document.activeElement as HTMLElement | null) ?? null;
		open = next;
		onopenchange?.(next);
		if (!next) restoreFocusOnClose();
	}

	function restoreFocusOnClose(): void {
		const focusInside = popupEl?.contains(document.activeElement);
		if (focusInside && returnFocusEl?.isConnected) returnFocusEl.focus();
		returnFocusEl = null;
		pendingFocus = false;
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
		} else if (e.key === 'Escape' && closeOnEsc) {
			close();
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
		const t = triggerEl.getBoundingClientRect();
		const pw = popupEl.offsetWidth;
		const ph = popupEl.offsetHeight;
		const vh = window.innerHeight;
		const vw = window.innerWidth;
		const margin = 8;

		triggerWidth = t.width;

		const wantsTop = placement.startsWith('top');
		const wantsAlign: 'start' | 'center' | 'end' = placement.endsWith('-end')
			? 'end'
			: placement === 'top' || placement === 'bottom'
				? 'center'
				: 'start';

		const spaceBelow = vh - t.bottom - margin;
		const spaceAbove = t.top - margin;

		if (currentSide === null) {
			currentSide = wantsTop !== (spaceAbove < ph && spaceBelow > spaceAbove) ? 'top' : 'bottom';
		} else {
			const cur = currentSide === 'top' ? spaceAbove : spaceBelow;
			const opp = currentSide === 'top' ? spaceBelow : spaceAbove;
			if (cur < ph && opp > cur) currentSide = currentSide === 'top' ? 'bottom' : 'top';
		}

		const startFits = t.left + pw <= vw - margin;
		const endFits = t.right - pw >= margin;
		if (currentAlign === null) {
			let initial = wantsAlign;
			if (initial === 'start' && !startFits && endFits) initial = 'end';
			else if (initial === 'end' && !endFits && startFits) initial = 'start';
			currentAlign = initial;
		} else if (currentAlign === 'start' && !startFits && endFits) {
			currentAlign = 'end';
		} else if (currentAlign === 'end' && !endFits && startFits) {
			currentAlign = 'start';
		}

		const sideTop = currentSide === 'top';
		const align = currentAlign;

		const y = sideTop ? t.top - ph - offset : t.bottom + offset;
		const x =
			align === 'end'
				? t.right - pw
				: align === 'center'
					? t.left + (t.width - pw) / 2
					: t.left;

		coords = { x, y };
		const alignKey = align === 'center' ? '' : `-${align}`;
		resolvedPlacement = `${sideTop ? 'top' : 'bottom'}${alignKey}` as PopoverPlacement;
	}

	$effect(() => {
		if (!open) {
			currentSide = null;
			currentAlign = null;
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
			requestAnimationFrame(() => focusFirstItem());
		}
		return stop;
	});

	$effect(() => () => clearHoverClose());

	function handleEsc(e: KeyboardEvent): void {
		if (e.key === 'Escape' && open && closeOnEsc) close();
	}
	$effect(() => {
		if (!open || !closeOnEsc) return;
		document.addEventListener('keydown', handleEsc);
		return () => document.removeEventListener('keydown', handleEsc);
	});

	function getMenuItems(): HTMLElement[] {
		if (!popupEl) return [];
		return Array.from(
			popupEl.querySelectorAll<HTMLElement>(
				'button:not(:disabled):not([aria-disabled="true"]),a[href]:not([aria-disabled="true"]),[role="menuitem"]:not([aria-disabled="true"]),[role="option"]:not([aria-disabled="true"])'
			)
		);
	}

	function focusFirstItem(): void {
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
		} else if (e.key === 'Tab') {
			close();
		}
	}

	function handleBodyClick(e: MouseEvent): void {
		if (!closeOnSelect) return;
		const t = e.target as HTMLElement | null;
		if (!t) return;
		if (t.closest('button, a, [role="menuitem"], [role="option"], [data-popover-close]')) close();
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
				if (params.variant === 'spring')
					return `${op}transform:scale(${0.4 + 0.6 * t});`;
				return `${op}transform:scale(${0.92 + 0.08 * t});`;
			}
		};
	}

	let popupAriaRole = $derived(popupRole === 'none' ? undefined : popupRole);
</script>

<!-- svelte-ignore a11y_no_noninteractive_tabindex — the anchor takes role="combobox"/"button" and is the keyboard target for the popover; Svelte's static check doesn't follow the dynamic role. -->
<div
	bind:this={triggerEl}
	class={cn('popover-anchor', block && 'popover-anchor--block', className)}
	style:anchor-name={anchorName}
	style={userStyle}
	role={triggerRole}
	tabindex={triggerRole === 'combobox' && !disabled ? 0 : -1}
	aria-haspopup={popupAriaRole}
	aria-expanded={popupAriaRole ? open : undefined}
	aria-controls={popupAriaRole && open ? popupId : undefined}
	onclick={handleTriggerClick}
	onkeydown={handleTriggerKeydown}
	onmouseenter={handleEnter}
	onmouseleave={handleLeave}
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
		aria-orientation={popupRole === 'menu' ? 'vertical' : undefined}
		tabindex="-1"
		style:--popover-anchor-name={anchorName}
		style:--popover-offset="{offset}px"
		style:--popover-coord-x={!supportsAnchor ? `${coords.x}px` : null}
		style:--popover-coord-y={!supportsAnchor ? `${coords.y}px` : null}
		style:width={matchWidth && triggerWidth ? `${triggerWidth}px` : null}
		style:visibility={visible ? null : 'hidden'}
		use:portal
		use:clickOutside={{
			handler: () => closeOnOutside && close(),
			disabled: !closeOnOutside,
			include: triggerEl ? [triggerEl] : []
		}}
		onmouseenter={handleEnter}
		onmouseleave={handleLeave}
		onkeydown={handlePopupKey}
		in:popoverMotion={{ variant: openAnim, placement: resolvedPlacement }}
		out:popoverMotion={{ variant: openAnim, placement: resolvedPlacement }}
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
		padding: 6px;
		display: flex;
		flex-direction: column;
		gap: 4px;
		background: rgb(var(--gray-2) / 0.52);
		-webkit-backdrop-filter: var(--frost);
		backdrop-filter: var(--frost);
		color: rgb(var(--text));
		border: 0;
		border-radius: 20px;
		box-shadow:
			0 0 0 1px rgb(var(--text) / 0.06),
			0 14px 32px -6px rgb(0 0 0 / 0.22),
			0 5px 12px -2px rgb(0 0 0 / 0.1);
		will-change: transform, opacity;
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
		gap: 2px;
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
