import Root from './ChipRoot.svelte';
import Icon from './ChipIcon.svelte';
import Close from './ChipClose.svelte';

/** Tag / token. Compound: `Chip.Root` + `Chip.Icon` (leading glyph) + `Chip.Close` (remove button). */
export const Chip = { Root, Icon, Close };

export type { ChipRootProps, ChipVariant } from './ChipRoot.svelte';
export type { ChipIconProps } from './ChipIcon.svelte';
export type { ChipCloseProps } from './ChipClose.svelte';
