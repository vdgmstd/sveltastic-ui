import { untrack } from 'svelte';
import { SvelteMap } from 'svelte/reactivity';

export type Orientation = 'horizontal' | 'vertical' | 'both';
export type Direction = 'ltr' | 'rtl';

export type RovingFocusOptions = {
	orientation?: Orientation;
	dir?: Direction;
	/** Wrap from last to first and vice-versa. */
	loop?: boolean;
};

type DirectionalKeys = { next: string[]; prev: string[]; first: string; last: string };

/** Arrow keys that move next/prev for a given orientation and text direction (RTL swaps Left/Right). */
export function getDirectionalKeys(orientation: Orientation, dir: Direction): DirectionalKeys {
	const forwardInline = dir === 'rtl' ? 'ArrowLeft' : 'ArrowRight';
	const backwardInline = dir === 'rtl' ? 'ArrowRight' : 'ArrowLeft';
	const next: string[] = [];
	const prev: string[] = [];
	if (orientation === 'horizontal' || orientation === 'both') {
		next.push(forwardInline);
		prev.push(backwardInline);
	}
	if (orientation === 'vertical' || orientation === 'both') {
		next.push('ArrowDown');
		prev.push('ArrowUp');
	}
	return { next, prev, first: 'Home', last: 'End' };
}

/** Composite-widget roving tabindex: one element in the page Tab order, arrows move within. */
class RovingFocus {
	#nodes = new SvelteMap<string, HTMLElement>();
	#disabled = new SvelteMap<string, () => boolean>();
	#order: string[] = $state([]);
	#current = $state<string | null>(null);
	orientation: Orientation;
	dir: Direction;
	loop: boolean;

	constructor(options?: RovingFocusOptions) {
		this.orientation = options?.orientation ?? 'horizontal';
		this.dir = options?.dir ?? 'ltr';
		this.loop = options?.loop ?? false;
	}

	get current(): string | null {
		return this.#current;
	}

	/** Register an item (untracked R-M-W to avoid a register/deregister effect loop); pass `isDisabled` for reactive disabled tracking, else `#enabledIds` reads DOM attrs untracked. */
	register(id: string, node: HTMLElement, isDisabled?: () => boolean): () => void {
		untrack(() => {
			if (this.#nodes.has(id)) {
				throw new Error(
					`Roving focus: duplicate item id "${id}". Each item value must be unique within its parent.`
				);
			}
			this.#nodes.set(id, node);
			if (isDisabled) this.#disabled.set(id, isDisabled);
			if (!this.#order.includes(id)) this.#order.push(id);
		});
		return () => this.deregister(id);
	}

	deregister(id: string): void {
		untrack(() => {
			this.#nodes.delete(id);
			this.#disabled.delete(id);
			const i = this.#order.indexOf(id);
			if (i >= 0) this.#order.splice(i, 1);
			if (this.#current === id) this.#current = null;
		});
	}

	/** Explicitly mark an item as the current tab-stop. */
	setCurrent(id: string): void {
		this.#current = id;
	}

	#enabledIds(): string[] {
		const ids = this.#order.filter((id) => {
			const node = this.#nodes.get(id);
			if (!node) return false;
			const isDisabled = this.#disabled.get(id);
			if (isDisabled) return !isDisabled();
			if (node.hasAttribute('data-disabled') || node.hasAttribute('disabled')) return false;
			if (node.getAttribute('aria-disabled') === 'true' || node.hasAttribute('inert')) return false;
			return true;
		});
		ids.sort((a, b) => {
			const na = this.#nodes.get(a);
			const nb = this.#nodes.get(b);
			if (!na || !nb) return 0;
			return na.compareDocumentPosition(nb) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1;
		});
		return ids;
	}

	/** Tabindex for an item: 0 for the active stop (or the first enabled when current is unset/disabled), -1 otherwise. */
	tabindexFor(id: string): 0 | -1 {
		const ids = this.#enabledIds();
		if (this.#current !== null && ids.includes(this.#current)) {
			return this.#current === id ? 0 : -1;
		}
		return ids[0] === id ? 0 : -1;
	}

	#focus(id: string): void {
		this.#current = id;
		this.#nodes.get(id)?.focus();
	}

	/** Map a keydown to the next/prev/first/last enabled item and move focus. Returns true if handled. */
	handleKeydown(event: KeyboardEvent, from: string): boolean {
		const keys = getDirectionalKeys(this.orientation, this.dir);
		const ids = this.#enabledIds();
		if (ids.length === 0) return false;
		const i = ids.indexOf(from);

		if (keys.next.includes(event.key)) {
			event.preventDefault();
			const at = i === -1 ? 0 : i + 1;
			const next = at >= ids.length ? (this.loop ? 0 : ids.length - 1) : at;
			this.#focus(ids[next]);
			return true;
		}
		if (keys.prev.includes(event.key)) {
			event.preventDefault();
			const at = i === -1 ? ids.length - 1 : i - 1;
			const prev = at < 0 ? (this.loop ? ids.length - 1 : 0) : at;
			this.#focus(ids[prev]);
			return true;
		}
		if (event.key === keys.first) {
			event.preventDefault();
			this.#focus(ids[0]);
			return true;
		}
		if (event.key === keys.last) {
			event.preventDefault();
			this.#focus(ids[ids.length - 1]);
			return true;
		}
		return false;
	}
}

/** Create a roving-focus registry for a composite widget (Tabs, Menu, Segmented, List…). */
export function createRovingFocus(options?: RovingFocusOptions): RovingFocus {
	return new RovingFocus(options);
}

export type { RovingFocus };
