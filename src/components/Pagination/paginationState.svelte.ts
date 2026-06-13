import { createRovingFocus, type RovingFocus } from '../../state/rovingFocus.svelte';
import type { Color, Shape, Size } from '../../types';
import type { PaginationItem, PaginationMode, PaginationVariant } from './context';

const SMALL_COUNT = 6;

export type PaginationRootOptions = {
	baseId: string;
	getPage: () => number;
	setPageProp: (page: number) => void;
	length: () => number;
	max: () => number;
	dottedJump: () => number;
	infinite: () => boolean;
	mode: () => PaginationMode;
	variant: () => PaginationVariant;
	size: () => Size;
	shape: () => Shape;
	color: () => Color;
	ripple: () => boolean;
	disabled: () => boolean;
	disabledItems: () => number[];
	loadingItems: () => number[];
	pageLabel: () => (page: number) => string;
	ariaLabelPrev: () => string;
	ariaLabelNext: () => string;
	ariaLabelJumpPrev: () => string;
	ariaLabelJumpNext: () => string;
	onPageChange?: () => ((page: number) => void) | undefined;
};

/** Root state for the Pagination compound: owns selection, the page-items window, roving focus, and ARIA wiring. */
export class PaginationRootState {
	#opts: PaginationRootOptions;
	readonly roving: RovingFocus = createRovingFocus({ orientation: 'horizontal' });

	constructor(opts: PaginationRootOptions) {
		this.#opts = opts;
	}

	get page(): number {
		return this.#opts.getPage();
	}
	get length(): number {
		return this.#opts.length();
	}
	get max(): number {
		// Clamp to >=5 so the middle-window innerSpan (max-5) can't go negative and drop the current page.
		return Math.max(5, this.#opts.max());
	}
	get dottedJump(): number {
		return this.#opts.dottedJump();
	}
	get infinite(): boolean {
		return this.#opts.infinite();
	}
	get mode(): PaginationMode {
		return this.#opts.mode();
	}
	get variant(): PaginationVariant {
		return this.#opts.variant();
	}
	get size(): Size {
		return this.#opts.size();
	}
	get shape(): Shape {
		return this.#opts.shape();
	}
	get color(): Color {
		return this.#opts.color();
	}
	get ripple(): boolean {
		return this.#opts.ripple();
	}
	get disabled(): boolean {
		return this.#opts.disabled();
	}
	get disabledItems(): number[] {
		return this.#opts.disabledItems();
	}
	get loadingItems(): number[] {
		return this.#opts.loadingItems();
	}
	get pageLabel(): (page: number) => string {
		return this.#opts.pageLabel();
	}
	get ariaLabelPrev(): string {
		return this.#opts.ariaLabelPrev();
	}
	get ariaLabelNext(): string {
		return this.#opts.ariaLabelNext();
	}
	get ariaLabelJumpPrev(): string {
		return this.#opts.ariaLabelJumpPrev();
	}
	get ariaLabelJumpNext(): string {
		return this.#opts.ariaLabelJumpNext();
	}

	/** Displayed page, clamped so a value left stale by a shrinking `length` can't overflow aria/progress. */
	readonly safeValue: number = $derived.by(() =>
		this.length > 0 ? Math.max(1, Math.min(this.length, this.page)) : 1
	);

	/** Page-button window with ellipsis gaps — frozen algorithm (pixel contract). */
	readonly items: PaginationItem[] = $derived.by(() => this.#buildPageItems());

	readonly range: { start: number; end: number } = $derived.by(() => {
		const pages = this.items.filter((it): it is { kind: 'page'; n: number } => it.kind === 'page');
		return { start: pages[0]?.n ?? 0, end: pages[pages.length - 1]?.n ?? 0 };
	});

	readonly progressPercent: number = $derived.by(() => {
		const len = this.length;
		if (len > 1) return ((this.safeValue - 1) * 100) / (len - 1);
		return len === 1 ? 100 : 0;
	});

	#buildPageItems(): PaginationItem[] {
		const length = this.length;
		if (length <= 0) return [];
		// Dots mode renders every page with no ellipsis windowing.
		if (this.mode === 'dots') return Array.from({ length }, (_, i) => ({ kind: 'page', n: i + 1 }));
		if (length <= SMALL_COUNT || this.max >= length) {
			return Array.from({ length }, (_, i) => ({ kind: 'page', n: i + 1 }));
		}

		const max = this.max;
		const safeValue = this.safeValue;
		const half = Math.floor(max / 2);
		const startCutoff = half;
		const endCutoff = length - half + 1;

		if (safeValue > startCutoff && safeValue < endCutoff) {
			const innerSpan = max - 5;
			const start = Math.max(2, safeValue - Math.floor((max - 4) / 2));
			const end = Math.min(length - 1, start + innerSpan);
			const result: PaginationItem[] = [
				{ kind: 'page', n: 1 },
				{ kind: 'gap', direction: 'prev' }
			];
			for (let i = start; i <= end; i += 1) result.push({ kind: 'page', n: i });
			result.push({ kind: 'gap', direction: 'next' }, { kind: 'page', n: length });
			return result;
		}

		const result: PaginationItem[] = [];
		for (let i = 1; i <= half; i += 1) result.push({ kind: 'page', n: i });
		result.push({ kind: 'gap', direction: 'next' });
		for (let i = endCutoff; i <= length; i += 1) result.push({ kind: 'page', n: i });
		return result;
	}

	pageId(n: number): string {
		return `${this.#opts.baseId}-page-${n}`;
	}

	gapId(direction: 'prev' | 'next'): string {
		return `${this.#opts.baseId}-gap-${direction}`;
	}

	isItemDisabled(n: number): boolean {
		return this.disabledItems.includes(n);
	}
	isItemLoading(n: number): boolean {
		return this.loadingItems.includes(n);
	}

	/** Select a page. No-op while disabled or already selected; clamps into range. */
	setPage(n: number): void {
		if (this.disabled) return;
		const clamped = Math.max(1, Math.min(this.length, n));
		if (clamped === this.page) return;
		this.#opts.setPageProp(clamped);
		this.#opts.onPageChange?.()?.(clamped);
	}

	goPrev(): void {
		if (this.page > 1) this.setPage(this.page - 1);
		else if (this.infinite) this.setPage(this.length);
	}
	goNext(): void {
		if (this.page < this.length) this.setPage(this.page + 1);
		else if (this.infinite) this.setPage(1);
	}
	jump(direction: 'prev' | 'next'): void {
		this.setPage(direction === 'next' ? this.safeValue + this.dottedJump : this.safeValue - this.dottedJump);
	}

	/** Roving keyboard nav across page buttons; RTL-aware via the focused element's computed direction. */
	handleKeydown(event: KeyboardEvent, from: number): void {
		this.#handleRovingKeydown(event, this.pageId(from));
	}

	/** Roving keyboard nav from a jump-ellipsis; shares the page registry so arrows step into the gap. */
	handleGapKeydown(event: KeyboardEvent, direction: 'prev' | 'next'): void {
		this.#handleRovingKeydown(event, this.gapId(direction));
	}

	#handleRovingKeydown(event: KeyboardEvent, fromId: string): void {
		if (this.disabled) return;
		const target = event.currentTarget as Element | null;
		if (target) {
			this.roving.dir = getComputedStyle(target).direction === 'rtl' ? 'rtl' : 'ltr';
		}
		this.roving.handleKeydown(event, fromId);
	}
}
