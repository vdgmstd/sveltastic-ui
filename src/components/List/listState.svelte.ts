import { createRovingFocus, type RovingFocus } from '../../state/rovingFocus.svelte';
import { createTypeahead, type Typeahead } from '../../state/typeahead.svelte';
import type { Color, Size } from '../../types';
import type { ListRole, ListVariant } from './context';

export type ListRootOptions = {
	variant: () => ListVariant;
	color: () => Color;
	size: () => Size;
	divided: () => boolean;
	disabled: () => boolean;
	role: () => ListRole;
	multiple: () => boolean;
	getSelected: () => unknown;
	setSelected: (value: unknown) => void;
};

/** Root state for the List compound: surface config, selection, roving focus, and typeahead. */
export class ListRootState {
	#opts: ListRootOptions;
	#initialClaimed = false;
	readonly roving: RovingFocus = createRovingFocus({ orientation: 'vertical', loop: true });
	readonly typeahead: Typeahead = createTypeahead();

	constructor(opts: ListRootOptions) {
		this.#opts = opts;
	}

	get variant(): ListVariant {
		return this.#opts.variant();
	}
	get color(): Color {
		return this.#opts.color();
	}
	get size(): Size {
		return this.#opts.size();
	}
	get divided(): boolean {
		return this.#opts.divided();
	}
	get role(): ListRole {
		return this.#opts.role();
	}
	get multiple(): boolean {
		return this.#opts.multiple();
	}
	get disabled(): boolean {
		return this.#opts.disabled();
	}
	get isInteractive(): boolean {
		return this.role !== 'list';
	}

	isSelected(value: unknown): boolean {
		// A value-less row is presentational; never let it match a cleared/undefined selection.
		if (value === undefined) return false;
		const selected = this.#opts.getSelected();
		if (this.multiple) return Array.isArray(selected) && selected.includes(value);
		return selected === value;
	}

	/** Toggle (multiple) or set (single) selection through the single bindable setter. */
	select(value: unknown): void {
		if (this.role !== 'listbox') return;
		if (this.multiple) {
			const current = this.#opts.getSelected();
			const next = Array.isArray(current) ? [...current] : [];
			const idx = next.indexOf(value);
			if (idx >= 0) next.splice(idx, 1);
			else next.push(value);
			this.#opts.setSelected(next);
		} else {
			this.#opts.setSelected(value);
		}
	}

	/** One-shot: claim the initial roving tab-stop for the first active/selected item; never re-fires. */
	claimInitial(id: string): void {
		if (this.#initialClaimed) return;
		this.#initialClaimed = true;
		this.roving.setCurrent(id);
	}
	register(id: string, node: HTMLElement, isDisabled?: () => boolean): () => void {
		return this.roving.register(id, node, isDisabled);
	}
	tabindexFor(id: string): 0 | -1 {
		return this.roving.tabindexFor(id);
	}

	/** Drive arrow / Home / End first, then type-to-focus; returns true when handled. */
	handleKeydown(event: KeyboardEvent, fromId: string): boolean {
		if (this.roving.handleKeydown(event, fromId)) return true;
		return this.#handleTypeahead(event);
	}

	#handleTypeahead(event: KeyboardEvent): boolean {
		if (!this.isInteractive) return false;
		if (event.key.length !== 1 || event.ctrlKey || event.metaKey || event.altKey) return false;
		if (event.key === ' ') return false;
		const row = event.currentTarget as HTMLElement | null;
		const body = row?.closest('.list__body');
		if (!body) return false;
		const rows = Array.from(
			body.querySelectorAll<HTMLElement>('[data-list-id]:not([data-disabled]):not([disabled])')
		);
		if (rows.length === 0) return false;
		const fromIndex = rows.indexOf(document.activeElement as HTMLElement);
		const match = this.typeahead.type(event.key, rows, (node) => node.textContent ?? '', fromIndex);
		if (!match) return false;
		event.preventDefault();
		const matchId = match.dataset.listId;
		if (matchId) this.roving.setCurrent(matchId);
		match.focus();
		return true;
	}

	destroy(): void {
		this.typeahead.destroy();
	}
}

/** Per-item state: resolves color/size/role/selection and the interaction handlers. */
export class ListItemState {
	#root: ListRootState | undefined;
	#value: () => unknown;
	#disabled: () => boolean;
	#loading: () => boolean;
	#selected: () => boolean;
	#isStatic: () => boolean;

	constructor(
		root: ListRootState | undefined,
		value: () => unknown,
		disabled: () => boolean,
		loading: () => boolean,
		selected: () => boolean,
		isStatic: () => boolean
	) {
		this.#root = root;
		this.#value = value;
		this.#disabled = disabled;
		this.#loading = loading;
		this.#selected = selected;
		this.#isStatic = isStatic;
	}

	readonly parentRole: ListRole = $derived.by(() => this.#root?.role ?? 'list');
	readonly isInert: boolean = $derived.by(
		() => this.#disabled() || this.#loading() || (this.#root?.disabled ?? false)
	);
	readonly interactive: boolean = $derived.by(() => !this.#isStatic());
	readonly isRovingItem: boolean = $derived.by(
		() => this.interactive && (this.#root?.isInteractive ?? false)
	);
	readonly isSelected: boolean = $derived.by(
		() =>
			this.#selected() ||
			(this.parentRole === 'listbox' ? (this.#root?.isSelected(this.#value()) ?? false) : false)
	);
	readonly itemRole: 'menuitem' | 'option' | undefined = $derived.by(() =>
		this.parentRole === 'menu' ? 'menuitem' : this.parentRole === 'listbox' ? 'option' : undefined
	);

	handleClick(event: MouseEvent, onclick?: (event: MouseEvent) => void): void {
		if (this.isInert) {
			event.preventDefault();
			event.stopPropagation();
			return;
		}
		if (this.parentRole === 'listbox') {
			this.#root?.select(this.#value());
		}
		onclick?.(event);
	}

	handleKeydown(event: KeyboardEvent, id: string): void {
		if (this.isInert || !this.isRovingItem) return;
		this.#root?.handleKeydown(event, id);
	}

	/** Register for roving focus (node/order tracking only). */
	register(id: string, node: HTMLElement): (() => void) | void {
		if (!this.isRovingItem) return;
		return this.#root?.register(id, node, () => this.isInert);
	}

	/** One-shot initial tab-stop claim for the first active/selected enabled item. */
	claimInitial(id: string, active: boolean): void {
		if (!this.isRovingItem || this.isInert) return;
		if (this.isSelected || active) this.#root?.claimInitial(id);
	}
}
