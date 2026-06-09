import { FieldShellState } from '../../primitives/fieldShell.svelte';
import type {
	FieldShellConfig,
	InputVariant,
	InputLabelStyle,
	InputState
} from '../../primitives/fieldShell.svelte';

export type { InputVariant, InputLabelStyle, InputState };
export type InputRootConfig = FieldShellConfig;

/** Input Root state — the shared field-shell engine, re-exported under its component-local name. */
export { FieldShellState, FieldShellState as InputRootState };
