import type { PinInputCell, PinInputType } from './context';

const CHAR_FILTER: Record<PinInputType, RegExp | null> = {
	numeric: /[0-9]/,
	alphanumeric: /[a-zA-Z0-9]/,
	text: null
};

export type PinInputRootOptions = {
	getValue: () => string;
	setValueProp: (value: string) => void;
	onValueChange?: () => ((value: string) => void) | undefined;
	onComplete?: () => ((value: string) => void) | undefined;
	maxLength: () => number;
	type: () => PinInputType;
	pattern: () => RegExp | undefined;
	pasteTransformer: () => ((text: string) => string) | undefined;
	disabled: () => boolean;
};

/** Root state for PinInput: one hidden input drives the value; the cells are a derived view of it. */
export class PinInputRootState {
	#opts: PinInputRootOptions;
	#input: HTMLInputElement | null = null;
	focused = $state(false);

	constructor(opts: PinInputRootOptions) {
		this.#opts = opts;
	}

	get value(): string {
		return this.#opts.getValue();
	}
	get maxLength(): number {
		return this.#opts.maxLength();
	}
	get disabled(): boolean {
		return this.#opts.disabled();
	}
	get type(): PinInputType {
		return this.#opts.type();
	}
	get inputMode(): 'numeric' | 'text' {
		return this.type === 'numeric' ? 'numeric' : 'text';
	}

	#allow(char: string): boolean {
		const pattern = this.#opts.pattern();
		if (pattern) return pattern.test(char);
		const filter = CHAR_FILTER[this.type];
		return filter ? filter.test(char) : true;
	}

	/** Keep only allowed characters, clamped to maxLength. */
	#sanitize(raw: string): string {
		let out = '';
		for (const ch of raw) {
			if (out.length >= this.maxLength) break;
			if (this.#allow(ch)) out += ch;
		}
		return out;
	}

	/** The slots, derived from value + focus. Active slot = the next empty (or the last when full). */
	readonly cells: PinInputCell[] = $derived.by(() => {
		const value = this.value;
		const n = this.maxLength;
		const activeIndex = this.focused ? Math.min(value.length, n - 1) : -1;
		return Array.from({ length: n }, (_, i) => {
			const char = i < value.length ? value[i] : null;
			const isActive = i === activeIndex;
			return { char, isActive, hasFakeCaret: isActive && char === null };
		});
	});

	#commit(next: string): void {
		if (next === this.value) return;
		this.#opts.setValueProp(next);
		this.#opts.onValueChange?.()?.(next);
		if (next.length === this.maxLength) this.#opts.onComplete?.()?.(next);
	}

	#caretToEnd(): void {
		const el = this.#input;
		if (!el) return;
		const end = el.value.length;
		try {
			el.setSelectionRange(end, end);
		} catch {
			/* setSelectionRange unsupported on this input type */
		}
	}

	setInput(el: HTMLInputElement | null): void {
		this.#input = el;
	}

	handleInput(event: Event): void {
		const el = event.currentTarget as HTMLInputElement;
		if (this.disabled) {
			el.value = this.value;
			return;
		}
		const next = this.#sanitize(el.value);
		el.value = next;
		this.#caretToEnd();
		this.#commit(next);
	}

	handlePaste(event: ClipboardEvent): void {
		if (this.disabled) return;
		event.preventDefault();
		const raw = event.clipboardData?.getData('text') ?? '';
		const transform = this.#opts.pasteTransformer();
		const next = this.#sanitize(transform ? transform(raw) : raw);
		if (this.#input) this.#input.value = next;
		this.#caretToEnd();
		this.#commit(next);
	}

	handleFocus(): void {
		this.focused = true;
		this.#caretToEnd();
	}

	handleBlur(): void {
		this.focused = false;
	}
}
