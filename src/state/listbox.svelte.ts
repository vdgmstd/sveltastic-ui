import { untrack } from 'svelte';
import { createTypeahead, type Typeahead } from './typeahead.svelte';

export type ListItem<V = unknown> = {
	/** Stored when this row is picked. */
	value: V;
	/** Visible label. */
	label: string;
	/** Inert row, can't be picked. */
	disabled?: boolean;
};

export type ListGroup<V = unknown> = {
	/** Section heading. */
	title: string;
	/** Items under this heading. */
	items: ReadonlyArray<ListItem<V>>;
};

export type ListCollection<V = unknown> = ReadonlyArray<ListItem<V> | ListGroup<V>>;

export type ListType = 'single' | 'multiple';

export type ListRenderSection<V> = { title?: string; items: ListItem<V>[] };

/** Reactive config the host hands the listbox engine — getters keep the derived chains live, `commitValue` proxies the bindable value. */
export type ListboxConfig<V> = {
	getItems: () => ListCollection<V>;
	getValue: () => V | V[] | undefined;
	commitValue: (value: V | V[] | undefined) => void;
	getType: () => ListType;
	getLoop: () => boolean;
	getAllowDeselect: () => boolean;
	/** Inline filter query; `''` shows every row (host-controlled filtering). */
	getFilterText: () => string;
	/** Stable base for `aria-activedescendant` / `role="option"` ids. */
	optionIdBase: string;
	/** Fires after a successful pick — host resets its filter/input text here. */
	onPick?: (item: ListItem<V>) => void;
};

function isGroup<V>(it: ListItem<V> | ListGroup<V>): it is ListGroup<V> {
	return 'items' in it && Array.isArray(it.items);
}

/** Shared listbox engine for Select + Combobox: item collection, filtering, group flattening, active-descendant nav, typeahead, selection. */
class Listbox<V = unknown> {
	#cfg: ListboxConfig<V>;
	#typeahead: Typeahead = createTypeahead();

	activeIndex = $state(-1);

	/** Mount-order registry for auto-indexed items (manual composition). */
	#registry = $state<symbol[]>([]);

	constructor(cfg: ListboxConfig<V>) {
		this.#cfg = cfg;
	}

	get isMultiple(): boolean {
		return this.#cfg.getType() === 'multiple';
	}

	/** Stable per-row id for `aria-activedescendant` / `role="option"`. */
	optionId(globalIndex: number): string {
		return `${this.#cfg.optionIdBase}-opt-${globalIndex}`;
	}

	get activeId(): string | undefined {
		return this.activeIndex >= 0 ? this.optionId(this.activeIndex) : undefined;
	}

	/**
	 * Claim a stable mount-order slot for an auto-indexed item; returns the unregister hook.
	 * Untracked: called from a registering `$effect`; mutating `#registry` here must not subscribe that effect.
	 */
	registerItem(token: symbol): () => void {
		untrack(() => this.#registry.push(token));
		return () => {
			untrack(() => {
				const i = this.#registry.indexOf(token);
				if (i !== -1) this.#registry.splice(i, 1);
			});
		};
	}

	/** Flat index of an auto-registered item, matching `visibleItems` order. */
	itemIndex(token: symbol): number {
		return this.#registry.indexOf(token);
	}

	readonly flatItems: ListItem<V>[] = $derived.by(() => {
		const out: ListItem<V>[] = [];
		for (const it of this.#cfg.getItems()) {
			if (isGroup(it)) for (const sub of it.items) out.push(sub);
			else out.push(it);
		}
		return out;
	});

	readonly renderSections: ListRenderSection<V>[] = $derived.by(() => {
		const q = this.#cfg.getFilterText().trim().toLowerCase();
		const matches = (lbl: string) => !q || lbl.toLowerCase().includes(q);
		const result: ListRenderSection<V>[] = [];
		let buffer: ListItem<V>[] = [];
		const flush = () => {
			if (buffer.length) result.push({ items: buffer });
			buffer = [];
		};
		for (const it of this.#cfg.getItems()) {
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

	readonly visibleItems: ListItem<V>[] = $derived.by(() => {
		const out: ListItem<V>[] = [];
		for (const section of this.renderSections) for (const it of section.items) out.push(it);
		return out;
	});

	readonly chipItems: ListItem<V>[] = $derived.by(() => {
		const value = this.#cfg.getValue();
		if (!this.isMultiple || !Array.isArray(value)) return [];
		const lookup = new Map<V, ListItem<V>>();
		for (const it of this.flatItems) lookup.set(it.value, it);
		return value.map((v) => lookup.get(v) ?? ({ value: v, label: String(v) } as ListItem<V>));
	});

	readonly selectedItem: ListItem<V> | undefined = $derived.by(() => {
		if (this.isMultiple) return undefined;
		return this.flatItems.find((i) => i.value === this.#cfg.getValue());
	});

	/** Label for the current single selection (empty in multiple mode). */
	readonly selectedLabel: string = $derived.by(() => {
		if (this.isMultiple) return '';
		if (this.selectedItem) return this.selectedItem.label;
		const value = this.#cfg.getValue();
		return value == null ? '' : String(value);
	});

	isSelected = (v: V): boolean => {
		const value = this.#cfg.getValue();
		if (this.isMultiple) return Array.isArray(value) && value.includes(v);
		return value === v;
	};

	pick = (item: ListItem<V>): void => {
		if (item.disabled) return;
		if (this.isMultiple) {
			const value = this.#cfg.getValue();
			const arr = Array.isArray(value) ? [...value] : [];
			const idx = arr.indexOf(item.value);
			if (idx === -1) arr.push(item.value);
			else arr.splice(idx, 1);
			this.#cfg.commitValue(arr);
		} else if (this.#cfg.getAllowDeselect() && this.isSelected(item.value)) {
			this.#cfg.commitValue(undefined);
		} else {
			this.#cfg.commitValue(item.value);
		}
		this.#cfg.onPick?.(item);
	};

	removeChip = (v: V): void => {
		const value = this.#cfg.getValue();
		if (!Array.isArray(value)) return;
		this.#cfg.commitValue(value.filter((x) => x !== v));
	};

	#firstEnabled(from: number, dir: 1 | -1): number {
		const items = this.visibleItems;
		const len = items.length;
		if (!len) return -1;
		if (this.#cfg.getLoop()) {
			for (let step = 0; step < len; step++) {
				const idx = (((from + dir * step) % len) + len) % len;
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

	/** Type-to-jump over visible options (used when the inline filter is off). */
	typeahead(char: string): boolean {
		const items = this.visibleItems;
		if (!items.length) return false;
		const match = this.#typeahead.type(char, items, (it) => it.label, this.activeIndex);
		if (!match) return false;
		this.activeIndex = items.indexOf(match);
		return true;
	}

	clearTypeahead(): void {
		this.#typeahead.clear();
	}

	/** Active = the selected row (or first enabled) — call when the panel opens. */
	syncActiveToSelection(): void {
		const selected = this.visibleItems.findIndex((it) => this.isSelected(it.value));
		this.activeIndex = selected >= 0 ? selected : this.#firstEnabled(0, 1);
	}

	resetActive(): void {
		this.activeIndex = -1;
	}

	/** Re-seat the active row to the first enabled match after the filter text changes. */
	refreshActiveForFilter(): void {
		this.activeIndex = this.visibleItems.length ? this.#firstEnabled(0, 1) : -1;
	}

	/** Release the type-ahead timer; call from a destroy hook. */
	destroy(): void {
		this.#typeahead.destroy();
	}
}

/** Create the shared listbox engine for a Select / Combobox root. */
export function createListbox<V = unknown>(cfg: ListboxConfig<V>): Listbox<V> {
	return new Listbox<V>(cfg);
}

export type { Listbox };
