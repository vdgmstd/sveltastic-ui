import { getContext, setContext } from 'svelte';
import type { InputRootState } from './input.svelte';

const KEY = Symbol('Input');

export function setInputCtx(state: InputRootState): InputRootState {
	return setContext(KEY, state);
}

export function useInputCtx(): InputRootState {
	const ctx = getContext<InputRootState>(KEY);
	if (!ctx) throw new Error('Input parts must be used within <Input.Root>');
	return ctx;
}

export type { InputRootState };
