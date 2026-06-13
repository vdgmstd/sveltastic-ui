import { Tween } from 'svelte/motion';
import { quintOut } from 'svelte/easing';
import { createRovingFocus, type RovingFocus } from '../../state/rovingFocus.svelte';
import type { Color, Shape, Size } from '../../types';
import type { CollapseGroupLayout, CollapseGroupType, CollapseVariant } from './context';

const DURATION = 360;

export type CollapseGroupOptions = {
	type: () => CollapseGroupType;
	value: () => string | string[] | null;
	setValue: (value: string | string[] | null) => void;
	layout: () => CollapseGroupLayout;
	variant: () => CollapseVariant | undefined;
	color: () => Color | undefined;
	size: () => Size | undefined;
	shape: () => Shape | undefined;
	orientation: () => 'vertical' | 'horizontal';
	loop: () => boolean;
	nextKey: () => string;
};

/** Group state: owns selection type, the bonded value, child key registration, the cascade defaults, and roving focus. */
export class CollapseGroupState {
	#opts: CollapseGroupOptions;
	readonly roving: RovingFocus = createRovingFocus({ orientation: 'vertical', loop: true });

	constructor(opts: CollapseGroupOptions) {
		this.#opts = opts;
	}

	get type(): CollapseGroupType {
		return this.#opts.type();
	}
	get layout(): CollapseGroupLayout {
		return this.#opts.layout();
	}
	get variant(): CollapseVariant | undefined {
		return this.#opts.variant();
	}
	get color(): Color | undefined {
		return this.#opts.color();
	}
	get size(): Size | undefined {
		return this.#opts.size();
	}
	get shape(): Shape | undefined {
		return this.#opts.shape();
	}
	get orientation(): 'vertical' | 'horizontal' {
		return this.#opts.orientation();
	}

	register(): string {
		return this.#opts.nextKey();
	}

	isOpen(key: string): boolean {
		const value = this.#opts.value();
		if (this.type === 'single') return value === key;
		return Array.isArray(value) && value.includes(key);
	}

	toggle(key: string, next: boolean): void {
		if (this.type === 'single') {
			this.#opts.setValue(next ? key : null);
			return;
		}
		const value = this.#opts.value();
		const arr = Array.isArray(value) ? value : [];
		this.#opts.setValue(next ? [...arr.filter((k) => k !== key), key] : arr.filter((k) => k !== key));
	}
}

export type CollapseRootOptions = {
	bodyId: string;
	headerId: string;
	key: () => string;
	group: () => CollapseGroupState | undefined;
	open: () => boolean;
	setOpen: (next: boolean) => void;
	disabled: () => boolean;
	ariaLabel: () => string | undefined;
	onOpenChangeComplete: () => ((open: boolean) => void) | undefined;
};

/** Per-item root state: derives openness, owns the aligned caret + openness Tweens, exposes the trigger + content attribute bags. */
export class CollapseRootState {
	#opts: CollapseRootOptions;
	readonly caret: Tween<number>;
	readonly openness: Tween<number>;
	readonly isOpen: boolean;
	readonly bodyId: string;
	readonly headerId: string;
	readonly triggerAttrs: {
		type: 'button';
		id: string;
		'aria-expanded': boolean;
		'aria-controls': string;
		'aria-label': string | undefined;
		disabled: true | undefined;
		'data-state': 'open' | 'closed';
		'data-disabled': '' | undefined;
		onclick: () => void;
		onkeydown: (event: KeyboardEvent) => void;
	};
	readonly contentAttrs: {
		id: string;
		role: 'region';
		'aria-labelledby': string;
		'data-state': 'open' | 'closed';
	};

	constructor(opts: CollapseRootOptions) {
		this.#opts = opts;
		this.bodyId = opts.bodyId;
		this.headerId = opts.headerId;
		const duration = DURATION;
		this.caret = new Tween(0, { duration, easing: quintOut });
		this.openness = new Tween(0, { duration, easing: quintOut });
		this.isOpen = $derived.by(() => this.#opts.open());
		this.triggerAttrs = $derived({
			type: 'button' as const,
			id: this.#opts.headerId,
			'aria-expanded': this.isOpen,
			'aria-controls': this.#opts.bodyId,
			'aria-label': this.#opts.ariaLabel(),
			disabled: this.#opts.disabled() || undefined,
			'data-state': this.isOpen ? ('open' as const) : ('closed' as const),
			'data-disabled': this.#opts.disabled() ? ('' as const) : undefined,
			onclick: () => this.toggle(),
			onkeydown: (event: KeyboardEvent) => this.handleKeydown(event)
		});
		this.contentAttrs = $derived({
			id: this.#opts.bodyId,
			role: 'region' as const,
			'aria-labelledby': this.#opts.headerId,
			'data-state': this.isOpen ? ('open' as const) : ('closed' as const)
		});
	}

	get disabled(): boolean {
		return this.#opts.disabled();
	}

	/** Drive the caret + openness Tweens toward the current open state. */
	syncMotion(): void {
		const target = this.isOpen ? 1 : 0;
		this.caret.target = target;
		this.openness.target = target;
	}

	toggle(): void {
		if (this.#opts.disabled()) return;
		this.#opts.setOpen(!this.isOpen);
	}

	/** Register the trigger node with the group's roving registry; no-op outside a group. */
	registerRoving(node: HTMLElement): (() => void) | void {
		return this.#opts.group()?.roving.register(this.#opts.key(), node, () => this.#opts.disabled());
	}

	completeOpen(): void {
		this.#opts.onOpenChangeComplete?.()?.(true);
	}

	completeClose(): void {
		this.#opts.onOpenChangeComplete?.()?.(false);
	}

	handleKeydown(event: KeyboardEvent): void {
		const group = this.#opts.group();
		if (!group) return;
		const target = event.currentTarget as Element | null;
		if (target && group.orientation === 'horizontal') {
			group.roving.dir = getComputedStyle(target).direction === 'rtl' ? 'rtl' : 'ltr';
		}
		group.roving.handleKeydown(event, this.#opts.key());
	}
}
