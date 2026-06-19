import { createPartContext } from '../../utils/context';
import type { PinInputRootState } from './pinInputState.svelte';

/** Allowed-character preset. `numeric` → digits + numeric keypad; `alphanumeric` → letters + digits; `text` → anything. */
export type PinInputType = 'numeric' | 'alphanumeric' | 'text';

/** One visual slot, derived by the Root and handed to `PinInput.Cell`. */
export type PinInputCell = {
	/** The character in this slot, or `null` when empty. */
	char: string | null;
	/** This slot holds the caret (focused + the next-to-fill or last slot). */
	isActive: boolean;
	/** Render a blinking fake caret (active + empty). */
	hasFakeCaret: boolean;
};

const ctx = createPartContext<PinInputRootState>('PinInput');

export const setPinInputCtx = ctx.set;
export const getPinInputCtx = ctx.get;
