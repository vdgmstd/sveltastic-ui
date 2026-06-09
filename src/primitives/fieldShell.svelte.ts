import { untrack } from 'svelte';
import { Tween } from 'svelte/motion';
import { cubicOut } from 'svelte/easing';
import type { Color, ColorName, Shape, Variant } from '../types';
import type { MaskOptions } from '../actions/mask';
import { maskHint } from '../actions/mask';
import { rgbTriplet } from '../utils/color';

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
	getId: () => string;
};

/** Shared field state — proxies the bindable value, owns config getters, live focus/value flags, and the shell tweens (lh/fp/vp/progress). Consumed by Input parts and the InputShell primitive. */
export class FieldShellState {
	focused = $state(false);
	hasValue = $state(false);
	hasMessage = $state(false);

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
	get maskTemplate(): string {
		return this.mask ? maskHint(this.mask) : '';
	}
	get hasMask(): boolean {
		return !!this.maskTemplate;
	}
	get messageId(): string {
		return `${this.id}-message`;
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
