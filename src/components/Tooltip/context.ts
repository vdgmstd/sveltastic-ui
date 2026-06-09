import { getContext, setContext } from 'svelte';
import type { TooltipRootState } from './tooltipState.svelte';

/** Side of the trigger the bubble sits on. */
export type TooltipPlacement = 'top' | 'right' | 'bottom' | 'left';
/** How the tooltip is activated. */
export type TooltipTrigger = 'hover' | 'click' | 'manual';

const KEY = Symbol('Tooltip');

export function setTooltipCtx(state: TooltipRootState): TooltipRootState {
	return setContext(KEY, state);
}

export function getTooltipCtx(): TooltipRootState {
	const ctx = getContext<TooltipRootState>(KEY);
	if (!ctx) throw new Error('Tooltip parts must be used within <Tooltip.Root>');
	return ctx;
}
