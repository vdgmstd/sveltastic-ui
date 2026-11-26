import { untrack } from 'svelte';
import { Tween } from 'svelte/motion';
import { cubicOut } from 'svelte/easing';
import type { MaskInputOptions } from 'maska';
import type { Color, ColorName, Shape, Variant } from '../types';
import type { MaskOptions, MaskaDetail } from '../actions/mask';
import { maskHint as maskHintFromMask } from '../actions/mask';
import { onAccentFor, rgbTriplet } from '../utils/color';
import { devWarn } from '../utils/dom';

const POINTER_FOCUS_WINDOW_MS = 300;

export type InputVariant = Extract<Variant, 'default' | 'border' | 'shadow'>;
export type InputLabelStyle = 'default' | 'placeholder' | 'inline';
export type InputState =
	| 'default'
	| Extract<ColorName, 'primary' | 'success' | 'danger' | 'warning' | 'dark'>;

export type FieldShellConfig = {
	getValue: () => string;
	setValueProp: (v: string) => void;
	getOnValueChange: () => ((value: string) => void) | undefined;
	getVariant: () => InputVariant;
	getLabelStyle: () => InputLabelStyle;
	getShape: () => Shape;
	getBlock: () => boolean;
	getIconPosition: () => 'before' | 'after';
	getFieldState: () => InputState;
	getColor: () => Color | undefined;
	getIconColor: () => Color | undefined;
	getLoading: () => boolean;
	getProgress: () => number;
	getTransparent: () => boolean;
	getForceFocus: () => boolean;
	getDisabled: () => boolean;
	getReadonly: () => boolean;
	getMask: () => MaskOptions | undefined;
	/** Optional literal ghost template overriding the one derived from the mask. Ignored without a mask; `''` reads as absent. */
	getMaskHint?: () => string | undefined;
	getId: () => string;
};

/** Shared field state — proxies the bindable value, owns config getters, live focus/value flags, and the shell tweens (lh/fp/vp/progress). Consumed by Input parts and the InputShell primitive. */
export class FieldShellState {
	focused = $state(false);
	hasValue = $state(false);
	hasMessage = $state(false);
	/** Masked display string — captured from the mask action, seeded from the raw value via syncMask(). */
	maskedValue = $state('');
	#lastPointerDownAt = 0;
	#caretTimer: ReturnType<typeof setTimeout> | undefined;

	readonly lhTween = new Tween(0, { duration: 220, easing: cubicOut });
	readonly fpTween = new Tween(0, { duration: 250, easing: cubicOut });
	readonly vpTween = new Tween(0, { duration: 200, easing: cubicOut });
	readonly progressTween: Tween<number>;

	constructor(private cfg: FieldShellConfig) {
		this.hasValue = cfg.getValue() !== '';
		this.progressTween = new Tween(untrack(() => cfg.getProgress()), { duration: 250, easing: cubicOut });
	}

	get value(): string {
		return this.cfg.getValue();
	}
	setValue(v: string): void {
		this.cfg.setValueProp(v);
		this.cfg.getOnValueChange()?.(v);
	}

	get variant(): InputVariant {
		return this.cfg.getVariant();
	}
	get labelStyle(): InputLabelStyle {
		return this.cfg.getLabelStyle();
	}
	get shape(): Shape {
		return this.cfg.getShape();
	}
	get block(): boolean {
		return this.cfg.getBlock();
	}
	get iconPosition(): 'before' | 'after' {
		return this.cfg.getIconPosition();
	}
	get fieldState(): InputState {
		return this.cfg.getFieldState();
	}
	get color(): Color | undefined {
		return this.cfg.getColor();
	}
	get iconColor(): Color | undefined {
		return this.cfg.getIconColor();
	}
	get loading(): boolean {
		return this.cfg.getLoading();
	}
	get progress(): number {
		return this.cfg.getProgress();
	}
	get transparent(): boolean {
		return this.cfg.getTransparent();
	}
	get forceFocus(): boolean {
		return this.cfg.getForceFocus();
	}
	get disabled(): boolean {
		return this.cfg.getDisabled();
	}
	get readonly(): boolean {
		return this.cfg.getReadonly();
	}
	get mask(): MaskOptions | undefined {
		return this.cfg.getMask();
	}
	get id(): string {
		return this.cfg.getId();
	}

	get isFloating(): boolean {
		return this.labelStyle === 'placeholder';
	}
	get focusedActive(): boolean {
		return this.focused || this.forceFocus;
	}
	/**
	 * Ghost template behind the typed value — an explicit hint wins verbatim over the mask-derived zeros.
	 * Gated on the mask: without one there is no ghost to override, and an empty hint reads as "not supplied"
	 * so an unresolved i18n lookup falls back to the zeros instead of tearing the overlay down.
	 */
	get maskTemplate(): string {
		return this.mask ? (this.cfg.getMaskHint?.() || maskHintFromMask(this.mask)) : '';
	}
	get hasMask(): boolean {
		return !!this.maskTemplate;
	}
	get messageId(): string {
		return `${this.id}-message`;
	}

	/** The template split into code points — a non-BMP hint must not be sliced into lone surrogates. */
	get maskChars(): string[] {
		return [...this.maskTemplate];
	}
	/** Ghost width in columns, not code units — drives `--mask-len`. */
	get maskLength(): number {
		return this.maskChars.length;
	}

	/** The typed value split into code points — measured in the same unit as `maskChars`, never mixed with it. */
	get typedChars(): string[] {
		return [...this.maskedValue];
	}
	get typedLen(): number {
		return Math.min(this.typedChars.length, this.maskLength);
	}
	/** Typed half of the ghost — sliced on code points, so a non-BMP token never renders a lone surrogate. */
	get typedText(): string {
		return this.typedChars.slice(0, this.typedLen).join('');
	}
	get maskRemainder(): string {
		return this.maskChars.slice(this.typedLen).join('');
	}
	get showMask(): boolean {
		return !!this.maskTemplate && (!this.isFloating || this.focusedActive || this.hasValue);
	}

	captureMasked = (detail: MaskaDetail): void => {
		this.maskedValue = detail.masked;
	};

	readonly resolvedMask: MaskInputOptions | undefined = $derived.by(() => {
		const mask = this.mask;
		if (mask === undefined) return undefined;
		const base = typeof mask === 'string' || Array.isArray(mask) ? { mask } : mask;
		const prior = base.onMaska;
		const chained = Array.isArray(prior)
			? [...prior, this.captureMasked]
			: prior
				? [prior, this.captureMasked]
				: this.captureMasked;
		return { ...base, onMaska: chained };
	});

	/** Seed the masked display from the raw value — call inside an `$effect`; the mask action overrides it on input. */
	syncMask(): void {
		this.#warnHintWidth();
		if (!this.maskTemplate) this.maskedValue = '';
		else this.maskedValue = this.value;
	}

	/** Dev-only: the typed/remainder split trusts the hint to be exactly as wide as the mask. */
	#warnHintWidth(): void {
		const mask = this.mask;
		const hint = this.cfg.getMaskHint?.();
		if (!mask || !hint) return;
		const expected = [...maskHintFromMask(mask)].length;
		if (expected === 0) return;
		const actual = [...hint].length;
		if (actual === expected) return;
		devWarn(
			`maskHint ${JSON.stringify(hint)} is ${actual} characters wide but its mask is ${expected} — ` +
				`a longer hint keeps painting ghost characters over a complete value, a shorter one blanks the ghost ` +
				`while the field is still incomplete.`
		);
	}

	/** Record a pointer-down so a pointer-driven focus skips caret repositioning. */
	markPointerDown(): void {
		this.#lastPointerDownAt = Date.now();
	}

	/** On keyboard focus of a masked field, move the caret to the end of the typed value. */
	repositionCaretOnFocus(inputEl: HTMLInputElement): void {
		if (!this.maskTemplate) return;
		const fromPointer = Date.now() - this.#lastPointerDownAt < POINTER_FOCUS_WINDOW_MS;
		if (fromPointer) return;
		const pos = this.value.length;
		clearTimeout(this.#caretTimer);
		this.#caretTimer = setTimeout(() => {
			if (document.activeElement === inputEl) {
				try {
					inputEl.setSelectionRange(pos, pos);
				} catch {
					/* unsupported input type */
				}
			}
		}, 0);
	}

	/** Clear the pending caret timer — call from an `$effect` cleanup in the owner. */
	disposeMask(): void {
		clearTimeout(this.#caretTimer);
	}

	get resolvedColor(): Color {
		return this.fieldState === 'default' ? (this.color ?? 'primary') : (this.fieldState as ColorName);
	}
	get triplet(): string {
		return rgbTriplet(this.resolvedColor);
	}
	get iconTriplet(): string | null {
		return this.iconColor ? rgbTriplet(this.iconColor) : null;
	}
	/** Ink painted over the icon fill — null unless `iconColor` was passed, so the CSS default chain survives. */
	get onIconTriplet(): string | null {
		return this.iconColor ? onAccentFor(this.iconColor) : null;
	}
	get isPlainSurface(): boolean {
		return this.variant === 'default' && this.fieldState === 'default' && !this.transparent;
	}
	get isStateVariant(): boolean {
		return this.fieldState !== 'default';
	}
	get isIconFillBg(): boolean {
		return !!this.iconColor;
	}
	get progressKind(): 'danger' | 'warn' | 'success' | null {
		if (this.progress <= 0) return null;
		if (this.progress < 33) return 'danger';
		if (this.progress < 66) return 'warn';
		return 'success';
	}

	private get lhTarget(): number {
		return this.isFloating ? (this.focusedActive || this.hasValue ? 1 : 0) : 0;
	}
	private get fpTarget(): number {
		return this.focusedActive ? 1 : 0;
	}
	private get vpTarget(): number {
		return this.hasValue ? 1 : 0;
	}

	/** Drive the shell tweens from the live targets — call inside an `$effect` in the owner. */
	sync(): void {
		this.lhTween.target = this.lhTarget;
		this.fpTween.target = this.fpTarget;
		const vp = this.vpTarget;
		if (vp === 1) this.vpTween.set(1, { duration: 0 });
		else this.vpTween.target = vp;
		this.progressTween.target = this.progress;
	}
}
