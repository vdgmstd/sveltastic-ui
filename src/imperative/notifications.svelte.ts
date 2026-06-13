import type { Snippet } from 'svelte';
import type { Color } from '../types';

export type NotificationPosition =
	| 'top-right'
	| 'top-left'
	| 'top-center'
	| 'bottom-right'
	| 'bottom-left'
	| 'bottom-center';

export type NotificationOptions = {
	/** Headline. */
	title?: string;
	/** Body text. */
	text?: string;
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
	position?: NotificationPosition;
	/** Custom icon snippet (replaces the variant default). */
	icon?: Snippet;
	/** Click handler. */
	onclick?: () => void;
	/** Close on body click. */
	clickClose?: boolean;
	/** Fired when the notification is dismissed. */
	onclose?: () => void;
};

export type NotificationHandle = {
	id: number;
	close: () => void;
};

export type NotificationEntry = NotificationOptions & { id: number };

class NotificationsState {
	entries = $state<NotificationEntry[]>([]);
	#nextId = 0;

	notify(opts: NotificationOptions = {}): NotificationHandle {
		this.#nextId += 1;
		const id = this.#nextId;
		this.entries = [...this.entries, { ...opts, id }];
		return { id, close: () => this.close(id) };
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

export const notifications = new NotificationsState();

/** Convenience: fire-and-forget notify. */
export function notify(opts: NotificationOptions = {}): NotificationHandle {
	return notifications.notify(opts);
}
