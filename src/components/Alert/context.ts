import { createPartContext } from '../../utils/context';
import type { AlertRootState } from './alert.svelte';

const ctx = createPartContext<AlertRootState>('Alert', 'Alert parts must be used within <Alert.Root>');

export const setAlertCtx = ctx.set;
export const getAlertCtx = ctx.get;
