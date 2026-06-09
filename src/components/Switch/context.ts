import { getContext, setContext } from 'svelte';
import type { SwitchRootState } from './switchState.svelte';

const KEY = Symbol('Switch');

export function setSwitchContext(value: SwitchRootState): SwitchRootState {
	return setContext(KEY, value);
}

export function useSwitchContext(): SwitchRootState {
	const ctx = getContext<SwitchRootState | undefined>(KEY);
	if (!ctx) throw new Error('<Switch.Thumb>/<Switch.Icon>/<Switch.Label> must be used within <Switch.Root>');
	return ctx;
}
