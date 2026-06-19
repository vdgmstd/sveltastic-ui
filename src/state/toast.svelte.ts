import type { Snippet } from 'svelte';
import type { Color } from '../types';

export type ToastPosition =
	| 'top-right'
	| 'top-left'
	| 'top-center'
	| 'bottom-right'
	| 'bottom-left'
	| 'bottom-center';

/** Data + handle handed to a custom `content` snippet so it can compose Toast parts. */
export type ToastRenderContext = {
	toast: ToastEntry;
	close: () => void;
};

export type ToastOptions = {
	/** Headline. */
	title?: string;
	/** Body text. */
	text?: string;
	/** Body text (bits-ui / sonner name; alias of `text`). */
	description?: string;
	/** Variant tint. */
	color?: Color;
	/** Render an outline ring instead of filled tint. */
	border?: boolean;
	/** Sticky — does not auto-close. */
	sticky?: boolean;
	/** Show the close button. */
	closable?: boolean;
	/** Accessible label for the close button. */
	closeLabel?: string;
	/** Drop the rounded corners. */
	square?: boolean;
	/** ms before auto-close (ignored when sticky). */
	duration?: number;
	/** Loading spinner instead of icon. */
	loading?: boolean;
	/** Where to anchor on the screen. */
	position?: ToastPosition;
	/** Custom icon snippet (replaces the variant default). */
	icon?: Snippet;
	/** Full custom body — receives the toast entry + a close handle; compose Toast.Root + parts. */
	content?: Snippet<[ToastRenderContext]>;
	/** Click handler. */
	onclick?: () => void;
	/** Close on body click. */
	clickClose?: boolean;
	/** Fired when the toast is dismissed. */
	onclose?: () => void;
};

export type ToastHandle = {
	id: number;
	close: () => void;
};

export type ToastEntry = ToastOptions & { id: number };

let nextSeq = 0;

class ToastStore {
	entries = $state<ToastEntry[]>([]);

	add(opts: ToastOptions = {}): ToastHandle {
		nextSeq += 1;
		const id = nextSeq;
		this.entries = [...this.entries, { ...opts, id }];
		return { id, close: () => this.close(id) };
	}

	/** Back-compat alias of `add` (the legacy notifications API). */
	notify(opts: ToastOptions = {}): ToastHandle {
		return this.add(opts);
	}

	close(id: number): void {
		const entry = this.entries.find((e) => e.id === id);
		this.entries = this.entries.filter((e) => e.id !== id);
		entry?.onclose?.();
	}

	closeAll(): void {
		for (const e of this.entries) e.onclose?.();
		this.entries = [];
	}
}

/** Shared toast queue. Host components render it; `toast()` / `notify()` push to it. */
export const toaster = new ToastStore();

/** Fire a toast; returns an id + close() handle. Pass `content` for a fully custom body. */
export function toast(opts: ToastOptions = {}): ToastHandle {
	return toaster.add(opts);
}
