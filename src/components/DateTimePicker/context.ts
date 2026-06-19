import { createPartContext } from '../../utils/context';
import type { DateTimePickerRootState } from './dateTimePicker.svelte';

const ctx = createPartContext<DateTimePickerRootState>('DateTimePicker', 'DateTimePicker parts must be used within <DateTimePicker.Root>');

export const setDtpCtx = ctx.set;

export const getDtpCtx = ctx.get;
