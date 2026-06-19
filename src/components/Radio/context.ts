import { createPartContext } from '../../utils/context';
import type { RadioGroupItemState, RadioGroupRootState } from './radioGroupState.svelte';

export type RadioGroupOrientation = 'horizontal' | 'vertical';

const groupCtx = createPartContext<RadioGroupRootState>('RadioGroup.Root');
export const setRadioGroupContext = groupCtx.set;
export const useRadioGroupContext = groupCtx.find;

const itemCtx = createPartContext<RadioGroupItemState>('RadioGroup.Item');
export const setRadioItemContext = itemCtx.set;
export const useRadioItemContext = itemCtx.find;
