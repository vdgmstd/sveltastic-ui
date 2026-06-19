import { createPartContext } from '../../utils/context';
import type { InputNumberRootState } from './inputNumber.svelte';

const ctx = createPartContext<InputNumberRootState>('InputNumber.Root', '<InputNumber> parts must be used within <InputNumber.Root>');

export const setInputNumberContext = ctx.set;
export const useInputNumberContext = ctx.get;
