import { createPartContext } from '../../utils/context';
import type { CheckboxGroupState, CheckboxRootState } from './checkbox.svelte';

const groupCtx = createPartContext<CheckboxGroupState>('CheckboxGroup');
export const setCheckboxGroupContext = groupCtx.set;
export const useCheckboxGroupContext = groupCtx.find;

const rootCtx = createPartContext<CheckboxRootState>('CheckboxRoot', '<Checkbox.Indicator>/<Checkbox.Icon>/<Checkbox.Label> must be used within <Checkbox.Root>');
export const setCheckboxRootContext = rootCtx.set;
export const useCheckboxRootContext = rootCtx.get;
