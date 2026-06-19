import { createPartContext } from '../../utils/context';
import type { ProgressRootState } from './progress.svelte';

const ctx = createPartContext<ProgressRootState>('Progress', 'Progress parts must be used within <Progress.Root>');

export const setProgressCtx = ctx.set;

export const useProgressCtx = ctx.get;

export type { ProgressRootState };
