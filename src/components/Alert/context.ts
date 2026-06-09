import { getContext, setContext } from 'svelte';
import type { AlertRootState } from './alert.svelte';

const KEY = Symbol('Alert');

export function setAlertCtx(state: AlertRootState): AlertRootState {
	return setContext(KEY, state);
}

export function getAlertCtx(): AlertRootState {
	const ctx = getContext<AlertRootState>(KEY);
	if (!ctx) throw new Error('Alert parts must be used within <Alert.Root>');
	return ctx;
}
