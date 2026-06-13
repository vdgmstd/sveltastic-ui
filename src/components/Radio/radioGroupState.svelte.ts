import { untrack } from 'svelte';
import { Tween } from 'svelte/motion';
import { cubicOut } from 'svelte/easing';
import { SvelteMap } from 'svelte/reactivity';
import { createRovingFocus, type RovingFocus } from '../../state/rovingFocus.svelte';
import { pressBounce } from '../../actions/pressBounce.svelte';
import { rgbTriplet } from '../../utils/color';
import type { Color } from '../../types';
import type { RadioGroupOrientation } from './context';

const ACTIVE_DURATION = 260;

export type RadioGroupRootConfig = {
	baseId: string;
	getValue: () => string | undefined;
	setValueProp: (value: string) => void;
	onValueChange?: () => ((value: string) => void) | undefined;
	getName: () => string | undefined;
	getColor: () => Color;
	getDisabled: () => boolean;
	getRequired: () => boolean;
	getReadonly: () => boolean;
	getOrientation: () => RadioGroupOrientation;
	getLoop: () => boolean;
};

/** Root state for the RadioGroup compound — proxies the `value` bindable, owns roving focus and the group form/aria contract. */
export class RadioGroupRootState {
	#cfg: RadioGroupRootConfig;
	#valuesById = new SvelteMap<string, string>();
	readonly roving: RovingFocus;

	constructor(cfg: RadioGroupRootConfig) {
		this.#cfg = cfg;
		this.roving = createRovingFocus({
			orientation: cfg.getOrientation(),
			loop: cfg.getLoop()
		});
	}

	get value(): string | undefined {
		return this.#cfg.getValue();
	}
	get name(): string | undefined {
		return this.#cfg.getName();
	}
	/** Shared `name` for the native radio set — the explicit `name` prop, else a stable per-group id. */
	get groupName(): string {
		return this.#cfg.getName() ?? `${this.#cfg.baseId}-name`;
	}
	get color(): Color {
		return this.#cfg.getColor();
	}
	get disabled(): boolean {
		return this.#cfg.getDisabled();
	}
	get required(): boolean {
		return this.#cfg.getRequired();
	}
	get readonly(): boolean {
		return this.#cfg.getReadonly();
	}
	get orientation(): RadioGroupOrientation {
		return this.#cfg.getOrientation();
	}
	get loop(): boolean {
		return this.#cfg.getLoop();
	}

	itemId(value: string): string {
		return `${this.#cfg.baseId}-item-${value}`;
	}

	valueOfId(id: string | null): string | undefined {
		return id === null ? undefined : this.#valuesById.get(id);
	}

	/** Register a value↔id pairing for an item; returns a deregister. */
	registerValue(value: string): () => void {
		const id = this.itemId(value);
		this.#valuesById.set(id, value);
		return () => {
			if (this.#valuesById.get(id) === value) this.#valuesById.delete(id);
		};
	}

	isChecked(value: string): boolean {
		return this.value === value;
	}

	/** Single-select set: no-op while disabled/readonly or already selected; fires `onValueChange`. */
	setValue(value: string): void {
		if (this.disabled || this.readonly) return;
		if (this.value === value) return;
		this.#cfg.setValueProp(value);
		this.#cfg.onValueChange?.()?.(value);
	}
}

export type RadioGroupItemConfig = {
	getValue: () => string;
	getDisabled: () => boolean;
	getLoading: () => boolean;
	getColor: () => Color | undefined;
	getInputId: () => string;
	getAriaLabel: () => string | undefined;
};

/** Per-item state: derives checked/disabled/readonly, owns the press + disc fill tween, and exposes radio select + arrow navigation. Shared with `Indicator`/`Label` via item context. */
export class RadioGroupItemState {
	#root: RadioGroupRootState;
	#cfg: RadioGroupItemConfig;
	#pressColor = $state(false);
	readonly press: ReturnType<typeof pressBounce>;
	#activeTween: Tween<number>;

	constructor(root: RadioGroupRootState, cfg: RadioGroupItemConfig) {
		this.#root = root;
		this.#cfg = cfg;
		this.press = pressBounce({
			disabled: () => this.isDisabled || this.isLoading,
			onstart: () => (this.#pressColor = !this.isChecked),
			onsettle: () => (this.#pressColor = false),
			keys: [' ']
		});
		this.#activeTween = new Tween(untrack(() => this.activeTarget), {
			duration: ACTIVE_DURATION,
			easing: cubicOut
		});
	}

	get isChecked(): boolean {
		return this.#root.isChecked(this.#cfg.getValue());
	}
	get isDisabled(): boolean {
		return this.#cfg.getDisabled() || this.#root.disabled;
	}
	get isReadonly(): boolean {
		return this.#root.readonly;
	}
	get isLoading(): boolean {
		return this.#cfg.getLoading();
	}
	get isPressing(): boolean {
		return this.#pressColor;
	}

	get value(): string {
		return this.#cfg.getValue();
	}
	get id(): string {
		return this.#root.itemId(this.#cfg.getValue());
	}
	get inputId(): string {
		return this.#cfg.getInputId();
	}
	get color(): Color {
		return this.#cfg.getColor() ?? this.#root.color;
	}
	get triplet(): string {
		return rgbTriplet(this.color);
	}
	get pressScale(): number {
		return this.press.scale;
	}
	get activeTarget(): number {
		return this.isChecked && !this.isLoading ? 1 : 0;
	}
	/** Tweened 0→1 disc fill amount; drives the `--ap` variable. */
	get activeValue(): number {
		return this.#activeTween.current;
	}

	/** Re-target the disc fill tween, delaying the fill-in slightly when the press cue is active. */
	syncActive(): void {
		const next = this.activeTarget;
		const duration = ACTIVE_DURATION;
		this.#activeTween.set(next, {
			duration,
			easing: cubicOut,
			delay: next === 1 && this.#pressColor ? 50 : 0
		});
	}

	/** Hidden native `<input type=radio>` attribute bag — internal chrome owned by `Indicator`. */
	get inputAttrs(): Record<string, unknown> {
		return {
			type: 'radio' as const,
			class: 'radio__input',
			id: this.inputId,
			name: this.#root.groupName,
			value: this.value,
			checked: this.isChecked,
			disabled: this.isDisabled,
			required: this.#root.required || undefined,
			'aria-label': this.#cfg.getAriaLabel(),
			tabindex: this.#root.roving.tabindexFor(this.id),
			onchange: (event: Event & { currentTarget: EventTarget & HTMLInputElement }) =>
				this.handleChange(event),
			onkeydown: (event: KeyboardEvent) => {
				this.handleKeydown(event);
				this.press.onkeydown(event);
			}
		};
	}

	/** Native change guard: reverts the input while readonly/disabled/loading, otherwise selects. */
	handleChange(event: Event & { currentTarget: EventTarget & HTMLInputElement }): void {
		if (this.isReadonly || this.isDisabled || this.isLoading) {
			event.currentTarget.checked = this.isChecked;
			return;
		}
		if (event.currentTarget.checked) this.select();
	}

	/** Register the hidden input with roving focus; returns the deregister attachment teardown. */
	registerInput(node: HTMLElement): () => void {
		return this.#root.roving.register(this.id, node, () => this.isDisabled);
	}

	select(): void {
		if (this.isDisabled || this.isLoading) return;
		this.#root.setValue(this.#cfg.getValue());
	}

	/** Move focus on arrows/Home/End, then select the newly-focused item (APG follows-focus). No-op while readonly. */
	handleKeydown(event: KeyboardEvent): void {
		if (this.isDisabled || this.isLoading) return;
		const target = event.currentTarget as Element | null;
		if (target) {
			this.#root.roving.dir = getComputedStyle(target).direction === 'rtl' ? 'rtl' : 'ltr';
		}
		this.#root.roving.orientation = this.#root.orientation;
		this.#root.roving.loop = this.#root.loop;
		if (this.#root.roving.handleKeydown(event, this.id)) {
			if (this.#root.readonly) return;
			const nextValue = this.#root.valueOfId(this.#root.roving.current);
			if (nextValue !== undefined && nextValue !== this.#root.value) this.#root.setValue(nextValue);
		}
	}
}
