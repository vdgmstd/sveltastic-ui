import { rgbTriplet } from '../../utils/color';
import type { Color } from '../../types';
import type { RatingGroupOrientation } from './context';

export type RatingGroupValueText = string | ((value: number, max: number) => string);

const clamp = (v: number, min: number, max: number): number => Math.min(Math.max(v, min), max);

/** Config the Root hands the state — getters keep derived chains live, the setter proxies the bindable `value`. */
export type RatingGroupConfig = {
	getValue: () => number;
	setValueProp: (value: number) => void;
	onValueChange?: () => ((value: number) => void) | undefined;
	readonly max: number;
	readonly min: number;
	readonly allowHalf: boolean;
	readonly readonly: boolean;
	readonly disabled: boolean;
	readonly hoverPreview: boolean;
	readonly orientation: RatingGroupOrientation;
	readonly color: Color;
	readonly name: string | undefined;
	readonly ariaLabel: string | undefined;
	readonly ariaValueText: RatingGroupValueText | undefined;
};

/** Root state for the RatingGroup compound (a `slider`-role widget): owns the value, the hover preview, keyboard, and per-item fill math. */
export class RatingGroupRootState {
	#cfg: RatingGroupConfig;

	/** Live hover preview value; `null` when not previewing. */
	hoverValue = $state<number | null>(null);

	constructor(cfg: RatingGroupConfig) {
		this.#cfg = cfg;
	}

	get value(): number {
		return this.#cfg.getValue();
	}
	get max(): number {
		return this.#cfg.max;
	}
	get min(): number {
		return this.#cfg.min;
	}
	get allowHalf(): boolean {
		return this.#cfg.allowHalf;
	}
	get readonly(): boolean {
		return this.#cfg.readonly;
	}
	get disabled(): boolean {
		return this.#cfg.disabled;
	}
	get orientation(): RatingGroupOrientation {
		return this.#cfg.orientation;
	}
	get color(): Color {
		return this.#cfg.color;
	}
	get name(): string | undefined {
		return this.#cfg.name;
	}
	get triplet(): string {
		return rgbTriplet(this.#cfg.color);
	}

	get step(): number {
		return this.#cfg.allowHalf ? 0.5 : 1;
	}
	get interactive(): boolean {
		return !this.#cfg.disabled && !this.#cfg.readonly;
	}
	/** What the stars render — the hover preview while previewing, otherwise the committed value. */
	get displayValue(): number {
		return this.hoverValue ?? this.value;
	}

	get ariaValueText(): string {
		const t = this.#cfg.ariaValueText;
		if (typeof t === 'function') return t(this.value, this.max);
		if (typeof t === 'string') return t;
		return `${this.value} out of ${this.max}`;
	}

	/** Fill amount (0–1) for the item at zero-based `index`: 1 full, 0.5 half, 0 empty. */
	fractionFor(index: number): number {
		return clamp(this.displayValue - index, 0, 1);
	}

	stateFor(index: number): 'full' | 'partial' | 'empty' {
		const f = this.fractionFor(index);
		return f >= 1 ? 'full' : f > 0 ? 'partial' : 'empty';
	}

	setValue(next: number): void {
		if (!this.interactive) return;
		const clamped = clamp(next, this.min, this.max);
		if (clamped === this.value) return;
		this.#cfg.setValueProp(clamped);
		this.#cfg.onValueChange?.()?.(clamped);
	}

	setHover(next: number): void {
		if (!this.interactive || !this.#cfg.hoverPreview) return;
		this.hoverValue = clamp(next, this.min, this.max);
	}

	clearHover(): void {
		this.hoverValue = null;
	}

	/** Slider keyboard map — arrows ±step (RTL-aware), Home/End, digit keys set the value directly. */
	handleKeydown(e: KeyboardEvent, dir: 'ltr' | 'rtl'): void {
		if (!this.interactive) return;
		const forward = dir === 'rtl' ? 'ArrowLeft' : 'ArrowRight';
		const backward = dir === 'rtl' ? 'ArrowRight' : 'ArrowLeft';
		let next: number | undefined;
		switch (e.key) {
			case forward:
			case 'ArrowUp':
				next = this.value + this.step;
				break;
			case backward:
			case 'ArrowDown':
				next = this.value - this.step;
				break;
			case 'Home':
				next = this.min;
				break;
			case 'End':
				next = this.max;
				break;
			default:
				if (/^[0-9]$/.test(e.key)) next = Number(e.key);
		}
		if (next === undefined) return;
		e.preventDefault();
		this.setValue(next);
	}
}
