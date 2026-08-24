import type { Action } from 'svelte/action';
import { focusScopeManager, type FocusScope } from '../state/focusScopeManager.svelte';

export type FocusTrapOptions = {
	/** Disable trapping. */
	disabled?: boolean;
	/** Element that should receive focus when the trap activates. Defaults to the first tabbable. */
	initialFocus?: HTMLElement;
	/** Element to focus when the trap deactivates. Defaults to whatever was focused before activation. */
	returnFocus?: HTMLElement;
	/** Cancel the auto-focus-on-mount (e.g. mouse-driven open). Listener safety net still applies. */
	noAutoFocus?: boolean;
	/** Let the consumer own focus restoration on teardown (avoids a double-restore race). */
	noReturnFocus?: boolean;
};

const CANDIDATE_SELECTOR =
	'a[href],button,input,textarea,select,details,iframe,object,embed,[tabindex],[contenteditable]';

function isVisible(el: HTMLElement): boolean {
	if (typeof el.checkVisibility === 'function') {
		return el.checkVisibility({ checkVisibilityCSS: true });
	}
	// Engines without checkVisibility (Safari < 17.4): `offsetParent` alone misses `visibility: hidden`,
	// which the kit's own Popover uses while a panel is mounted but not yet shown.
	const style = getComputedStyle(el);
	if (style.visibility === 'hidden') return false;
	return el.offsetParent !== null || style.position === 'fixed';
}

function isTabbable(el: HTMLElement): boolean {
	if (el.hasAttribute('disabled')) return false;
	if (el.getAttribute('aria-hidden') === 'true') return false;
	if (el.tabIndex < 0) return false;
	if (el instanceof HTMLInputElement && el.type === 'hidden') return false;
	return isVisible(el);
}

/** Dependency-free tabbable query via a TreeWalker — replaces the `tabbable` lib. */
function tabbables(root: HTMLElement): HTMLElement[] {
	const out: HTMLElement[] = [];
	const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT, {
		acceptNode: (node) =>
			node instanceof HTMLElement && node.matches(CANDIDATE_SELECTOR) && isTabbable(node)
				? NodeFilter.FILTER_ACCEPT
				: NodeFilter.FILTER_SKIP
	});
	let node = walker.nextNode();
	while (node) {
		out.push(node as HTMLElement);
		node = walker.nextNode();
	}
	return out;
}

export const focusTrap: Action<HTMLElement, FocusTrapOptions | undefined> = (node, initial) => {
	let opts: FocusTrapOptions = initial ?? {};
	const scope: FocusScope = { id: 'focus-trap' };
	let ac = new AbortController();
	let everActive = false;
	let previouslyFocused: HTMLElement | null = null;

	/** Focus the first candidate that actually takes it — a hidden or inert target would silently leave focus outside. */
	function focusInto(preferred?: HTMLElement): void {
		const items = tabbables(node);
		for (const candidate of preferred ? [preferred, ...items] : items) {
			candidate.focus({ preventScroll: true });
			if (node.contains(document.activeElement)) return;
		}
		node.focus({ preventScroll: true });
	}

	function handleKeydown(event: KeyboardEvent): void {
		if (opts.disabled || event.key !== 'Tab') return;
		if (!focusScopeManager.isTopmost(scope)) return;
		const items = tabbables(node);
		if (items.length === 0) {
			event.preventDefault();
			node.focus({ preventScroll: true });
			return;
		}
		const first = items[0];
		const last = items[items.length - 1];
		const active = document.activeElement;
		if (event.shiftKey && active === first) {
			event.preventDefault();
			last.focus();
		} else if (!event.shiftKey && active === last) {
			event.preventDefault();
			first.focus();
		}
	}

	function handleFocusin(event: FocusEvent): void {
		if (opts.disabled) return;
		if (!focusScopeManager.isTopmost(scope)) return;
		const target = event.target as Node | null;
		if (target && node.contains(target)) return;
		event.stopImmediatePropagation();
		focusInto();
	}

	function start(): void {
		everActive = true;
		const active = document.activeElement;
		if (active instanceof HTMLElement && !node.contains(active)) previouslyFocused = active;
		ac = new AbortController();
		focusScopeManager.register(scope);
		document.addEventListener('focusin', handleFocusin, { capture: true, signal: ac.signal });
		node.addEventListener('keydown', handleKeydown, { signal: ac.signal });
		const observer = new MutationObserver(() => {
			if (!focusScopeManager.isTopmost(scope)) return;
			if (!node.contains(document.activeElement)) focusInto();
		});
		observer.observe(node, { childList: true, subtree: true });
		ac.signal.addEventListener('abort', () => observer.disconnect());
		if (!opts.noAutoFocus) queueMicrotask(() => focusInto(opts.initialFocus));
	}

	function stop(): void {
		ac.abort();
		focusScopeManager.deregister(scope);
	}

	if (!opts.disabled) start();

	return {
		update(next) {
			const wasDisabled = opts.disabled;
			opts = next ?? {};
			if (wasDisabled && !opts.disabled) start();
			else if (!wasDisabled && opts.disabled) stop();
		},
		destroy() {
			stop();
			if (!everActive || opts.noReturnFocus) return;
			const ret = opts.returnFocus ?? previouslyFocused;
			if (ret?.isConnected) ret.focus({ preventScroll: true });
		}
	};
};
