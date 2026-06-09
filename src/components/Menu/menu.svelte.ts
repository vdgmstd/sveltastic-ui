import type { Snippet } from 'svelte';
import {
	createRovingFocus,
	getDirectionalKeys,
	type RovingFocus
} from '../../state/rovingFocus.svelte';
import { createTypeahead, type Typeahead } from '../../state/typeahead.svelte';
import type {
	PopoverPlacement,
	PopoverTriggerOn,
	PopoverOpenAnim,
	PopoverRole
} from '../../primitives/Popover.svelte';

export type MenuPlacement = PopoverPlacement;
export type MenuTriggerOn = PopoverTriggerOn;
export type MenuOpenAnim = PopoverOpenAnim;
export type MenuPopupRole = PopoverRole;

/** Config the Root provider hands the root state — getters keep derived chains live, setters proxy the bindable open prop. */
export type MenuConfig = {
	getOpen: () => boolean;
	setOpenProp: (open: boolean) => void;
	readonly closeOnSelect: boolean;
	readonly disabled: boolean;
	onOpenChange?: (open: boolean) => void;
	onOpenChangeComplete?: (open: boolean) => void;
};

/** Funnel a radio group's value to a single owner so RadioItem can read/write the active value through context. */
export type MenuRadioGroupBinding = {
	get value(): string | undefined;
	set: (value: string) => void;
};

/** Root state for the Menu compound: open proxy, roving + typeahead engine, and the part render snippets. */
export class MenuRootState {
	readonly roving: RovingFocus;
	readonly #typeahead: Typeahead = createTypeahead();
	#cfg: MenuConfig;
	#baseId: string;

	triggerSnippet = $state<Snippet<[boolean]> | undefined>(undefined);
	contentSnippet = $state<Snippet<[() => void]> | undefined>(undefined);
	headerSnippet = $state<Snippet<[() => void]> | undefined>(undefined);
	footerSnippet = $state<Snippet<[() => void]> | undefined>(undefined);

	constructor(cfg: MenuConfig, baseId: string) {
		this.#cfg = cfg;
		this.#baseId = baseId;
		this.roving = createRovingFocus({ orientation: 'vertical', loop: true });
	}

	get open(): boolean {
		return this.#cfg.getOpen();
	}
	get closeOnSelect(): boolean {
		return this.#cfg.closeOnSelect;
	}
	get disabled(): boolean {
		return this.#cfg.disabled;
	}

	/** Stable per-row id used as the roving key and the row's `data-menu-id`. */
	itemId(key: string | number): string {
		return `${this.#baseId}-item-${key}`;
	}

	tabindexFor(id: string): 0 | -1 {
		return this.roving.tabindexFor(id);
	}

	register(id: string, node: HTMLElement): () => void {
		return this.roving.register(id, node);
	}

	/** Single open funnel: write the prop, reset nav on close, fire onOpenChange once. */
	setOpen(next: boolean): void {
		if (this.open === next) return;
		this.#cfg.setOpenProp(next);
		if (!next) this.#typeahead.clear();
		this.#cfg.onOpenChange?.(next);
	}

	close = (): void => this.setOpen(false);

	completeOpenChange(open: boolean): void {
		this.#cfg.onOpenChangeComplete?.(open);
	}

	/** Run the row action then dismiss unless the row opted out via `closeOnSelect={false}`. */
	select(rowCloseOnSelect: boolean | undefined): void {
		if ((rowCloseOnSelect ?? this.closeOnSelect) === true) this.close();
	}

	/** True for the arrow / Home / End keys the menu owns, so the host can claim them from Popover. */
	ownsNavKey(key: string): boolean {
		const keys = getDirectionalKeys(this.roving.orientation, this.roving.dir);
		return keys.next.includes(key) || keys.prev.includes(key) || key === keys.first || key === keys.last;
	}

	/** Drive arrow / Home / End / type-to-focus from a row keydown; returns true when handled. */
	handleKeydown(event: KeyboardEvent, listEl: HTMLElement | null): boolean {
		const target = event.target as HTMLElement | null;
		const fromId = target?.dataset.menuId ?? '';
		if (this.roving.handleKeydown(event, fromId)) return true;
		return this.#handleTypeahead(event, listEl);
	}

	#handleTypeahead(event: KeyboardEvent, listEl: HTMLElement | null): boolean {
		if (!listEl) return false;
		if (event.key.length !== 1 || event.ctrlKey || event.metaKey || event.altKey) return false;
		if (event.key === ' ') return false;
		const rows = Array.from(
			listEl.querySelectorAll<HTMLElement>(
				'[role="menuitem"]:not([data-disabled]):not([disabled]),[role="menuitemcheckbox"]:not([data-disabled]):not([disabled]),[role="menuitemradio"]:not([data-disabled]):not([disabled])'
			)
		);
		if (rows.length === 0) return false;
		const fromIndex = rows.indexOf(document.activeElement as HTMLElement);
		const match = this.#typeahead.type(event.key, rows, (node) => node.textContent ?? '', fromIndex);
		if (!match) return false;
		event.preventDefault();
		const id = match.dataset.menuId;
		if (id) this.roving.setCurrent(id);
		match.focus();
		return true;
	}

	destroy(): void {
		this.#typeahead.destroy();
	}
}
