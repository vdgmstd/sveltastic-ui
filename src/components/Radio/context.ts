import { getContext, setContext } from 'svelte';
import type { RadioGroupItemState, RadioGroupRootState } from './radioGroupState.svelte';

export type RadioGroupOrientation = 'horizontal' | 'vertical';

const ROOT_KEY = Symbol('RadioGroup.Root');
const ITEM_KEY = Symbol('RadioGroup.Item');

export function setRadioGroupContext(value: RadioGroupRootState): RadioGroupRootState {
	return setContext(ROOT_KEY, value);
}

export function useRadioGroupContext(): RadioGroupRootState | undefined {
	return getContext<RadioGroupRootState | undefined>(ROOT_KEY);
}

export function setRadioItemContext(value: RadioGroupItemState): RadioGroupItemState {
	return setContext(ITEM_KEY, value);
}

export function useRadioItemContext(): RadioGroupItemState | undefined {
	return getContext<RadioGroupItemState | undefined>(ITEM_KEY);
}
