import {
	toast,
	toaster,
	type ToastOptions,
	type ToastHandle,
	type ToastPosition,
	type ToastEntry
} from '../state/toast.svelte';

export type NotificationPosition = ToastPosition;
export type NotificationOptions = ToastOptions;
export type NotificationHandle = ToastHandle;
export type NotificationEntry = ToastEntry;

/** Legacy alias of the shared toast queue. Prefer `toaster` / the `Toast` API. */
export const notifications = toaster;

/** Convenience: fire-and-forget notify (alias of `toast`). */
export function notify(opts: NotificationOptions = {}): NotificationHandle {
	return toast(opts);
}
