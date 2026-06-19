import { createPartContext } from '../../utils/context';
import type { DialogRootState } from './dialog.svelte';

const ctx = createPartContext<DialogRootState>('Dialog', 'Dialog parts must be used within <Dialog.Root>');

export const setDialogCtx = ctx.set;
export const getDialogCtx = ctx.get;
