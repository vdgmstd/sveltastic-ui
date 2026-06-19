import Root from './PopoverRoot.svelte';
import Trigger from './PopoverTrigger.svelte';
import Portal from './PopoverPortal.svelte';
import Content from './PopoverContent.svelte';
import Close from './PopoverClose.svelte';

/** Anchored popover. Pure compound: `Popover.Root` + `Trigger`/`Portal`/`Content`/`Close`, over the kit's shared floating engine. */
export const Popover = {
	Root,
	Trigger,
	Portal,
	Content,
	Close
};

export type { PopoverRootProps } from './PopoverRoot.svelte';
export type { PopoverTriggerProps } from './PopoverTrigger.svelte';
export type { PopoverPortalProps } from './PopoverPortal.svelte';
export type { PopoverContentProps } from './PopoverContent.svelte';
export type { PopoverCloseProps } from './PopoverClose.svelte';
