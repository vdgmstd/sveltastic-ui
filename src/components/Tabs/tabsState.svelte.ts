import { crossfade, fade, slide, type TransitionConfig } from 'svelte/transition';
import { cubicOut } from 'svelte/easing';
import { createRovingFocus, type RovingFocus } from '../../state/rovingFocus.svelte';
import type { Color, Size } from '../../types';
import type {
	TabsVariant,
	TabsPanelVariant,
	TabsTransition,
	TabsOrientation,
	TabsActivationMode
} from './context';

export type TabsTransitionFn = (
	node: Element,
	params: { key: string }
) => TransitionConfig | (() => TransitionConfig);

const noopTransition: TabsTransitionFn = () => ({ duration: 0 });

export type TabsRootOptions = {
	baseId: string;
	getValue: () => string | undefined;
	setValueProp: (value: string) => void;
	color: () => Color;
	variant: () => TabsVariant;
	size: () => Size;
	panelVariant: () => TabsPanelVariant;
	transition: () => TabsTransition;
	transitionDuration: () => number;
	orientation: () => TabsOrientation;
	activationMode: () => TabsActivationMode;
	loop: () => boolean;
	disabled: () => boolean;
	ripple: () => boolean;
	onValueChange?: () => ((value: string) => void) | undefined;
};

/** Root state for the Tabs compound: owns selection, ARIA id wiring, roving focus, and the cross-panel transition pair. */
export class TabsRootState {
	#opts: TabsRootOptions;
	#thumbLayer = $state<HTMLElement | undefined>(undefined);
	readonly roving: RovingFocus = createRovingFocus();
	readonly send: TabsTransitionFn;
	readonly receive: TabsTransitionFn;

	#crossfade = $derived.by(() => {
		const duration = this.#opts.transitionDuration();
		return crossfade({
			duration,
			easing: cubicOut,
			fallback: (node) => fade(node, { duration, easing: cubicOut })
		});
	});

	constructor(opts: TabsRootOptions) {
		this.#opts = opts;
		this.send = (node, params) => this.#resolve(0)(node, params);
		this.receive = (node, params) => this.#resolve(1)(node, params);
	}

	#resolve(slot: 0 | 1): TabsTransitionFn {
		const mode = this.#opts.transition();
		const duration = this.#opts.transitionDuration();
		if (mode === 'crossfade') return this.#crossfade[slot];
		if (mode === 'fade') return (node) => fade(node, { duration, easing: cubicOut });
		if (mode === 'slide') return (node) => slide(node, { duration, easing: cubicOut, axis: 'y' });
		return noopTransition;
	}

	get value(): string | undefined {
		return this.#opts.getValue();
	}
	get color(): Color {
		return this.#opts.color();
	}
	get variant(): TabsVariant {
		return this.#opts.variant();
	}
	get size(): Size {
		return this.#opts.size();
	}
	get panelVariant(): TabsPanelVariant {
		return this.#opts.panelVariant();
	}
	get transition(): TabsTransition {
		return this.#opts.transition();
	}
	get orientation(): TabsOrientation {
		return this.#opts.orientation();
	}
	get activationMode(): TabsActivationMode {
		return this.#opts.activationMode();
	}
	get loop(): boolean {
		return this.#opts.loop();
	}
	get disabled(): boolean {
		return this.#opts.disabled();
	}
	get ripple(): boolean {
		return this.#opts.ripple();
	}
	get thumbLayer(): HTMLElement | undefined {
		return this.#thumbLayer;
	}

	tabId(value: string): string {
		return `${this.#opts.baseId}-tab-${value}`;
	}
	panelId(value: string): string {
		return `${this.#opts.baseId}-panel-${value}`;
	}

	setThumbLayer(el: HTMLElement | undefined): void {
		this.#thumbLayer = el;
	}

	/** Select a tab. No-op while disabled or already selected. */
	select(value: string): void {
		if (this.disabled) return;
		if (this.value === value) return;
		this.#opts.setValueProp(value);
		this.#opts.onValueChange?.()?.(value);
	}

	/** Move-driven activation: syncs the roving stop, then selects unless manual+via-focus. */
	activate(value: string, viaFocus: boolean): void {
		this.roving.setCurrent(value);
		if (viaFocus && this.activationMode === 'manual') return;
		this.select(value);
	}

	/** Adopt a default selection while uncontrolled-empty, without firing onValueChange. */
	adoptDefault(value: string, isDisabled: boolean): void {
		if (this.value === undefined && !isDisabled) {
			this.#opts.setValueProp(value);
			this.roving.setCurrent(value);
		}
	}
}

/** Per-tab state: derives the active flag and exposes the trigger behaviour. */
export class TabState {
	#root: TabsRootState;
	#value: () => string;
	#disabled: () => boolean;

	readonly isActive: boolean = $derived.by(() => this.#root.value === this.#value());
	readonly isInert: boolean = $derived.by(() => this.#disabled() || this.#root.disabled);

	constructor(root: TabsRootState, value: () => string, disabled: () => boolean) {
		this.#root = root;
		this.#value = value;
		this.#disabled = disabled;
	}

	get value(): string {
		return this.#value();
	}

	select(): void {
		if (this.isInert) return;
		this.#root.select(this.#value());
	}

	handleFocus(): void {
		if (this.isInert) return;
		this.#root.activate(this.#value(), true);
	}

	handleKeydown(event: KeyboardEvent): void {
		if (this.isInert) return;
		const target = event.currentTarget as Element | null;
		if (target && this.#root.orientation === 'horizontal') {
			this.#root.roving.dir = getComputedStyle(target).direction === 'rtl' ? 'rtl' : 'ltr';
		}
		if (this.#root.roving.handleKeydown(event, this.#value())) {
			const next = this.#root.roving.current;
			if (next && this.#root.activationMode === 'automatic') this.#root.select(next);
		}
	}
}
