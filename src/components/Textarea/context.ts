import { createPartContext } from '../../utils/context';
import type { TextareaRootState } from './textarea.svelte';

const ctx = createPartContext<TextareaRootState>('Textarea', 'Textarea parts must be used within <Textarea.Root>');

export const setTextareaCtx = ctx.set;

export const useTextareaCtx = ctx.get;

export type { TextareaRootState };
