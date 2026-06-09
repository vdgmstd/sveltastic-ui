import type { Component } from 'svelte';
import Root from './Select.svelte';
import Trigger from './SelectTrigger.svelte';
import Value from './SelectValue.svelte';
import Icon from './SelectIcon.svelte';
import Content from './SelectContent.svelte';
import Viewport from './SelectViewport.svelte';
import Item from './SelectItem.svelte';
import ItemText from './SelectItemText.svelte';
import ItemIndicator from './SelectItemIndicator.svelte';
import Group from './SelectGroup.svelte';
import GroupHeading from './SelectGroupHeading.svelte';
import Empty from './SelectEmpty.svelte';
import Chip from './SelectChip.svelte';

import type { SelectRootProps } from './Select.svelte';
import type { SelectTriggerProps } from './SelectTrigger.svelte';
import type { SelectValueProps } from './SelectValue.svelte';
import type { SelectIconProps } from './SelectIcon.svelte';
import type { SelectContentProps } from './SelectContent.svelte';
import type { SelectViewportProps } from './SelectViewport.svelte';
import type { SelectItemProps } from './SelectItem.svelte';
import type { SelectItemTextProps } from './SelectItemText.svelte';
import type { SelectItemIndicatorProps } from './SelectItemIndicator.svelte';
import type { SelectGroupProps } from './SelectGroup.svelte';
import type { SelectGroupHeadingProps } from './SelectGroupHeading.svelte';
import type { SelectEmptyProps } from './SelectEmpty.svelte';
import type { SelectChipProps } from './SelectChip.svelte';

/** Combobox/listbox select. Pure compound: `Select.Root` + `Trigger`/`Value`/`Icon`/`Content`/`Viewport`/`Item`/`ItemText`/`ItemIndicator`/`Group`/`GroupHeading`/`Empty`/`Chip`. */
// Generic parts emit via svelte2tsx's internal alias; cast each to the public `Component` form so the namespace object still emits its `index.d.ts` under build:ui.
export const Select = {
	Root,
	Trigger,
	Value,
	Icon,
	Content,
	Viewport,
	Item,
	ItemText,
	ItemIndicator,
	Group,
	GroupHeading,
	Empty,
	Chip
} as {
	Root: Component<SelectRootProps<any>, {}, 'open' | 'value'>;
	Trigger: Component<SelectTriggerProps<any>, {}, 'ref'>;
	Value: Component<SelectValueProps<any>, {}, ''>;
	Icon: Component<SelectIconProps, {}, ''>;
	Content: Component<SelectContentProps, {}, ''>;
	Viewport: Component<SelectViewportProps, {}, 'ref'>;
	Item: Component<SelectItemProps<any>, {}, 'ref'>;
	ItemText: Component<SelectItemTextProps, {}, 'ref'>;
	ItemIndicator: Component<SelectItemIndicatorProps, {}, 'ref'>;
	Group: Component<SelectGroupProps, {}, 'ref'>;
	GroupHeading: Component<SelectGroupHeadingProps, {}, 'ref'>;
	Empty: Component<SelectEmptyProps, {}, ''>;
	Chip: Component<SelectChipProps<any>, {}, ''>;
};

export type {
	SelectItem,
	SelectGroup,
	SelectItems,
	SelectOpenAnim,
	SelectType
} from './selectState.svelte';
export type { SelectRootProps } from './Select.svelte';
export type { SelectTriggerProps } from './SelectTrigger.svelte';
export type { SelectValueProps } from './SelectValue.svelte';
export type { SelectIconProps } from './SelectIcon.svelte';
export type { SelectContentProps } from './SelectContent.svelte';
export type { SelectViewportProps } from './SelectViewport.svelte';
export type { SelectItemProps } from './SelectItem.svelte';
export type { SelectItemTextProps } from './SelectItemText.svelte';
export type { SelectItemIndicatorProps } from './SelectItemIndicator.svelte';
export type { SelectGroupProps } from './SelectGroup.svelte';
export type { SelectGroupHeadingProps } from './SelectGroupHeading.svelte';
export type { SelectEmptyProps } from './SelectEmpty.svelte';
export type { SelectChipProps, SelectChipPayload } from './SelectChip.svelte';
