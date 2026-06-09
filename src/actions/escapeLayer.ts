import type { Action } from 'svelte/action';
import { escapeStack, type LayerBehavior } from '../state/layerStack.svelte';

export type EscapeLayerOptions = {
	/** Skip registration entirely while true. */
	disabled?: boolean;
	/** How this layer responds when it is the responsible (topmost-acting) layer. Default `close`. */
	behavior?: LayerBehavior;
	/** Called when this layer is the one chosen to act on Escape. */
	onEscape?: (event: KeyboardEvent) => void;
};

let listenerCount = 0;
let listenerController: AbortController | null = null;

function handleKeydown(event: KeyboardEvent): void {
	if (event.key !== 'Escape') return;
	escapeStack.dispatch(event);
}

function attachListener(): void {
	if (typeof document === 'undefined') return;
	listenerCount += 1;
	if (listenerController) return;
	listenerController = new AbortController();
	document.addEventListener('keydown', handleKeydown, {
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

/** Route Escape through the global layer stack so only the responsible top-most layer closes per key. */
export const escapeLayer: Action<HTMLElement, EscapeLayerOptions | undefined> = (_node, initial) => {
	let opts: EscapeLayerOptions = initial ?? {};
	let registered = false;

	const layer = {
		id: Symbol('escape-layer'),
		behavior: (): LayerBehavior => opts.behavior ?? 'close',
		act: (event: Event): void => opts.onEscape?.(event as KeyboardEvent)
	};

	function register(): void {
		if (registered) return;
		escapeStack.register(layer);
		attachListener();
		registered = true;
	}

	function deregister(): void {
		if (!registered) return;
		escapeStack.deregister(layer);
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
