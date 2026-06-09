import { getContext, setContext } from 'svelte';
import type { InputNumberRootState } from './inputNumber.svelte';

const ROOT_KEY = Symbol('InputNumber.Root');

export function setInputNumberContext(value: InputNumberRootState): InputNumberRootState {
	return setContext(ROOT_KEY, value);
}

export function useInputNumberContext(): InputNumberRootState {
	const ctx = getContext<InputNumberRootState | undefined>(ROOT_KEY);
	if (!ctx) throw new Error('<InputNumber> parts must be used within <InputNumber.Root>');
	return ctx;
}
