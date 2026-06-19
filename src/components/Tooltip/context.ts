import { createPartContext } from '../../utils/context';
import type { TooltipRootState } from './tooltipState.svelte';

/** Side of the trigger the bubble sits on. */
export type TooltipPlacement = 'top' | 'right' | 'bottom' | 'left';
/** How the tooltip is activated. */
export type TooltipTrigger = 'hover' | 'click' | 'manual';

const ctx = createPartContext<TooltipRootState>('Tooltip', 'Tooltip parts must be used within <Tooltip.Root>');

export const setTooltipCtx = ctx.set;
export const getTooltipCtx = ctx.get;
