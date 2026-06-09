import { getContext, setContext } from 'svelte';
import type { TextareaRootState } from './textarea.svelte';

const KEY = Symbol('Textarea');

export function setTextareaCtx(state: TextareaRootState): TextareaRootState {
	return setContext(KEY, state);
}

export function useTextareaCtx(): TextareaRootState {
	const ctx = getContext<TextareaRootState>(KEY);
	if (!ctx) throw new Error('Textarea parts must be used within <Textarea.Root>');
	return ctx;
}

export type { TextareaRootState };
