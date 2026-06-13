import type { Action } from 'svelte/action';

export type PortalTarget = HTMLElement | string | undefined;

/** `target` chooses the portal parent; `disabled` leaves the node in place (bits-ui `Portal disabled`). */
export type PortalOptions = { target?: PortalTarget; disabled?: boolean };

type PortalArg = PortalTarget | PortalOptions;

function normalize(arg: PortalArg): { target: PortalTarget; disabled: boolean } {
	if (arg && typeof arg === 'object' && !(arg instanceof HTMLElement)) {
		return { target: arg.target, disabled: arg.disabled ?? false };
	}
	return { target: arg, disabled: false };
}

/** Move the node to a different DOM parent (default: `document.body`); `disabled` keeps it in place. Restores location on destroy. */
export const portal: Action<HTMLElement, PortalArg> = (node, arg) => {
	let placeholder: Comment | null = null;
	let parent: HTMLElement | null = null;
	let mounted = false;

	function resolve(t: PortalTarget): HTMLElement {
		if (t instanceof HTMLElement) return t;
		if (typeof t === 'string') {
			const el = document.querySelector(t);
			if (el instanceof HTMLElement) return el;
		}
		return document.body;
	}

	function mount(t: PortalTarget): void {
		parent = resolve(t);
		placeholder = document.createComment('portal');
		node.parentNode?.insertBefore(placeholder, node);
		parent.appendChild(node);
		mounted = true;
	}

	function unmount(): void {
		placeholder?.remove();
		if (mounted) node.remove();
		placeholder = null;
		parent = null;
		mounted = false;
	}

	const init = normalize(arg);
	if (!init.disabled) mount(init.target);

	return {
		update(next) {
			const { target, disabled } = normalize(next);
			if (disabled) {
				if (mounted) unmount();
				return;
			}
			if (mounted && resolve(target) === parent) return;
			unmount();
			mount(target);
		},
		destroy() {
			unmount();
		}
	};
};
