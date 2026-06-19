import { createPartContext } from '../../utils/context';
import type { ToastEntry } from '../../state/toast.svelte';

/** Per-toast state the Provider shares with Toast.Root + its parts. */
export type ToastItemCtx = {
	readonly entry: ToastEntry;
	readonly closeLabel: string;
	close: () => void;
};

const item = createPartContext<ToastItemCtx>('Toast', 'Toast parts must be used within <Toast.Provider>');

export const setToastCtx = item.set;

export const getToastCtx = item.get;
