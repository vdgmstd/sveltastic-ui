import { getContext, setContext } from 'svelte';
import type { DateTimePickerRootState } from './dateTimePicker.svelte';

const KEY = Symbol('DateTimePicker');

export function setDtpCtx(state: DateTimePickerRootState): DateTimePickerRootState {
	return setContext(KEY, state);
}

export function getDtpCtx(): DateTimePickerRootState {
	const ctx = getContext<DateTimePickerRootState>(KEY);
	if (!ctx) throw new Error('DateTimePicker parts must be used within <DateTimePicker.Root>');
	return ctx;
}
