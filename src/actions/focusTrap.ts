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

function isTabbable(el: HTMLElement): boolean {
	if (el.hasAttribute('disabled')) return false;
	if (el.getAttribute('aria-hidden') === 'true') return false;
	if (el.tabIndex < 0) return false;
	if (el instanceof HTMLInputElement && el.type === 'hidden') return false;
	if (el.offsetParent === null && getComputedStyle(el).position !== 'fixed') return false;
	return true;
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
	const previouslyFocused =
		document.activeElement instanceof HTMLElement ? document.activeElement : null;

	function homeFocus(): void {
		const items = tabbables(node);
		(items[0] ?? node).focus({ preventScroll: true });
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
		homeFocus();
	}

	function activate(): void {
		const target = opts.initialFocus ?? tabbables(node)[0] ?? node;
		target.focus({ preventScroll: true });
	}

	function start(): void {
		everActive = true;
		ac = new AbortController();
		focusScopeManager.register(scope);
		document.addEventListener('focusin', handleFocusin, { capture: true, signal: ac.signal });
		node.addEventListener('keydown', handleKeydown, { signal: ac.signal });
		const observer = new MutationObserver(() => {
			if (!focusScopeManager.isTopmost(scope)) return;
			if (!node.contains(document.activeElement)) homeFocus();
		});
		observer.observe(node, { childList: true, subtree: true });
		ac.signal.addEventListener('abort', () => observer.disconnect());
		if (!opts.noAutoFocus) queueMicrotask(activate);
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
