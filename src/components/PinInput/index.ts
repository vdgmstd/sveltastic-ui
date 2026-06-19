import Root from './PinInput.svelte';
import Cell from './PinInputCell.svelte';

/** OTP / pin input (bits-ui v2 PinInput). Compound: `PinInput.Root` (one hidden input drives the value) + `PinInput.Cell` (one per slot, via the `{ cells }` snippet). */
export const PinInput = { Root, Cell };

export type { PinInputType, PinInputCell } from './context';
export type { PinInputRootProps } from './PinInput.svelte';
export type { PinInputCellProps } from './PinInputCell.svelte';
