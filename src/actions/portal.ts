import type { Action } from 'svelte/action';

export type PortalTarget = HTMLElement | string | undefined;

/** Move the node to a different DOM parent (default: `document.body`). Restores location on destroy. */
export const portal: Action<HTMLElement, PortalTarget> = (node, target) => {
	let placeholder: Comment | null = null;
	let parent: HTMLElement | null = null;

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
	}

	function unmount(): void {
		placeholder?.remove();
		node.remove();
		placeholder = null;
		parent = null;
	}

	mount(target);

	return {
		update(next) {
			if (resolve(next) === parent) return;
			unmount();
			mount(next);
		},
		destroy() {
			unmount();
		}
	};
};
