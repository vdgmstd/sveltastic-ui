import { getContext, setContext } from 'svelte';
import type { CalendarRootState } from './calendarState.svelte';

const KEY = Symbol('Calendar');

export function setCalendarCtx(state: CalendarRootState): CalendarRootState {
	return setContext(KEY, state);
}

export function getCalendarCtx(): CalendarRootState {
	const ctx = getContext<CalendarRootState>(KEY);
	if (!ctx) throw new Error('Calendar parts must be used within <Calendar.Root>');
	return ctx;
}
