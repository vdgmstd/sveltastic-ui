import type { Action } from 'svelte/action';

export type FocusTrapOptions = {
	/** Disable trapping. */
	disabled?: boolean;
	/** Element that should receive focus when the trap activates. Defaults to the first tabbable. */
	initialFocus?: HTMLElement;
	/** Element to focus when the trap deactivates. Defaults to whatever was focused before activation. */
	returnFocus?: HTMLElement;
};

const FOCUSABLE = [
	'a[href]',
	'area[href]',
	'input:not([disabled]):not([type="hidden"])',
	'select:not([disabled])',
	'textarea:not([disabled])',
	'button:not([disabled])',
	'iframe',
	'object',
	'embed',
	'[tabindex]:not([tabindex="-1"])',
	'[contenteditable]:not([contenteditable="false"])'
].join(',');

export const focusTrap: Action<HTMLElement, FocusTrapOptions | undefined> = (node, initial) => {
	let opts = initial ?? {};
	const ac = new AbortController();
	const { signal } = ac;
	const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;

	function tabbables(): HTMLElement[] {
		return Array.from(node.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
			(el) => !el.hasAttribute('disabled') && el.offsetParent !== null
		);
	}

	function handleKey(event: KeyboardEvent): void {
		if (opts.disabled) return;
		if (event.key !== 'Tab') return;
		const items = tabbables();
		if (items.length === 0) {
			event.preventDefault();
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

	function activate(): void {
		const target = opts.initialFocus ?? tabbables()[0] ?? node;
		target.focus({ preventScroll: true });
	}

	if (!opts.disabled) {
		queueMicrotask(activate);
	}
	node.addEventListener('keydown', handleKey, { signal });

	return {
		update(next) {
			const wasDisabled = opts.disabled;
			opts = next ?? {};
			if (wasDisabled && !opts.disabled) queueMicrotask(activate);
		},
		destroy() {
			ac.abort();
			const ret = opts.returnFocus ?? previouslyFocused;
			ret?.focus({ preventScroll: true });
		}
	};
};
