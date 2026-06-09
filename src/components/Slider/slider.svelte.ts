import { Spring } from 'svelte/motion';
import type { Color, Size } from '../../types';
import { rgbTriplet } from '../../utils/color';
import { boolAttr } from '../../utils/attrs';
import { pressBounce } from '../../actions/pressBounce.svelte';

const NAMED_SIZES = ['mini', 'small', 'medium', 'large', 'xl'] as const;
const SPRING_OPTS = { stiffness: 0.14, damping: 0.62 };

// svelte/motion Spring.set() rejects with "Aborted" when a newer set supersedes it — expected, swallow it.
const ignoreAbort = (p: Promise<unknown>): void => void p.catch(() => {});

export type SliderType = 'single' | 'multiple';

/** Stable getters the Root wires into the state class so the bindable `value` prop stays the single source of truth. */
export type SliderRootConfig = {
	getType: () => SliderType;
	getValue: () => number | number[];
	setValueProp: (v: number | number[]) => void;
	onValueChange?: () => ((value: number | number[]) => void) | undefined;
	onValueCommit?: () => ((value: number | number[]) => void) | undefined;
	getMin: () => number;
	getMax: () => number;
	getStep: () => number;
	getSize: () => Size;
	getColor: () => Color;
	getDisabled: () => boolean;
	getTicks: () => boolean;
	getShowTooltip: () => boolean;
	getAlwaysShowTooltip: () => boolean;
	getFormatValue: () => ((value: number) => string) | undefined;
	getAriaLabel: () => string | undefined;
	getAriaLabelMin: () => string | undefined;
	getAriaLabelMax: () => string | undefined;
};

/** Root state for the Slider compound — owns the Springs, clamp/snap/pct math, rail drag, value proxy, commit, and the tick model. */
export class SliderRootState {
	private railEl: HTMLElement | null = null;
	private dragAc: AbortController | null = null;
	private token1 = 0;
	private token2 = 0;
	private animating1 = $state(false);
	private animating2 = $state(false);

	readonly press = pressBounce({ disabled: () => this.disabled });

	private get spring1(): Spring<number> {
		return this.springs[0];
	}
	private get spring2(): Spring<number> {
		return this.springs[1];
	}

	private readonly springs: [Spring<number>, Spring<number>];

	constructor(private cfg: SliderRootConfig) {
		const seed = this.pair;
		this.springs = [new Spring(seed[0], SPRING_OPTS), new Spring(seed[1], SPRING_OPTS)];
	}

	get type(): SliderType {
		return this.cfg.getType();
	}
	get min(): number {
		return this.cfg.getMin();
	}
	get max(): number {
		return this.cfg.getMax();
	}
	get step(): number {
		return this.cfg.getStep();
	}
	get size(): Size {
		return this.cfg.getSize();
	}
	get color(): Color {
		return this.cfg.getColor();
	}
	get disabled(): boolean {
		return this.cfg.getDisabled();
	}
	get ticks(): boolean {
		return this.cfg.getTicks();
	}
	get showTooltip(): boolean {
		return this.cfg.getShowTooltip();
	}
	get alwaysShowTooltip(): boolean {
		return this.cfg.getAlwaysShowTooltip();
	}
	get ariaLabel(): string | undefined {
		return this.cfg.getAriaLabel();
	}
	get ariaLabelMin(): string | undefined {
		return this.cfg.getAriaLabelMin();
	}
	get ariaLabelMax(): string | undefined {
		return this.cfg.getAriaLabelMax();
	}

	private get rawValue(): number | number[] {
		return this.cfg.getValue();
	}
	private get formatValue(): ((value: number) => string) | undefined {
		return this.cfg.getFormatValue();
	}

	readonly isRange = $derived(this.type === 'multiple' || Array.isArray(this.rawValue));
	readonly triplet = $derived(rgbTriplet(this.color));
	readonly sizeModifier = $derived(
		(NAMED_SIZES as readonly string[]).includes(this.size) ? `slider--size-${this.size}` : undefined
	);
	// Guard a non-positive step: snap()'s divide would yield NaN and the ticks loop would never advance (page hang).
	readonly safeStep = $derived(this.step > 0 ? this.step : 1);

	get pair(): [number, number] {
		const v = this.cfg.getValue();
		return Array.isArray(v) ? [v[0] ?? 0, v[1] ?? 0] : [v, 0];
	}

	clamp(n: number): number {
		return Math.min(this.max, Math.max(this.min, n));
	}
	snap(n: number): number {
		return Math.round(n / this.safeStep) * this.safeStep;
	}
	pct(n: number): number {
		if (this.max === this.min) return 0;
		return ((n - this.min) / (this.max - this.min)) * 100;
	}
	fmt(n: number): string {
		const f = this.formatValue;
		return f ? f(n) : String(n);
	}
	readonly hasFormat = $derived(this.formatValue !== undefined);

	readonly p1 = $derived(this.pct(this.spring1.current));
	readonly p2 = $derived(this.isRange ? this.pct(this.spring2.current) : null);
	readonly display1 = $derived(this.clamp(this.snap(this.spring1.current)));
	readonly display2 = $derived(this.isRange ? this.clamp(this.snap(this.spring2.current)) : 0);

	displayAt(index: 0 | 1): number {
		return index === 1 ? this.display2 : this.display1;
	}
	valueAt(index: 0 | 1): number {
		return this.pair[index];
	}
	ariaLabelAt(index: 0 | 1): string | undefined {
		if (!this.isRange) return this.ariaLabel;
		return index === 1 ? (this.ariaLabelMax ?? this.ariaLabel) : (this.ariaLabelMin ?? this.ariaLabel);
	}

	readonly tickList = $derived.by<number[]>(() => {
		if (!this.ticks) return [];
		const list: number[] = [];
		for (let v = this.min; v <= this.max; v += this.safeStep) list.push(v);
		return list;
	});

	isInActiveRegion(tickPct: number): boolean {
		if (this.isRange && this.p2 !== null) return tickPct >= this.p1 && tickPct <= this.p2;
		return tickPct <= this.p1;
	}

	private emit(next: number | number[]): void {
		this.cfg.setValueProp(next);
		this.cfg.onValueChange?.()?.(next);
	}
	private commit(): void {
		this.cfg.onValueCommit?.()?.(this.cfg.getValue());
	}

	private nextValue(index: 0 | 1, raw: number): number | number[] {
		const n = this.clamp(this.snap(raw));
		if (!this.isRange) return n;
		const cur = this.pair;
		return index === 1 ? [cur[0], Math.max(n, cur[0])] : [Math.min(n, cur[1]), cur[1]];
	}

	// Native input keyboard/AT path: the browser already snapped to step, clamp + cross-thumb guard then emit + commit.
	handleInput(index: 0 | 1, event: Event): void {
		const raw = Number((event.currentTarget as HTMLInputElement).value);
		this.emit(this.nextValue(index, raw));
		this.commit();
	}

	setRail(node: HTMLElement | null): void {
		this.railEl = node;
	}

	private valueAtClientX(clientX: number): number {
		if (!this.railEl) return this.min;
		const r = this.railEl.getBoundingClientRect();
		const ratio = Math.max(0, Math.min(1, (clientX - r.left) / r.width));
		return this.clamp(this.snap(this.min + ratio * (this.max - this.min)));
	}

	// Mirror spring1/spring2 to the prop unless a drag/click is animating that thumb (instant vs spring).
	syncSpring1(): void {
		if (!this.animating1) ignoreAbort(this.spring1.set(this.pair[0], { instant: true }));
	}
	syncSpring2(): void {
		if (!this.isRange) return;
		if (!this.animating2) ignoreAbort(this.spring2.set(this.pair[1], { instant: true }));
	}

	private settle1(promise: Promise<void>): void {
		const token = ++this.token1;
		promise
			.then(() => {
				if (token === this.token1) this.animating1 = false;
			})
			.catch(() => {});
	}
	private settle2(promise: Promise<void>): void {
		const token = ++this.token2;
		promise
			.then(() => {
				if (token === this.token2) this.animating2 = false;
			})
			.catch(() => {});
	}

	handleRailPointerDown(event: PointerEvent): void {
		if (this.disabled || !this.railEl) return;
		if (event.button !== 0) return;
		void this.press.press();
		const target = event.target as HTMLElement | null;
		if (target?.closest('.slider__input, .slider__thumb')) return;
		const r = this.railEl.getBoundingClientRect();
		if (r.width === 0) return;
		const targetVal = this.valueAtClientX(event.clientX);

		let activeIndex: 0 | 1 = 0;
		if (this.isRange) {
			const cur = this.pair;
			const movingHigh = Math.abs(targetVal - cur[1]) < Math.abs(targetVal - cur[0]);
			activeIndex = movingHigh ? 1 : 0;
			if (movingHigh) {
				const next: [number, number] = [cur[0], Math.max(targetVal, cur[0])];
				if (next[1] !== cur[1]) {
					this.animating2 = true;
					this.emit(next);
					this.settle2(this.spring2.set(next[1]));
				}
			} else {
				const next: [number, number] = [Math.min(targetVal, cur[1]), cur[1]];
				if (next[0] !== cur[0]) {
					this.animating1 = true;
					this.emit(next);
					this.settle1(this.spring1.set(next[0]));
				}
			}
		} else if (targetVal !== this.cfg.getValue()) {
			this.animating1 = true;
			this.emit(targetVal);
			this.settle1(this.spring1.set(targetVal));
		}

		this.startRailDrag(event, activeIndex);
	}

	// Capture the pointer so a press-then-drag on the rail keeps tracking (native thumb has no pointer-events here).
	private startRailDrag(event: PointerEvent, activeIndex: 0 | 1): void {
		const node = this.railEl;
		if (!node) return;
		node.setPointerCapture(event.pointerId);
		const ac = new AbortController();
		this.dragAc = ac;

		const trackTo = (clientX: number): void => {
			const v = this.valueAtClientX(clientX);
			if (this.isRange) {
				const cur = this.pair;
				if (activeIndex === 1) {
					const next: [number, number] = [cur[0], Math.max(v, cur[0])];
					if (next[1] === cur[1]) return;
					this.token2++;
					this.animating2 = true;
					ignoreAbort(this.spring2.set(next[1], { instant: true }));
					this.emit(next);
				} else {
					const next: [number, number] = [Math.min(v, cur[1]), cur[1]];
					if (next[0] === cur[0]) return;
					this.token1++;
					this.animating1 = true;
					ignoreAbort(this.spring1.set(next[0], { instant: true }));
					this.emit(next);
				}
			} else {
				if (v === this.cfg.getValue()) return;
				this.token1++;
				this.animating1 = true;
				ignoreAbort(this.spring1.set(v, { instant: true }));
				this.emit(v);
			}
		};

		node.addEventListener('pointermove', (e: PointerEvent) => trackTo(e.clientX), {
			signal: ac.signal
		});
		const end = (): void => {
			this.token1++;
			this.token2++;
			this.animating1 = false;
			this.animating2 = false;
			ac.abort();
			this.dragAc = null;
			this.commit();
		};
		node.addEventListener('pointerup', end, { signal: ac.signal });
		node.addEventListener('pointercancel', end, { signal: ac.signal });
	}

	// Abort an in-flight rail drag if the component unmounts mid-gesture.
	destroy(): void {
		this.dragAc?.abort();
		this.dragAc = null;
	}

	readonly wrapperAttrs = $derived({
		'data-testid': 'slider',
		'data-orientation': 'horizontal' as const,
		'data-range': boolAttr(this.isRange),
		'data-disabled': boolAttr(this.disabled),
		'data-always-tooltip': boolAttr(this.alwaysShowTooltip),
		'data-no-tooltip': boolAttr(!this.showTooltip && !this.alwaysShowTooltip)
	});
}
