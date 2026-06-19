import { type Snippet } from 'svelte';
import {
	createListbox,
	type Listbox,
	type ListItem,
	type ListGroup,
	type ListCollection,
	type ListType
} from '../../state/listbox.svelte';
import { rgbTriplet } from '../../utils/color';
import type { Color, ColorName } from '../../types';
import type { InputState, InputLabelStyle, InputVariant } from '../../primitives/fieldShell.svelte';
import type { PopoverOpenAnim } from '../../primitives/Popover.svelte';
import type { PortalTarget } from '../../actions/portal';

export type ComboboxItem<V = unknown> = ListItem<V>;
export type ComboboxGroup<V = unknown> = ListGroup<V>;
export type ComboboxItems<V = unknown> = ListCollection<V>;
export type ComboboxType = ListType;

/** Config the Root provider hands the root state — getters keep derived chains live, setters proxy the bindable props. */
export type ComboboxConfig<V> = {
	getOpen: () => boolean;
	setOpenProp: (open: boolean) => void;
	getValue: () => V | V[] | undefined;
	setValueProp: (value: V | V[] | undefined) => void;
	getInputValue: () => string;
	setInputValueProp: (value: string) => void;
	readonly items: ComboboxItems<V>;
	readonly type: ComboboxType;
	readonly filter: boolean;
	readonly loop: boolean;
	readonly allowDeselect: boolean;
	readonly placeholder: string;
	readonly disabled: boolean;
	readonly loading: boolean;
	readonly variant: InputVariant;
	readonly fieldState: InputState;
	readonly block: boolean;
	readonly openAnim: PopoverOpenAnim;
	readonly labelStyle: InputLabelStyle;
	readonly label: string | undefined;
	readonly color: Color;
	readonly ariaLabel: string | undefined;
	readonly emptyText: string;
	onValueChange?: (value: V | V[] | undefined) => void;
	onInputValueChange?: (value: string) => void;
	onOpenChange?: (open: boolean) => void;
	onOpenChangeComplete?: (open: boolean) => void;
};

/** Root state for the Combobox compound: wraps the shared listbox engine and adds the editable field, bindable input value, panel, and slot snippets. */
export class ComboboxRootState<V = unknown> {
	#cfg: ComboboxConfig<V>;
	#list: Listbox<V>;

	readonly inputId: string;
	readonly contentId: string;

	triggerSnippet = $state<Snippet<[Record<string, unknown>]> | undefined>(undefined);
	contentSnippet = $state<Snippet<[() => void]> | undefined>(undefined);
	emptySnippet = $state<Snippet | undefined>(undefined);
	iconSnippet = $state<Snippet | undefined>(undefined);
	/** Rest-props `Combobox.Content` forwards onto the rendered panel body. */
	contentProps = $state<Record<string, unknown>>({});
	/** `Combobox.Content`'s render-delegation snippet, applied to the panel body by the Popover. */
	contentChild = $state<Snippet<[{ props: Record<string, unknown>; body: Snippet }]> | undefined>(
		undefined
	);
	/** Writes the rendered panel-body node back into `Combobox.Content`'s bindable `ref`. */
	setContentRef = $state<((node: HTMLElement | null) => void) | undefined>(undefined);
	/** Set by an optional `Combobox.Portal` wrapper; consumed by the Popover that renders the panel. */
	portal = $state<{ target?: PortalTarget; disabled?: boolean; forceMount?: boolean }>({});

	constructor(cfg: ComboboxConfig<V>, inputId: string, contentId: string) {
		this.#cfg = cfg;
		this.inputId = inputId;
		this.contentId = contentId;
		this.#list = createListbox<V>({
			getItems: () => cfg.items,
			getValue: () => cfg.getValue(),
			commitValue: (v) => {
				cfg.setValueProp(v);
				cfg.onValueChange?.(v);
			},
			getType: () => cfg.type,
			getLoop: () => cfg.loop,
			getAllowDeselect: () => cfg.allowDeselect,
			getFilterText: () => (cfg.filter ? cfg.getInputValue() : ''),
			optionIdBase: contentId,
			onPick: (item) => this.#afterPick(item)
		});
	}

	get open(): boolean {
		return this.#cfg.getOpen();
	}
	get items(): ComboboxItems<V> {
		return this.#cfg.items;
	}
	get type(): ComboboxType {
		return this.#cfg.type;
	}
	get isMultiple(): boolean {
		return this.#list.isMultiple;
	}
	get filter(): boolean {
		return this.#cfg.filter;
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
	get emptyText(): string {
		return this.#cfg.emptyText;
	}

	readonly resolvedColor: Color = $derived.by(() =>
		this.#cfg.fieldState === 'default' ? this.#cfg.color : (this.#cfg.fieldState as ColorName)
	);
	readonly triplet: string = $derived.by(() => rgbTriplet(this.resolvedColor));

	readonly panelAnim: PopoverOpenAnim = $derived.by(() => this.#cfg.openAnim);

	get activeIndex(): number {
		return this.#list.activeIndex;
	}
	set activeIndex(value: number) {
		this.#list.activeIndex = value;
	}
	get activeId(): string | undefined {
		return this.#list.activeId;
	}
	optionId(globalIndex: number): string {
		return this.#list.optionId(globalIndex);
	}

	registerItem(token: symbol): () => void {
		return this.#list.registerItem(token);
	}
	itemIndex(token: symbol): number {
		return this.#list.itemIndex(token);
	}

	get renderSections() {
		return this.#list.renderSections;
	}
	get sectionOffsets(): number[] {
		return this.#list.sectionOffsets;
	}
	get visibleItems(): ComboboxItem<V>[] {
		return this.#list.visibleItems;
	}
	get chipItems(): ComboboxItem<V>[] {
		return this.#list.chipItems;
	}
	get selectedItem(): ComboboxItem<V> | undefined {
		return this.#list.selectedItem;
	}
	get selectedLabel(): string {
		return this.#list.selectedLabel;
	}

	get inputValue(): string {
		return this.#cfg.getInputValue();
	}

	/** Value shown in the editable field: the typed query while filtering, otherwise the single selection's label. */
	readonly displayValue: string = $derived.by(() => {
		if (this.#cfg.filter && !this.isMultiple) {
			return this.open ? this.#cfg.getInputValue() : this.#list.selectedLabel;
		}
		return this.#cfg.getInputValue();
	});

	isSelected = (v: V): boolean => this.#list.isSelected(v);

	pick = (item: ComboboxItem<V>): void => this.#list.pick(item);

	removeChip = (v: V): void => this.#list.removeChip(v);

	#commitInput(text: string): void {
		this.#cfg.setInputValueProp(text);
		this.#cfg.onInputValueChange?.(text);
	}

	#afterPick(item: ComboboxItem<V>): void {
		if (this.#cfg.filter) {
			this.#commitInput('');
		} else if (!this.isMultiple) {
			this.#commitInput(item.label);
		}
	}

	/** Field `oninput`: store the query, open the panel, re-seat the active option. */
	setInputValue = (text: string): void => {
		this.#commitInput(text);
		if (!this.open) this.setOpen(true);
		this.#list.refreshActiveForFilter();
	};

	/** Single open funnel: write the prop, run side effects, fire onOpenChange once. */
	setOpen(next: boolean): void {
		if (this.open === next) return;
		this.#cfg.setOpenProp(next);
		this.#applyOpenSideEffects(next);
		this.#cfg.onOpenChange?.(next);
	}

	#applyOpenSideEffects(next: boolean): void {
		this.#list.clearTypeahead();
		if (next) {
			if (this.#cfg.filter) this.#commitInput('');
			this.#list.syncActiveToSelection();
		} else {
			if (this.#cfg.filter) this.#commitInput('');
			this.#list.resetActive();
		}
	}

	completeOpenChange(open: boolean): void {
		this.#cfg.onOpenChangeComplete?.(open);
	}

	/** Field keyboard map — Arrow nav, Home/End edges, Enter pick, Escape close. */
	handleInputKeydown = (e: KeyboardEvent): void => {
		if (this.disabled) return;
		const open = this.open;
		switch (e.key) {
			case 'ArrowDown':
				e.preventDefault();
				e.stopPropagation();
				if (!open) {
					this.setOpen(true);
					return;
				}
				this.#list.moveActive(1);
				return;
			case 'ArrowUp':
				e.preventDefault();
				e.stopPropagation();
				if (!open) {
					this.setOpen(true);
					return;
				}
				this.#list.moveActive(-1);
				return;
			case 'Home':
				if (!open) return;
				e.preventDefault();
				e.stopPropagation();
				this.#list.activateEdge('first');
				return;
			case 'End':
				if (!open) return;
				e.preventDefault();
				e.stopPropagation();
				this.#list.activateEdge('last');
				return;
			case 'Enter':
				if (!open || this.activeIndex < 0) return;
				e.preventDefault();
				e.stopPropagation();
				this.#list.pickActive();
				if (!this.isMultiple) this.setOpen(false);
				return;
		}
	};

	/** Release the type-ahead timer; call from a destroy hook. */
	destroy(): void {
		this.#list.destroy();
	}
}
