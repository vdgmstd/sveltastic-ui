import type { Action } from 'svelte/action';

export type ClickOutsideOptions = {
	/** Callback fired when a pointer event lands outside the node. */
	handler: (event: PointerEvent | MouseEvent) => void;
	/** Disable the listener. */
	disabled?: boolean;
	/** Optional list of additional roots to consider as "inside" (e.g. a separate trigger button). */
	include?: Array<HTMLElement | null | undefined>;
};

export const clickOutside: Action<HTMLElement, ClickOutsideOptions> = (node, initial) => {
	let opts = initial;
	const ac = new AbortController();
	const { signal } = ac;

	function handle(event: PointerEvent | MouseEvent): void {
		if (opts.disabled) return;
		const target = event.target as Node | null;
		if (!target) return;
		if (node.contains(target)) return;
		for (const extra of opts.include ?? []) {
			if (extra && extra.contains(target)) return;
		}
		opts.handler(event);
	}

	document.addEventListener('pointerdown', handle, { signal, capture: true });

	return {
		update(next) {
			opts = next;
		},
		destroy() {
			ac.abort();
		}
	};
};
