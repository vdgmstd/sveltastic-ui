import { createPartContext } from '../../utils/context';
import type { InputRootState } from './input.svelte';

const ctx = createPartContext<InputRootState>('Input', 'Input parts must be used within <Input.Root>');

export const setInputCtx = ctx.set;

export const useInputCtx = ctx.get;

export type { InputRootState };
