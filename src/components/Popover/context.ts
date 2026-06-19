import { createPartContext } from '../../utils/context';
import type { PopoverRootState } from './popover.svelte';

const root = createPartContext<PopoverRootState>(
	'Popover',
	'Popover parts must be used within <Popover.Root>'
);

export const setPopoverCtx = root.set;

export const getPopoverCtx = root.get;
