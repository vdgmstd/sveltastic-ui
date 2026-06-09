import { getContext, setContext } from 'svelte';
import type { ProgressRootState } from './progress.svelte';

const KEY = Symbol('Progress');

export function setProgressCtx(state: ProgressRootState): ProgressRootState {
	return setContext(KEY, state);
}

export function useProgressCtx(): ProgressRootState {
	const ctx = getContext<ProgressRootState>(KEY);
	if (!ctx) throw new Error('Progress parts must be used within <Progress.Root>');
	return ctx;
}

export type { ProgressRootState };
