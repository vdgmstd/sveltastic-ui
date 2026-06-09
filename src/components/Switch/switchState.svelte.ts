import type { Color, Shape, Size } from '../../types';
import { rgbTriplet } from '../../utils/color';
import { boolAttr } from '../../utils/attrs';
import { pressBounce } from '../../actions/pressBounce.svelte';

const NAMED_SIZES = ['mini', 'small', 'medium', 'large', 'xl'] as const;

export type SwitchRootConfig = {
	getId: () => string;
	getChecked: () => boolean;
	setCheckedProp: (v: boolean) => void;
	onCheckedChange?: () => ((checked: boolean) => void) | undefined;
	getShape: () => Shape;
	getSize: () => Size;
	getColor: () => Color;
	getDisabled: () => boolean;
	getLoading: () => boolean;
	getIndeterminate: () => boolean;
	getGhostKnob: () => boolean;
	getAriaLabel: () => string | undefined;
};

/** Root state for the Switch compound — proxies the `checked` bindable, owns the press bounce, exposes the attr bags parts spread. */
export class SwitchRootState {
	readonly press = pressBounce({
		dip: 0.88,
		disabled: () => this.isLocked,
		keys: [' ']
	});

	constructor(private cfg: SwitchRootConfig) {}

	get id(): string {
		return this.cfg.getId();
	}
	get checked(): boolean {
		return this.cfg.getChecked();
	}
	get disabled(): boolean {
		return this.cfg.getDisabled();
	}
	get loading(): boolean {
		return this.cfg.getLoading();
	}
	get indeterminate(): boolean {
		return this.cfg.getIndeterminate();
	}
	get ghostKnob(): boolean {
		return this.cfg.getGhostKnob();
	}
	get shape(): Shape {
		return this.cfg.getShape();
	}
	get size(): Size {
		return this.cfg.getSize();
	}
	get color(): Color {
		return this.cfg.getColor();
	}
	get ariaLabel(): string | undefined {
		return this.cfg.getAriaLabel();
	}

	readonly isLocked = $derived(this.disabled || this.loading || this.indeterminate);
	readonly triplet = $derived(rgbTriplet(this.color));
	readonly sizeModifier = $derived(
		(NAMED_SIZES as readonly string[]).includes(this.size) ? `switch--size-${this.size}` : undefined
	);
	readonly dataState = $derived(this.checked ? ('checked' as const) : ('unchecked' as const));

	setChecked(v: boolean): void {
		if (this.checked === v) return;
		this.cfg.setCheckedProp(v);
		this.cfg.onCheckedChange?.()?.(v);
	}

	readonly wrapperAttrs = $derived({
		'data-state': this.dataState,
		'data-shape': this.shape,
		'data-checked': boolAttr(this.checked),
		'data-icon': boolAttr(this.ghostKnob),
		'data-indeterminate': boolAttr(this.indeterminate),
		'data-loading': boolAttr(this.loading),
		'data-disabled': boolAttr(this.disabled),
		'data-testid': 'switch'
	});

	readonly inputAttrs = $derived({
		type: 'checkbox' as const,
		role: this.indeterminate ? ('checkbox' as const) : ('switch' as const),
		checked: this.checked || this.indeterminate,
		disabled: this.disabled,
		'aria-label': this.ariaLabel,
		'aria-checked': this.indeterminate
			? ('mixed' as const)
			: this.checked
				? ('true' as const)
				: ('false' as const),
		onpointerdown: this.press.onpointerdown,
		onkeydown: this.press.onkeydown
	});
}
