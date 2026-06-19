import { untrack } from 'svelte';
import { SvelteMap } from 'svelte/reactivity';
import { createRovingFocus, type RovingFocus } from '../../state/rovingFocus.svelte';
import type { Color, Shape, Size, Variant } from '../../types';
import type { ToggleGroupOrientation, ToggleGroupType } from './context';

export type ToggleGroupValue = string | string[];

export type ToggleGroupRootOptions = {
	baseId: string;
	type: () => ToggleGroupType;
	getValue: () => ToggleGroupValue | undefined;
	setValueProp: (value: ToggleGroupValue) => void;
	onValueChange?: () => ((value: ToggleGroupValue) => void) | undefined;
	disabled: () => boolean;
	loop: () => boolean;
	orientation: () => ToggleGroupOrientation;
	rovingFocus: () => boolean;
	variant: () => Variant;
	color: () => Color;
	size: () => Size;
	shape: () => Shape;
	ripple: () => boolean;
};

/** Root state for the ToggleGroup compound: owns single/multiple selection, roving focus, and the shared visual config. */
export class ToggleGroupRootState {
	#opts: ToggleGroupRootOptions;
	#valuesById = new SvelteMap<string, string>();
	readonly roving: RovingFocus;

	constructor(opts: ToggleGroupRootOptions) {
		this.#opts = opts;
		this.roving = createRovingFocus({ orientation: opts.orientation(), loop: opts.loop() });
	}

	get type(): ToggleGroupType {
		return this.#opts.type();
	}
	get disabled(): boolean {
		return this.#opts.disabled();
	}
	get orientation(): ToggleGroupOrientation {
		return this.#opts.orientation();
	}
	get rovingFocus(): boolean {
		return this.#opts.rovingFocus();
	}
	get variant(): Variant {
		return this.#opts.variant();
	}
	get color(): Color {
		return this.#opts.color();
	}
	get size(): Size {
		return this.#opts.size();
	}
	get shape(): Shape {
		return this.#opts.shape();
	}
	get ripple(): boolean {
		return this.#opts.ripple();
	}

	itemId(value: string): string {
		return `${this.#opts.baseId}-item-${value}`;
	}

	valueOfId(id: string | null): string | undefined {
		return id === null ? undefined : this.#valuesById.get(id);
	}

	/** Register a value↔id pairing (untracked R-M-W: called from a registering `$effect`, must not subscribe it). */
	registerValue(value: string): () => void {
		const id = this.itemId(value);
		untrack(() => this.#valuesById.set(id, value));
		return () => {
			untrack(() => {
				if (this.#valuesById.get(id) === value) this.#valuesById.delete(id);
			});
		};
	}

	isPressed(value: string): boolean {
		const current = this.#opts.getValue();
		if (this.type === 'multiple') return Array.isArray(current) && current.includes(value);
		return current === value;
	}

	#commit(next: ToggleGroupValue): void {
		this.#opts.setValueProp(next);
		this.#opts.onValueChange?.()?.(next);
	}

	/** Toggle an item. Single: select, or deselect when it is already the value (ToggleGroup allows none). Multiple: add/remove. */
	toggle(value: string): void {
		if (this.disabled) return;
		const current = this.#opts.getValue();
		if (this.type === 'multiple') {
			const arr = Array.isArray(current) ? current : [];
			this.#commit(arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value]);
		} else {
			this.#commit(current === value ? '' : value);
		}
	}

	handleKeydown(event: KeyboardEvent, value: string): void {
		if (this.disabled || !this.rovingFocus) return;
		const target = event.currentTarget as Element | null;
		if (target) this.roving.dir = getComputedStyle(target).direction === 'rtl' ? 'rtl' : 'ltr';
		this.roving.handleKeydown(event, this.itemId(value));
	}
}
