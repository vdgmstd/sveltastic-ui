import Root from './RadioGroup.svelte';
import Item from './RadioGroupItem.svelte';
import Indicator from './RadioGroupIndicator.svelte';
import Label from './RadioGroupLabel.svelte';

/** Single-select radio group. Pure compound: `RadioGroup.Root` + `RadioGroup.Item` + `RadioGroup.Indicator` + `RadioGroup.Label`. */
export const RadioGroup = { Root, Item, Indicator, Label };

export type { RadioGroupRootProps } from './RadioGroup.svelte';
export type { RadioGroupItemProps } from './RadioGroupItem.svelte';
export type { RadioGroupIndicatorProps } from './RadioGroupIndicator.svelte';
export type { RadioGroupLabelProps } from './RadioGroupLabel.svelte';
export type { RadioGroupOrientation } from './context';
