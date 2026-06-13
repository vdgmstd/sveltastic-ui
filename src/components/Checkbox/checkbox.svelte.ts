import { boolAttr } from '../../utils/attrs';
import type { Color } from '../../types';

export type CheckboxGroupConfig = {
	getValue: () => string[];
	setValueProp: (v: string[]) => void;
	onValueChange?: () => ((v: string[]) => void) | undefined;
	getDisabled: () => boolean;
	getReadonly: () => boolean;
	getRequired: () => boolean;
	getName: () => string | undefined;
	getColor: () => Color | undefined;
};

/** Root state for a `<Checkbox.Group>` — proxies the bindable `string[]`, cascades defaults, and registers the label id. */
export class CheckboxGroupState {
	labelId = $state<string | undefined>();

	constructor(private cfg: CheckboxGroupConfig) {}

	get value(): string[] {
		return this.cfg.getValue();
	}
	get disabled(): boolean {
		return this.cfg.getDisabled();
	}
	get readonly(): boolean {
		return this.cfg.getReadonly();
	}
	get required(): boolean {
		return this.cfg.getRequired();
	}
	get name(): string | undefined {
		return this.cfg.getName();
	}
	get color(): Color | undefined {
		return this.cfg.getColor();
	}

	has(token: string): boolean {
		return this.value.includes(token);
	}

	setValue(next: string[]): void {
		this.cfg.setValueProp(next);
		this.cfg.onValueChange?.()?.(next);
	}

	toggle(token: string, next: boolean): void {
		if (this.disabled || this.readonly) return;
		const present = this.has(token);
		if (next && !present) this.setValue([...this.value, token]);
		else if (!next && present) this.setValue(this.value.filter((v) => v !== token));
	}

	registerLabel(id: string): () => void {
		this.labelId = id;
		return () => {
			if (this.labelId === id) this.labelId = undefined;
		};
	}

	readonly wrapperAttrs = $derived({
		role: 'group' as const,
		'aria-labelledby': this.labelId,
		'aria-disabled': this.disabled ? ('true' as const) : undefined,
		'data-disabled': boolAttr(this.disabled),
		'data-readonly': boolAttr(this.readonly),
		'data-testid': 'checkbox-group'
	});
}

export type CheckboxRootConfig = {
	getId: () => string;
	getChecked: () => boolean;
	setCheckedProp: (v: boolean) => void;
	onCheckedChange?: () => ((checked: boolean) => void) | undefined;
	getIndeterminate: () => boolean;
	setIndeterminateProp: (v: boolean) => void;
	onIndeterminateChange?: () => ((indeterminate: boolean) => void) | undefined;
	getToken: () => string | undefined;
	getColor: () => Color | undefined;
	getDisabled: () => boolean | undefined;
	getRequired: () => boolean | undefined;
	getLoading: () => boolean;
	getName: () => string | undefined;
};

/** Root state for a single `<Checkbox.Root>` — proxies checked/indeterminate, resolves group cascade, owns the toggle + icon registry. */
export class CheckboxRootState {
	hasCustomIcon = $state(false);
	pressColor = $state(false);
	#iconCount = $state(0);

	constructor(
		private cfg: CheckboxRootConfig,
		private group: CheckboxGroupState | undefined
	) {}

	get id(): string {
		return this.cfg.getId();
	}
	get token(): string | undefined {
		return this.cfg.getToken();
	}
	get inGroup(): boolean {
		return !!this.group && this.token !== undefined;
	}
	get color(): Color {
		return this.cfg.getColor() ?? this.group?.color ?? 'primary';
	}
	get disabled(): boolean {
		return this.cfg.getDisabled() ?? this.group?.disabled ?? false;
	}
	get required(): boolean {
		return this.cfg.getRequired() ?? this.group?.required ?? false;
	}
	get readonly(): boolean {
		return this.group?.readonly ?? false;
	}
	get loading(): boolean {
		return this.cfg.getLoading();
	}
	get name(): string | undefined {
		return this.cfg.getName() ?? this.group?.name;
	}
	get indeterminate(): boolean {
		return this.cfg.getIndeterminate();
	}

	get isChecked(): boolean {
		return this.inGroup ? this.group!.has(this.token!) : this.cfg.getChecked();
	}

	get fillTarget(): number {
		return this.loading ? 0 : this.isChecked || this.indeterminate ? 1 : 0;
	}
	get drawTarget(): number {
		return this.isChecked && !this.indeterminate && !this.loading ? 1 : 0;
	}
	get minusTarget(): number {
		return this.indeterminate && !this.loading ? 1 : 0;
	}
	get showGlyph(): boolean {
		return this.drawTarget === 1;
	}

	registerIcon(): () => void {
		this.#iconCount += 1;
		this.hasCustomIcon = this.#iconCount > 0;
		return () => {
			this.#iconCount -= 1;
			this.hasCustomIcon = this.#iconCount > 0;
		};
	}

	/** Apply a native toggle: clears indeterminate, updates group membership or the standalone bindable, fires callbacks. */
	toggle(next: boolean): void {
		if (this.disabled || this.loading || this.readonly) return;
		if (this.indeterminate) {
			this.cfg.setIndeterminateProp(false);
			this.cfg.onIndeterminateChange?.()?.(false);
		}
		if (this.inGroup) {
			this.group!.toggle(this.token!, next);
		} else {
			this.cfg.setCheckedProp(next);
		}
		this.cfg.onCheckedChange?.()?.(next);
	}
}
