import { getContext, setContext } from 'svelte';
import type { DialogRootState } from './dialog.svelte';

const KEY = Symbol('Dialog');

export function setDialogCtx(state: DialogRootState): DialogRootState {
	return setContext(KEY, state);
}

export function getDialogCtx(): DialogRootState {
	const ctx = getContext<DialogRootState>(KEY);
	if (!ctx) throw new Error('Dialog parts must be used within <Dialog.Root>');
	return ctx;
}
