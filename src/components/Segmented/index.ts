import type { Component } from 'svelte';
import Root from './Segmented.svelte';
import Item from './SegmentedItem.svelte';
import ItemIcon from './SegmentedItemIcon.svelte';

import type { SegmentedRootProps } from './Segmented.svelte';
import type { SegmentedItemProps } from './SegmentedItem.svelte';
import type { SegmentedItemIconProps } from './SegmentedItemIcon.svelte';

/** Single-select segmented control. Compound: `Segmented.Root` + `Segmented.Item` + `Segmented.ItemIcon`. */
// Generic parts emit via svelte2tsx's internal alias which a plain object can't name; cast to the public `Component` form (value erased to `any` on the barrel, parts stay generic internally).
export const Segmented = { Root, Item, ItemIcon } as {
	Root: Component<SegmentedRootProps<any>, {}, 'ref' | 'value'>;
	Item: Component<SegmentedItemProps<any>, {}, 'ref'>;
	ItemIcon: Component<SegmentedItemIconProps, {}, 'ref'>;
};

export type { SegmentedValue, SegmentedVariant } from './context';
export type { SegmentedRootProps } from './Segmented.svelte';
export type { SegmentedItemProps } from './SegmentedItem.svelte';
export type { SegmentedItemIconProps } from './SegmentedItemIcon.svelte';
