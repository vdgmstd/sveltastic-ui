import { createPartContext } from '../../utils/context';
import type { CalendarRootState } from './calendarState.svelte';

const ctx = createPartContext<CalendarRootState>('Calendar', 'Calendar parts must be used within <Calendar.Root>');

export const setCalendarCtx = ctx.set;
export const getCalendarCtx = ctx.get;
