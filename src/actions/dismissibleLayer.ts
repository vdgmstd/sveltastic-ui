import type { Action } from 'svelte/action';
import { dismissStack, type LayerBehavior } from '../state/layerStack.svelte';

export type DismissibleLayerOptions = {
	/** Skip registration entirely while true. */
	disabled?: boolean;
	/** Treat pointerdown inside this extra node as inside the layer (e.g. the trigger that opened it). */
	anchor?: HTMLElement | null;
	/** Called when this layer is the one chosen to dismiss on an outside pointerdown. */
	onDismiss?: (event: PointerEvent) => void;
};

let listenerCount = 0;
let listenerController: AbortController | null = null;

function handlePointerdown(event: PointerEvent): void {
	dismissStack.dispatch(event);
}

function attachListener(): void {
	if (typeof document === 'undefined') return;
	listenerCount += 1;
	if (listenerController) return;
	listenerController = new AbortController();
	document.addEventListener('pointerdown', handlePointerdown, {
		capture: true,
		signal: listenerController.signal
	});
}

function detachListener(): void {
	listenerCount -= 1;
	if (listenerCount > 0) return;
	listenerController?.abort();
	listenerController = null;
}

/** Route outside-pointerdown through the global layer stack so only the top-most layer dismisses; a pointerdown inside the layer or its anchor never dismisses. */
export const dismissibleLayer: Action<HTMLElement, DismissibleLayerOptions | undefined> = (
	node,
	initial
) => {
	let opts: DismissibleLayerOptions = initial ?? {};
	let registered = false;

	function isInside(event: Event): boolean {
		const target = event.target as Node | null;
		if (!target) return false;
		if (node.contains(target)) return true;
		if (opts.anchor?.contains(target)) return true;
		return dismissStack.hasNodeAbove(layer, target);
	}

	const layer = {
		id: Symbol('dismissible-layer'),
		node,
		behavior: (): LayerBehavior => 'close',
		act: (event: Event): void => {
			if (isInside(event)) return;
			opts.onDismiss?.(event as PointerEvent);
		}
	};

	function register(): void {
		if (registered) return;
		dismissStack.register(layer);
		attachListener();
		registered = true;
	}

	function deregister(): void {
		if (!registered) return;
		dismissStack.deregister(layer);
		detachListener();
		registered = false;
	}

	if (!opts.disabled) register();

	return {
		update(next) {
			opts = next ?? {};
			if (opts.disabled) deregister();
			else register();
		},
		destroy() {
			deregister();
		}
	};
};
