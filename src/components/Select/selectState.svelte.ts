import { type Snippet } from 'svelte';
import {
	createListbox,
	type Listbox,
	type ListItem,
	type ListGroup,
	type ListCollection,
	type ListType,
	type ListRenderSection
} from '../../state/listbox.svelte';
import { rgbTriplet } from '../../utils/color';
import type { Color, ColorName } from '../../types';
import type { InputState, InputLabelStyle, InputVariant } from '../../primitives/fieldShell.svelte';
import type { PopoverOpenAnim } from '../../primitives/Popover.svelte';
import type { PortalTarget } from '../../actions/portal';

export type SelectItem<V = unknown> = ListItem<V>;
export type SelectGroup<V = unknown> = ListGroup<V>;
export type SelectItems<V = unknown> = ListCollection<V>;
export type RenderSection<V> = ListRenderSection<V>;

export type SelectOpenAnim = PopoverOpenAnim | 'stagger';

export type SelectType = ListType;

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
	readonly emptyText: string;
	onValueChange?: (value: V | V[] | undefined) => void;
	onOpenChange?: (open: boolean) => void;
	onOpenChangeComplete?: (open: boolean) => void;
};

/** Root state for the Select compound: wraps the shared listbox engine and adds the field-shell visuals, panel animation, ARIA ids, and slot snippets. */
export class SelectRootState<V = unknown> {
	#cfg: SelectConfig<V>;
	#list: Listbox<V>;

	readonly triggerId: string;
	readonly contentId: string;

	filterText = $state('');
	justOpened = $state(false);

	triggerSnippet = $state<Snippet<[Record<string, unknown>]> | undefined>(undefined);
	contentSnippet = $state<Snippet<[() => void]> | undefined>(undefined);
	valueSnippet = $state<Snippet | undefined>(undefined);
	iconSnippet = $state<Snippet | undefined>(undefined);
	emptySnippet = $state<Snippet | undefined>(undefined);
	chipSnippet = $state<Snippet<[SelectItem<V>, () => void]> | undefined>(undefined);
	hasCustomValue = $state(false);
	/** Rest-props (class, style, data and aria attributes) `Select.Content` forwards onto the rendered panel body. */
	contentProps = $state<Record<string, unknown>>({});
	/** `Select.Content`'s render-delegation snippet, applied to the panel body by the Popover. */
	contentChild = $state<Snippet<[{ props: Record<string, unknown>; body: Snippet }]> | undefined>(
		undefined
	);
	/** Writes the rendered panel-body node back into `Select.Content`'s bindable `ref`. */
	setContentRef = $state<((node: HTMLElement | null) => void) | undefined>(undefined);
	/** Set by an optional `Select.Portal` wrapper; consumed by the Popover that renders the panel. */
	portal = $state<{ target?: PortalTarget; disabled?: boolean; forceMount?: boolean }>({});

	constructor(cfg: SelectConfig<V>, triggerId: string, contentId: string) {
		this.#cfg = cfg;
		this.triggerId = triggerId;
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
			getFilterText: () => this.filterText,
			optionIdBase: contentId,
			onPick: () => {
				this.filterText = '';
			}
		});
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
		return this.#list.isMultiple;
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
	get emptyText(): string {
		return this.#cfg.emptyText;
	}

	readonly resolvedColor: Color = $derived.by(() =>
		this.#cfg.fieldState === 'default' ? this.#cfg.color : (this.#cfg.fieldState as ColorName)
	);
	readonly triplet: string = $derived.by(() => rgbTriplet(this.resolvedColor));

	readonly panelAnim: PopoverOpenAnim = $derived.by(() =>
		this.#cfg.openAnim === 'stagger' ? 'slide' : this.#cfg.openAnim
	);
	readonly isStagger: boolean = $derived.by(() => this.#cfg.openAnim === 'stagger');

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

	get renderSections(): RenderSection<V>[] {
		return this.#list.renderSections;
	}
	get sectionOffsets(): number[] {
		return this.#list.sectionOffsets;
	}
	get visibleItems(): SelectItem<V>[] {
		return this.#list.visibleItems;
	}
	get chipItems(): SelectItem<V>[] {
		return this.#list.chipItems;
	}
	get selectedItem(): SelectItem<V> | undefined {
		return this.#list.selectedItem;
	}
	get displayLabel(): string {
		return this.#list.selectedLabel;
	}

	readonly inputValue: string = $derived.by(() => {
		if (this.isMultiple) return '';
		if (this.#cfg.filter && this.open) return this.filterText;
		return this.displayLabel;
	});

	isSelected = (v: V): boolean => this.#list.isSelected(v);

	pick = (item: SelectItem<V>): void => this.#list.pick(item);

	removeChip = (v: V): void => this.#list.removeChip(v);

	/** Single open funnel: write the prop, reset nav, fire onOpenChange once. Drives both Popover binding and internal closes. */
	setOpen(next: boolean): void {
		if (this.open === next) return;
		this.#cfg.setOpenProp(next);
		this.#applyOpenSideEffects(next);
		this.#cfg.onOpenChange?.(next);
	}

	#applyOpenSideEffects(next: boolean): void {
		this.#list.clearTypeahead();
		if (next) {
			this.justOpened = true;
			this.#list.syncActiveToSelection();
		} else {
			this.filterText = '';
			this.#list.resetActive();
			this.justOpened = false;
		}
	}

	completeOpenChange(open: boolean): void {
		this.#cfg.onOpenChangeComplete?.(open);
	}

	setFilterText = (text: string): void => {
		this.filterText = text;
		this.#list.refreshActiveForFilter();
	};

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
				this.#list.moveActive(1);
				return;
			case 'ArrowUp':
				if (!open) return;
				e.preventDefault();
				e.stopPropagation();
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
			default:
				if (!open || this.filter) return;
				if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey && this.#list.typeahead(e.key))
					e.preventDefault();
		}
	};

	/** Release the type-ahead timer; call from a destroy hook. */
	destroy(): void {
		this.#list.destroy();
	}
}
