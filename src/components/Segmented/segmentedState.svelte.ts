import { SvelteMap } from 'svelte/reactivity';
import { createRovingFocus, type RovingFocus } from '../../state/rovingFocus.svelte';
import { createSlidingIndicator, type SlidingIndicator } from '../../state/slidingIndicator.svelte';
import { pressBounce } from '../../actions/pressBounce.svelte';
import type { Color, Size } from '../../types';
import type { SegmentedValue, SegmentedVariant } from './context';

export type SegmentedRootOptions = {
	baseId: string;
	getValue: () => SegmentedValue | undefined;
	setValueProp: (value: SegmentedValue) => void;
	color: () => Color;
	variant: () => SegmentedVariant;
	size: () => Size;
	block: () => boolean;
	disabled: () => boolean;
	ripple: () => boolean;
	loop: () => boolean;
	onValueChange?: () => ((value: SegmentedValue) => void) | undefined;
};

/** Root state for the Segmented compound: owns selection, roving focus, the sliding thumb, and the keyboard press dip. */
export class SegmentedRootState {
	#opts: SegmentedRootOptions;
	#track = $state<HTMLElement | null>(null);
	#ripplesLayer = $state<HTMLElement | undefined>(undefined);
	#valuesById = new SvelteMap<string, SegmentedValue>();
	#activeColor = $state<Color | undefined>(undefined);
	readonly roving: RovingFocus;
	readonly thumb: SlidingIndicator = createSlidingIndicator({
		spring: { stiffness: 0.18, damping: 0.78 }
	});
	readonly press = pressBounce({ disabled: () => this.disabled });

	constructor(opts: SegmentedRootOptions) {
		this.#opts = opts;
		this.roving = createRovingFocus({ orientation: 'horizontal', loop: opts.loop() });
	}

	get value(): SegmentedValue | undefined {
		return this.#opts.getValue();
	}
	get color(): Color {
		return this.#opts.color();
	}
	get variant(): SegmentedVariant {
		return this.#opts.variant();
	}
	get size(): Size {
		return this.#opts.size();
	}
	get block(): boolean {
		return this.#opts.block();
	}
	get disabled(): boolean {
		return this.#opts.disabled();
	}
	get ripple(): boolean {
		return this.#opts.ripple();
	}
	get loop(): boolean {
		return this.#opts.loop();
	}
	/** Filled-thumb variants render white ripples and `--on-accent` active labels. */
	get onFilledThumb(): boolean {
		return this.variant === 'default' || this.variant === 'relief';
	}
	get track(): HTMLElement | null {
		return this.#track;
	}
	get ripplesLayer(): HTMLElement | undefined {
		return this.#ripplesLayer;
	}
	/** Active item's accent (per-item `color` override, falling back to the group `color`). Drives the thumb `--at`. */
	get activeColor(): Color {
		return this.#activeColor ?? this.color;
	}

	/** The active item publishes its resolved accent so the Root thumb can tint to it. */
	setActiveColor(color: Color | undefined): void {
		this.#activeColor = color;
	}

	itemId(value: SegmentedValue): string {
		return `${this.#opts.baseId}-item-${value}`;
	}

	/** Reverse the roving id back to the original-typed value (preserves `number` vs `string`). */
	valueOfId(id: string | null): SegmentedValue | undefined {
		return id === null ? undefined : this.#valuesById.get(id);
	}

	/** Register a value↔id pairing for an item; returns a deregister. */
	registerValue(value: SegmentedValue): () => void {
		const id = this.itemId(value);
		this.#valuesById.set(id, value);
		return () => {
			if (this.#valuesById.get(id) === value) this.#valuesById.delete(id);
		};
	}

	setTrack(el: HTMLElement | null): void {
		this.#track = el;
	}
	setRipplesLayer(el: HTMLElement | undefined): void {
		this.#ripplesLayer = el;
	}

	/** Re-measure the thumb to the currently active item within the track. */
	measure(): void {
		const active = this.#track?.querySelector<HTMLElement>('[role="radio"][data-state="active"]');
		this.thumb.measure(active ?? null, this.#track);
	}

	/** Radio-exclusive select: no toggle-off, no-op while disabled or already selected. */
	select(value: SegmentedValue): void {
		if (this.disabled) return;
		if (this.value === value) return;
		this.#opts.setValueProp(value);
		this.#opts.onValueChange?.()?.(value);
	}
}

/** Per-item state: derives the active flag and exposes the radio behaviour + keyboard nav. */
export class SegmentedItemState {
	#root: SegmentedRootState;
	#value: () => SegmentedValue;
	#disabled: () => boolean;

	readonly isActive: boolean = $derived.by(() => this.#root.value === this.#value());
	readonly isInert: boolean = $derived.by(() => this.#disabled() || this.#root.disabled);

	constructor(root: SegmentedRootState, value: () => SegmentedValue, disabled: () => boolean) {
		this.#root = root;
		this.#value = value;
		this.#disabled = disabled;
	}

	get value(): SegmentedValue {
		return this.#value();
	}

	select(): void {
		if (this.isInert) return;
		this.#root.select(this.#value());
	}

	handleKeydown(event: KeyboardEvent): void {
		if (this.isInert) return;
		const target = event.currentTarget as Element | null;
		if (target) {
			this.#root.roving.dir = getComputedStyle(target).direction === 'rtl' ? 'rtl' : 'ltr';
		}
		if (this.#root.roving.handleKeydown(event, this.#root.itemId(this.#value()))) {
			const next = this.#root.roving.current;
			const nextValue = this.#root.valueOfId(next);
			if (nextValue !== undefined && nextValue !== this.#root.value) {
				this.#root.select(nextValue);
				void this.#root.press.press();
			}
		}
	}
}
