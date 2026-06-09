import type { Snippet } from 'svelte';
import { createTypeahead, type Typeahead } from '../../state/typeahead.svelte';
import { rgbTriplet } from '../../utils/color';
import type { Color, ColorName } from '../../types';
import type { InputState, InputLabelStyle, InputVariant } from '../../primitives/fieldShell.svelte';
import type { PopoverOpenAnim } from '../../primitives/Popover.svelte';

export type SelectItem<V = unknown> = {
	/** Stored when this row is picked. */
	value: V;
	/** Visible label. */
	label: string;
	/** Inert row, can't be picked. */
	disabled?: boolean;
};

export type SelectGroup<V = unknown> = {
	/** Section heading. */
	title: string;
	/** Items under this heading. */
	items: ReadonlyArray<SelectItem<V>>;
};

export type SelectItems<V = unknown> = ReadonlyArray<SelectItem<V> | SelectGroup<V>>;

export type SelectOpenAnim = PopoverOpenAnim | 'stagger';

export type SelectType = 'single' | 'multiple';

export type RenderSection<V> = { title?: string; items: SelectItem<V>[] };

/** Config the Root provider hands the root state — getters keep derived chains live, setters proxy the bindable props. */
export type SelectConfig<V> = {
	getOpen: () => boolean;
	setOpenProp: (open: boolean) => void;
	getValue: () => V | V[] | undefined;
	setValueProp: (value: V | V[] | undefined) => void;
	readonly items: SelectItems<V>;
	readonly type: SelectType;
	readonly filter: boolean;
	readonly loop: boolean;
	readonly allowDeselect: boolean;
	readonly placeholder: string;
	readonly disabled: boolean;
	readonly loading: boolean;
	readonly variant: InputVariant;
	readonly fieldState: InputState;
	readonly block: boolean;
	readonly collapseChips: boolean;
	readonly openAnim: SelectOpenAnim;
	readonly labelStyle: InputLabelStyle;
	readonly label: string | undefined;
	readonly color: Color;
	readonly ariaLabel: string | undefined;
	onValueChange?: (value: V | V[] | undefined) => void;
	onOpenChange?: (open: boolean) => void;
	onOpenChangeComplete?: (open: boolean) => void;
};

function isGroup<V>(it: SelectItem<V> | SelectGroup<V>): it is SelectGroup<V> {
	return 'items' in it && Array.isArray(it.items);
}

/** Root state for the Select compound: owns data, selection, active-descendant nav, typeahead, the ARIA id registry, and the slot snippets. */
export class SelectRootState<V = unknown> {
	#cfg: SelectConfig<V>;
	#typeahead: Typeahead = createTypeahead();

	readonly triggerId: string;
	readonly contentId: string;

	filterText = $state('');
	activeIndex = $state(-1);
	justOpened = $state(false);

	triggerSnippet = $state<Snippet | undefined>(undefined);
	contentSnippet = $state<Snippet<[() => void]> | undefined>(undefined);
	valueSnippet = $state<Snippet | undefined>(undefined);
	iconSnippet = $state<Snippet | undefined>(undefined);
	emptySnippet = $state<Snippet | undefined>(undefined);
	chipSnippet = $state<Snippet<[SelectItem<V>, () => void]> | undefined>(undefined);
	hasCustomValue = $state(false);

	constructor(cfg: SelectConfig<V>, triggerId: string, contentId: string) {
		this.#cfg = cfg;
		this.triggerId = triggerId;
		this.contentId = contentId;
	}

	get open(): boolean {
		return this.#cfg.getOpen();
	}
	get items(): SelectItems<V> {
		return this.#cfg.items;
	}
	get type(): SelectType {
		return this.#cfg.type;
	}
	get isMultiple(): boolean {
		return this.#cfg.type === 'multiple';
	}
	get filter(): boolean {
		return this.#cfg.filter;
	}
	get loop(): boolean {
		return this.#cfg.loop;
	}
	get allowDeselect(): boolean {
		return this.#cfg.allowDeselect;
	}
	get placeholder(): string {
		return this.#cfg.placeholder;
	}
	get disabled(): boolean {
		return this.#cfg.disabled;
	}
	get loading(): boolean {
		return this.#cfg.loading;
	}
	get variant(): InputVariant {
		return this.#cfg.variant;
	}
	get fieldState(): InputState {
		return this.#cfg.fieldState;
	}
	get block(): boolean {
		return this.#cfg.block;
	}
	get collapseChips(): boolean {
		return this.#cfg.collapseChips;
	}
	get openAnim(): SelectOpenAnim {
		return this.#cfg.openAnim;
	}
	get labelStyle(): InputLabelStyle {
		return this.#cfg.labelStyle;
	}
	get label(): string | undefined {
		return this.#cfg.label;
	}
	get color(): Color {
		return this.#cfg.color;
	}
	get ariaLabel(): string | undefined {
		return this.#cfg.ariaLabel;
	}

	readonly resolvedColor: Color = $derived.by(() =>
		this.#cfg.fieldState === 'default' ? this.#cfg.color : (this.#cfg.fieldState as ColorName)
	);
	readonly triplet: string = $derived.by(() => rgbTriplet(this.resolvedColor));

	readonly panelAnim: PopoverOpenAnim = $derived.by(() =>
		this.#cfg.openAnim === 'stagger' ? 'slide' : this.#cfg.openAnim
	);
	readonly isStagger: boolean = $derived.by(() => this.#cfg.openAnim === 'stagger');

	/** Stable per-row id for `aria-activedescendant` / `role="option"`. */
	optionId(globalIndex: number): string {
		return `${this.contentId}-opt-${globalIndex}`;
	}

	get activeId(): string | undefined {
		return this.activeIndex >= 0 ? this.optionId(this.activeIndex) : undefined;
	}

	readonly flatItems: SelectItem<V>[] = $derived.by(() => {
		const out: SelectItem<V>[] = [];
		for (const it of this.#cfg.items) {
			if (isGroup(it)) for (const sub of it.items) out.push(sub);
			else out.push(it);
		}
		return out;
	});

	readonly renderSections: RenderSection<V>[] = $derived.by(() => {
		const q = this.filterText.trim().toLowerCase();
		const matches = (lbl: string) => !q || lbl.toLowerCase().includes(q);
		const result: RenderSection<V>[] = [];
		let buffer: SelectItem<V>[] = [];
		const flush = () => {
			if (buffer.length) result.push({ items: buffer });
			buffer = [];
		};
		for (const it of this.#cfg.items) {
			if (isGroup(it)) {
				flush();
				const matched = it.items.filter((s) => matches(s.label));
				if (matched.length) result.push({ title: it.title, items: [...matched] });
			} else if (matches(it.label)) {
				buffer.push(it);
			}
		}
		flush();
		return result;
	});

	readonly sectionOffsets: number[] = $derived.by(() => {
		const offsets: number[] = [];
		let acc = 0;
		for (const section of this.renderSections) {
			offsets.push(acc);
			acc += section.items.length;
		}
		return offsets;
	});

	readonly visibleItems: SelectItem<V>[] = $derived.by(() => {
		const out: SelectItem<V>[] = [];
		for (const section of this.renderSections) for (const it of section.items) out.push(it);
		return out;
	});

	readonly chipItems: SelectItem<V>[] = $derived.by(() => {
		const value = this.#cfg.getValue();
		if (!this.isMultiple || !Array.isArray(value)) return [];
		const lookup = new Map<V, SelectItem<V>>();
		for (const it of this.flatItems) lookup.set(it.value, it);
		return value.map((v) => lookup.get(v) ?? ({ value: v, label: String(v) } as SelectItem<V>));
	});

	readonly selectedItem: SelectItem<V> | undefined = $derived.by(() => {
		if (this.isMultiple) return undefined;
		return this.flatItems.find((i) => i.value === this.#cfg.getValue());
	});

	readonly displayLabel: string = $derived.by(() => {
		if (this.isMultiple) return '';
		if (this.selectedItem) return this.selectedItem.label;
		const value = this.#cfg.getValue();
		return value == null ? '' : String(value);
	});

	readonly inputValue: string = $derived.by(() => {
		if (this.isMultiple) return '';
		if (this.#cfg.filter && this.open) return this.filterText;
		return this.displayLabel;
	});

	isSelected = (v: V): boolean => {
		const value = this.#cfg.getValue();
		if (this.isMultiple) return Array.isArray(value) && value.includes(v);
		return value === v;
	};

	setValue(next: V | V[] | undefined): void {
		this.#cfg.setValueProp(next);
		this.#cfg.onValueChange?.(next);
	}

	/** Single open funnel: write the prop, reset nav, fire onOpenChange once. Drives both Popover binding and internal closes. */
	setOpen(next: boolean): void {
		if (this.open === next) return;
		this.#cfg.setOpenProp(next);
		this.#applyOpenSideEffects(next);
		this.#cfg.onOpenChange?.(next);
	}

	#applyOpenSideEffects(next: boolean): void {
		this.#typeahead.clear();
		if (next) {
			this.justOpened = true;
			const selected = this.visibleItems.findIndex((it) => this.isSelected(it.value));
			this.activeIndex = selected >= 0 ? selected : this.#firstEnabled(0, 1);
		} else {
			this.filterText = '';
			this.activeIndex = -1;
			this.justOpened = false;
		}
	}

	completeOpenChange(open: boolean): void {
		this.#cfg.onOpenChangeComplete?.(open);
	}

	pick = (item: SelectItem<V>): void => {
		if (item.disabled) return;
		if (this.isMultiple) {
			const value = this.#cfg.getValue();
			const arr = Array.isArray(value) ? [...value] : [];
			const idx = arr.indexOf(item.value);
			if (idx === -1) arr.push(item.value);
			else arr.splice(idx, 1);
			this.setValue(arr);
		} else if (this.#cfg.allowDeselect && this.isSelected(item.value)) {
			this.setValue(undefined);
		} else {
			this.setValue(item.value);
		}
		this.filterText = '';
	};

	removeChip = (v: V): void => {
		const value = this.#cfg.getValue();
		if (!Array.isArray(value)) return;
		this.setValue(value.filter((x) => x !== v));
	};

	setFilterText = (text: string): void => {
		this.filterText = text;
		this.activeIndex = this.visibleItems.length ? this.#firstEnabled(0, 1) : -1;
	};

	#firstEnabled(from: number, dir: 1 | -1): number {
		const items = this.visibleItems;
		const len = items.length;
		if (!len) return -1;
		if (this.#cfg.loop) {
			for (let step = 0; step < len; step++) {
				const idx = ((((from + dir * step) % len) + len) % len);
				if (!items[idx].disabled) return idx;
			}
			return -1;
		}
		for (let idx = from; idx >= 0 && idx < len; idx += dir) {
			if (!items[idx].disabled) return idx;
		}
		return this.activeIndex;
	}

	/** Move the active option by `dir`, skipping disabled rows and wrapping per `loop`. */
	moveActive(dir: 1 | -1): void {
		const len = this.visibleItems.length;
		if (!len) return;
		const from = this.activeIndex < 0 ? (dir === 1 ? -1 : 0) : this.activeIndex + dir;
		this.activeIndex = this.#firstEnabled(from, dir);
	}

	activateEdge(edge: 'first' | 'last'): void {
		const len = this.visibleItems.length;
		if (!len) return;
		this.activeIndex =
			edge === 'first' ? this.#firstEnabled(0, 1) : this.#firstEnabled(len - 1, -1);
	}

	pickActive = (): void => {
		const item = this.visibleItems[this.activeIndex];
		if (item) this.pick(item);
	};

	/** Type-to-jump over visible options when the inline filter is off. */
	typeahead(char: string): boolean {
		const items = this.visibleItems;
		if (!items.length) return false;
		const match = this.#typeahead.type(char, items, (it) => it.label, this.activeIndex);
		if (!match) return false;
		this.activeIndex = items.indexOf(match);
		return true;
	}

	/** Clear the just-opened one-shot once the entrance stagger has played. */
	clearJustOpened = (): void => {
		this.justOpened = false;
	};

	/** Trigger keyboard map — ArrowDown/Up nav, Home/End edges, Enter pick, typeahead. */
	handleTriggerKeydown = (e: KeyboardEvent): void => {
		if (this.disabled) return;
		const open = this.open;
		switch (e.key) {
			case 'ArrowDown':
				if (!open) return;
				e.preventDefault();
				e.stopPropagation();
				this.moveActive(1);
				return;
			case 'ArrowUp':
				if (!open) return;
				e.preventDefault();
				e.stopPropagation();
				this.moveActive(-1);
				return;
			case 'Home':
				if (!open) return;
				e.preventDefault();
				e.stopPropagation();
				this.activateEdge('first');
				return;
			case 'End':
				if (!open) return;
				e.preventDefault();
				e.stopPropagation();
				this.activateEdge('last');
				return;
			case 'Enter':
				if (!open || this.activeIndex < 0) return;
				e.preventDefault();
				e.stopPropagation();
				this.pickActive();
				if (!this.isMultiple) this.setOpen(false);
				return;
			default:
				if (!open || this.filter) return;
				if (
					e.key.length === 1 &&
					!e.ctrlKey &&
					!e.metaKey &&
					!e.altKey &&
					this.typeahead(e.key)
				)
					e.preventDefault();
		}
	};

	/** Release the type-ahead timer; call from a destroy hook. */
	destroy(): void {
		this.#typeahead.destroy();
	}
}
