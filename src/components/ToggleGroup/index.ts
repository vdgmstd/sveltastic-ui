import Root from './ToggleGroupRoot.svelte';
import Item from './ToggleGroupItem.svelte';

/** Toggle-button group (bits-ui v2 ToggleGroup). Compound: `ToggleGroup.Root` (`type` single|multiple, roving focus) + `ToggleGroup.Item`. */
export const ToggleGroup = { Root, Item };

export type { ToggleGroupType, ToggleGroupOrientation } from './context';
export type { ToggleGroupValue } from './toggleGroupState.svelte';
export type { ToggleGroupRootProps } from './ToggleGroupRoot.svelte';
export type { ToggleGroupItemProps } from './ToggleGroupItem.svelte';
