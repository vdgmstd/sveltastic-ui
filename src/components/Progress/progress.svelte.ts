import { Tween } from 'svelte/motion';
import { cubicOut } from 'svelte/easing';
import { rgbTriplet } from '../../utils/color';
import type { Color } from '../../types';

export type ProgressShape = 'linear' | 'circular';

const DEFAULT_BAR_HEIGHT = 8;
const MIN_RING_STROKE = 2;
const RING_STROKE_RATIO = 9;

export type ProgressRootConfig = {
	getValue: () => number | null;
	getMin: () => number;
	getMax: () => number;
	getShape: () => ProgressShape;
	getThickness: () => number | undefined;
	getSize: () => number;
	getColor: () => Color | undefined;
	getGlow: () => boolean;
	getId: () => string;
};

/** Progress Root state — owns value/min/max/shape and the fill Tween, shared with Track / Indicator / Label. */
export class ProgressRootState {
	#cfg: ProgressRootConfig;
	readonly fill: Tween<number>;
	hasLabel = $state(false);
	labelId = $state<string | undefined>(undefined);

	constructor(cfg: ProgressRootConfig) {
		this.#cfg = cfg;
		this.fill = new Tween(this.ratio, { duration: 320, easing: cubicOut });
	}

	sync(): void {
		this.fill.target = this.ratio;
	}

	get value(): number | null {
		return this.#cfg.getValue();
	}
	get min(): number {
		return this.#cfg.getMin();
	}
	get max(): number {
		return this.#cfg.getMax();
	}
	get shape(): ProgressShape {
		return this.#cfg.getShape();
	}
	/** Resolved stroke: the ring default scales with the diameter, so small rings stay rings instead of donuts. */
	get thickness(): number {
		const explicit = this.#cfg.getThickness();
		if (explicit !== undefined) return explicit;
		return this.shape === 'circular'
			? Math.max(MIN_RING_STROKE, this.size / RING_STROKE_RATIO)
			: DEFAULT_BAR_HEIGHT;
	}
	get size(): number {
		return this.#cfg.getSize();
	}
	get color(): Color | undefined {
		return this.#cfg.getColor();
	}
	get glow(): boolean {
		return this.#cfg.getGlow();
	}
	get id(): string {
		return this.#cfg.getId();
	}
	get gradId(): string {
		return `progress-grad-${this.id}`;
	}
	get defaultLabelId(): string {
		return `${this.id}-label`;
	}

	get isIndeterminate(): boolean {
		return this.value === null;
	}
	get safeValue(): number {
		return typeof this.value === 'number' && Number.isFinite(this.value) ? this.value : this.min;
	}
	get ratio(): number {
		return this.max > this.min
			? Math.max(0, Math.min(1, (this.safeValue - this.min) / (this.max - this.min)))
			: 0;
	}
	get clamped(): number {
		return Math.max(this.min, Math.min(this.max, this.safeValue));
	}
	get triplet(): string {
		return rgbTriplet(this.#cfg.getColor());
	}
	get radius(): number {
		return (this.size - this.thickness) / 2;
	}
	get circumference(): number {
		return 2 * Math.PI * this.radius;
	}
	get dashOffset(): number {
		return this.circumference * (1 - this.fill.current);
	}
	get pct(): number {
		return this.fill.current * 100;
	}
	get state(): 'indeterminate' | 'loaded' | 'loading' {
		return this.isIndeterminate ? 'indeterminate' : this.clamped >= this.max ? 'loaded' : 'loading';
	}
}
