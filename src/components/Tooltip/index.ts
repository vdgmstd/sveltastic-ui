import Root from './Tooltip.svelte';
import Trigger from './TooltipTrigger.svelte';
import Content from './TooltipContent.svelte';
import Arrow from './TooltipArrow.svelte';

/** Anchored hover/focus tooltip. Compound: `Tooltip.Root` + `Trigger`/`Content`/`Arrow`. */
export const Tooltip = { Root, Trigger, Content, Arrow };

export type { TooltipRootProps } from './Tooltip.svelte';
export type { TooltipTriggerProps } from './TooltipTrigger.svelte';
export type { TooltipContentProps } from './TooltipContent.svelte';
export type { TooltipArrowProps } from './TooltipArrow.svelte';
export type { TooltipPlacement, TooltipTrigger } from './context';
