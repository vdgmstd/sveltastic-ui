import Root from './Divider.svelte';
import Line from './DividerLine.svelte';
import Label from './DividerLabel.svelte';

/** Visual separator. Compound: `Divider.Root` + `Divider.Line` / `Divider.Label`. */
export const Divider = { Root, Line, Label };

export type {
	DividerRootProps,
	DividerOrientation,
	DividerVariant,
	DividerLabelPlacement
} from './Divider.svelte';
export type { DividerLineProps } from './DividerLine.svelte';
export type { DividerLabelProps } from './DividerLabel.svelte';
