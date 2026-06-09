/** How a layer responds when it is the responsible (topmost-acting) layer for an event. */
export type LayerBehavior = 'close' | 'defer-otherwise-close' | 'ignore';

export type Layer = {
	id: symbol;
	behavior: (event?: Event) => LayerBehavior;
	act: (event: Event) => void;
	/** Root node — lets a pointerdown landing in a nested portaled child count as 'inside'. */
	node?: HTMLElement | null;
};

class LayerStack {
	#layers: Layer[] = [];
	#suppressEventOnAct: boolean;

	constructor(suppressEventOnAct = false) {
		this.#suppressEventOnAct = suppressEventOnAct;
	}

	register(layer: Layer): void {
		this.#layers.push(layer);
	}

	deregister(layer: Layer): void {
		const i = this.#layers.indexOf(layer);
		if (i >= 0) this.#layers.splice(i, 1);
	}

	/** True when `target` sits inside any layer registered ABOVE `layer` (a nested portaled child). */
	hasNodeAbove(layer: Layer, target: Node | null): boolean {
		if (!target) return false;
		const i = this.#layers.indexOf(layer);
		if (i < 0) return false;
		for (let j = i + 1; j < this.#layers.length; j++) {
			if (this.#layers[j].node?.contains(target)) return true;
		}
		return false;
	}

	/** Walk from the top: the first non-`ignore` layer is responsible and acts; `defer-otherwise-close` passes to the layer below if one is eligible. */
	dispatch(event: Event): void {
		for (let i = this.#layers.length - 1; i >= 0; i--) {
			const layer = this.#layers[i];
			const behavior = layer.behavior(event);
			if (behavior === 'ignore') continue;
			if (behavior === 'defer-otherwise-close') {
				const below = this.#layers.slice(0, i).some((l) => l.behavior(event) !== 'ignore');
				if (below) continue;
			}
			layer.act(event);
			if (this.#suppressEventOnAct) {
				if (event.cancelable) event.preventDefault();
				event.stopImmediatePropagation();
			}
			return;
		}
	}
}

/** Escape arbitration: one Escape closes only the responsible top layer, and suppresses the native `<dialog>` cancel + app handlers. */
export const escapeStack = new LayerStack(true);

/** Outside-pointerdown arbitration: one outside click dismisses only the responsible top layer. */
export const dismissStack = new LayerStack(false);
