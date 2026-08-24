import type { Action } from 'svelte/action';

export type PortalTarget = HTMLElement | string | undefined;

/** `target` chooses the portal parent; `disabled` returns the node to its original position (bits-ui `Portal disabled`). */
export type PortalOptions = { target?: PortalTarget; disabled?: boolean };

type PortalArg = PortalTarget | PortalOptions;

function normalize(arg: PortalArg): { target: PortalTarget; disabled: boolean } {
	if (arg && typeof arg === 'object' && !(arg instanceof HTMLElement)) {
		return { target: arg.target, disabled: arg.disabled ?? false };
	}
	return { target: arg, disabled: false };
}

/**
 * Move the node to a different DOM parent. Without an explicit `target` it lands in the nearest
 * ancestor `<dialog>`, else `document.body`; `disabled` puts it back where it was declared.
 */
export const portal: Action<HTMLElement, PortalArg> = (node, arg) => {
	let placeholder: Comment | null = null;
	let parent: HTMLElement | null = null;
	let mounted = false;

	/** Where the node was declared — while mounted the placeholder holds that spot. */
	function home(): Element | null {
		return placeholder?.parentElement ?? node.parentElement;
	}

	function resolve(t: PortalTarget): HTMLElement {
		if (t instanceof HTMLElement) return t;
		if (typeof t === 'string') {
			const el = document.querySelector(t);
			if (el instanceof HTMLElement) return el;
		}
		// showModal() inerts everything outside the dialog, so an overlay declared inside one must stay inside it.
		// Matched regardless of `[open]`: that attribute is stamped by showModal() an effect flush after an overlay
		// inside an already-open dialog runs this action, and a closed dialog hides the overlay's home anyway.
		const dialog = home()?.closest('dialog');
		return dialog instanceof HTMLElement ? dialog : document.body;
	}

	function clear(): void {
		placeholder = null;
		parent = null;
		mounted = false;
	}

	function mount(t: PortalTarget): void {
		parent = resolve(t);
		placeholder = document.createComment('portal');
		node.parentNode?.insertBefore(placeholder, node);
		parent.appendChild(node);
		mounted = true;
	}

	function restore(): void {
		const spot = placeholder;
		if (spot?.parentNode) spot.parentNode.insertBefore(node, spot);
		spot?.remove();
		clear();
	}

	function detach(): void {
		placeholder?.remove();
		if (mounted) node.remove();
		clear();
	}

	const init = normalize(arg);
	if (!init.disabled) mount(init.target);

	return {
		update(next) {
			const { target, disabled } = normalize(next);
			if (disabled) {
				if (mounted) restore();
				return;
			}
			if (mounted) {
				if (resolve(target) === parent) return;
				restore();
			}
			mount(target);
		},
		destroy() {
			detach();
		}
	};
};
