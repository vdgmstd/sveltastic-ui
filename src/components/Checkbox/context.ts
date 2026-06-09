import { getContext, setContext } from 'svelte';
import type { CheckboxGroupState, CheckboxRootState } from './checkbox.svelte';

const GROUP_KEY = Symbol('CheckboxGroup');
const ROOT_KEY = Symbol('CheckboxRoot');

export function setCheckboxGroupContext(value: CheckboxGroupState): CheckboxGroupState {
	return setContext(GROUP_KEY, value);
}

export function useCheckboxGroupContext(): CheckboxGroupState | undefined {
	return getContext<CheckboxGroupState | undefined>(GROUP_KEY);
}

export function setCheckboxRootContext(value: CheckboxRootState): CheckboxRootState {
	return setContext(ROOT_KEY, value);
}

export function useCheckboxRootContext(): CheckboxRootState {
	const ctx = getContext<CheckboxRootState | undefined>(ROOT_KEY);
	if (!ctx) throw new Error('<Checkbox.Indicator>/<Checkbox.Icon>/<Checkbox.Label> must be used within <Checkbox.Root>');
	return ctx;
}
