import { untrack } from 'svelte';
import { rgbTriplet } from '../../utils/color';
import { decimalsFromStep } from '../../utils/number';
import { AnimatedNumber } from '../../utils/animatedNumber.svelte';
import { pressBounce } from '../../actions/pressBounce.svelte';
import type { Color, Shape, Size } from '../../types';

const HOLD_DELAY = 500;
const REPEAT_INITIAL = 90;
const REPEAT_FAST = 50;
const REPEAT_FASTEST = 28;

export type InputNumberRootConfig = {
	fieldId: string;
	getValue: () => number;
	setValueProp: (value: number) => void;
	onValueChange: () => ((value: number) => void) | undefined;
	getMin: () => number;
	getMax: () => number;
	getStep: () => number;
	getSize: () => Size;
	getShape: () => Shape;
	getColor: () => Color;
	getIncrementColor: () => Color | undefined;
	getDecrementColor: () => Color | undefined;
	getDisabled: () => boolean;
	getReadonly: () => boolean;
	getAnimationDuration: () => number;
};

/** Root state for the InputNumber compound — proxies the `value` bindable, owns the editing/sanitize flow, rolling-digit display, hold-to-repeat steppers and per-button press bounce. Shared with `Field`/`Increment`/`Decrement` via context. */
export class InputNumberRootState {
	#cfg: InputNumberRootConfig;
	#isEditing = $state(false);
	#draft = $state('');
	readonly displayed: AnimatedNumber;
	readonly incPress: ReturnType<typeof pressBounce>;
	readonly decPress: ReturnType<typeof pressBounce>;

	#holdTimer: number | undefined;
	#repeatTimer: number | undefined;
	#releaseGuard: AbortController | undefined;
	#didHold = false;

	constructor(cfg: InputNumberRootConfig) {
		this.#cfg = cfg;
		this.displayed = new AnimatedNumber(untrack(() => cfg.getValue()), {
			duration: untrack(() => cfg.getAnimationDuration())
		});
		this.incPress = pressBounce({ disabled: () => !this.canInc });
		this.decPress = pressBounce({ disabled: () => !this.canDec });
		this.clearHold = this.clearHold.bind(this);
	}

	get fieldId(): string {
		return this.#cfg.fieldId;
	}
	get value(): number {
		return this.#cfg.getValue();
	}
	get min(): number {
		return this.#cfg.getMin();
	}
	get max(): number {
		return this.#cfg.getMax();
	}
	get step(): number {
		return this.#cfg.getStep();
	}
	get size(): Size {
		return this.#cfg.getSize();
	}
	get shape(): Shape {
		return this.#cfg.getShape();
	}
	get disabled(): boolean {
		return this.#cfg.getDisabled();
	}
	get readonly(): boolean {
		return this.#cfg.getReadonly();
	}
	get isInert(): boolean {
		return this.disabled || this.readonly;
	}
	get isEditing(): boolean {
		return this.#isEditing;
	}
	get triplet(): string {
		return rgbTriplet(this.#cfg.getColor());
	}
	get incTriplet(): string {
		return rgbTriplet(this.#cfg.getIncrementColor() ?? this.#cfg.getColor());
	}
	get decTriplet(): string {
		return rgbTriplet(this.#cfg.getDecrementColor() ?? this.#cfg.getColor());
	}
	get canDec(): boolean {
		return !this.isInert && this.value > this.min;
	}
	get canInc(): boolean {
		return !this.isInert && this.value < this.max;
	}
	get hasAnim(): boolean {
		return this.step !== 1 || Number.isFinite(this.min) || Number.isFinite(this.max);
	}
	get iconPx(): number {
		switch (this.size) {
			case 'xl':
				return 18;
			case 'large':
				return 16;
			case 'small':
				return 12;
			case 'mini':
				return 11;
			default:
				return 14;
		}
	}

	get ariaValueMin(): number | undefined {
		return Number.isFinite(this.min) ? this.min : undefined;
	}
	get ariaValueMax(): number | undefined {
		return Number.isFinite(this.max) ? this.max : undefined;
	}
	get displayedText(): string {
		if (this.#isEditing) return this.#draft;
		const n = this.displayed.current;
		if (!Number.isFinite(n)) return '';
		return n.toFixed(decimalsFromStep(this.step));
	}

	clamp(n: number): number {
		return Math.min(this.max, Math.max(this.min, n));
	}

	set(n: number): void {
		if (this.isInert) return;
		const next = this.clamp(n);
		if (Number.isNaN(next) || next === this.value) return;
		this.#cfg.setValueProp(next);
		if (this.#isEditing) this.#draft = String(next);
		this.#cfg.onValueChange()?.(next);
	}

	bump(direction: 1 | -1): void {
		this.set(this.value + direction * this.step);
	}

	#sanitize(raw: string): string {
		let out = '';
		let seenDot = false;
		for (let i = 0; i < raw.length; i++) {
			const ch = raw[i];
			if (ch === '-' && i === 0) {
				out += ch;
				continue;
			}
			if ((ch === '.' || ch === ',') && !seenDot) {
				out += '.';
				seenDot = true;
				continue;
			}
			if (ch >= '0' && ch <= '9') out += ch;
		}
		return out;
	}

	handleInput(event: Event & { currentTarget: EventTarget & HTMLInputElement }): void {
		const el = event.currentTarget;
		const raw = el.value;
		const cleaned = this.#sanitize(raw);
		if (cleaned !== raw) {
			const caret = el.selectionStart ?? raw.length;
			const removedBefore = caret - this.#sanitize(raw.slice(0, caret)).length;
			const pos = Math.max(0, caret - removedBefore);
			el.value = cleaned;
			// Selection API throws on some input types/states; the caret fix is best-effort.
			try {
				el.setSelectionRange(pos, pos);
			} catch {
				/* noop */
			}
		}
		this.#draft = cleaned;
	}

	commitDraft(): void {
		if (this.#draft === '' || this.#draft === '-' || this.#draft === '.' || this.#draft === '-.')
			return;
		const num = Number(this.#draft);
		if (Number.isNaN(num)) return;
		this.set(num);
		if (this.#isEditing) this.#draft = String(this.clamp(num));
	}

	handleKeydown(event: KeyboardEvent): void {
		if (this.isInert) return;
		if (event.key === 'ArrowUp') {
			event.preventDefault();
			this.bump(1);
		} else if (event.key === 'ArrowDown') {
			event.preventDefault();
			this.bump(-1);
		} else if (event.key === 'PageUp') {
			event.preventDefault();
			this.set(this.value + this.step * 10);
		} else if (event.key === 'PageDown') {
			event.preventDefault();
			this.set(this.value - this.step * 10);
		} else if (event.key === 'Home' && Number.isFinite(this.min)) {
			event.preventDefault();
			this.set(this.min);
		} else if (event.key === 'End' && Number.isFinite(this.max)) {
			event.preventDefault();
			this.set(this.max);
		} else if (event.key === 'Enter') {
			this.commitDraft();
		}
	}

	handleFocus(): void {
		this.#isEditing = true;
		this.#draft = String(this.value);
		this.displayed.snap(this.value);
	}

	handleBlur(): void {
		this.commitDraft();
		this.#isEditing = false;
	}

	/** Push the animation duration + target into the rolling-digit display; called from a Root `$effect`. */
	syncDisplay(): void {
		this.displayed.duration = this.#cfg.getAnimationDuration();
		const target = this.value;
		if (this.#isEditing || !this.hasAnim) this.displayed.snap(target);
		else this.displayed.target = target;
	}

	clearHold(): void {
		if (this.#holdTimer !== undefined) {
			window.clearTimeout(this.#holdTimer);
			this.#holdTimer = undefined;
		}
		if (this.#repeatTimer !== undefined) {
			window.clearTimeout(this.#repeatTimer);
			this.#repeatTimer = undefined;
		}
		this.#releaseGuard?.abort();
		this.#releaseGuard = undefined;
	}

	#scheduleRepeat(direction: 1 | -1, ticks: number): void {
		const interval = ticks > 20 ? REPEAT_FASTEST : ticks > 8 ? REPEAT_FAST : REPEAT_INITIAL;
		this.#repeatTimer = window.setTimeout(() => {
			if (
				(direction === 1 && this.value >= this.max) ||
				(direction === -1 && this.value <= this.min)
			) {
				this.clearHold();
				return;
			}
			this.bump(direction);
			this.#scheduleRepeat(direction, ticks + 1);
		}, interval);
	}

	startHold(direction: 1 | -1): void {
		this.#didHold = false;
		this.clearHold();
		if (this.isInert) return;
		this.#releaseGuard = new AbortController();
		window.addEventListener('pointerup', this.clearHold, { signal: this.#releaseGuard.signal });
		window.addEventListener('blur', this.clearHold, { signal: this.#releaseGuard.signal });
		this.#holdTimer = window.setTimeout(() => {
			this.#didHold = true;
			this.#holdTimer = undefined;
			this.bump(direction);
			this.#scheduleRepeat(direction, 1);
		}, HOLD_DELAY);
	}

	handleClick(direction: 1 | -1): void {
		if (this.#didHold) {
			this.#didHold = false;
			return;
		}
		this.bump(direction);
	}
}
