import type { Component } from 'svelte';
import Root from './Combobox.svelte';
import Input from './ComboboxInput.svelte';
import Portal from './ComboboxPortal.svelte';
import Content from './ComboboxContent.svelte';
import Viewport from './ComboboxViewport.svelte';
import Item from './ComboboxItem.svelte';
import ItemText from './ComboboxItemText.svelte';
import ItemIndicator from './ComboboxItemIndicator.svelte';
import Group from './ComboboxGroup.svelte';
import GroupHeading from './ComboboxGroupHeading.svelte';
import Empty from './ComboboxEmpty.svelte';

import type { ComboboxRootProps } from './Combobox.svelte';
import type { ComboboxInputProps } from './ComboboxInput.svelte';
import type { ComboboxPortalProps } from './ComboboxPortal.svelte';
import type { ComboboxContentProps } from './ComboboxContent.svelte';
import type { ComboboxViewportProps } from './ComboboxViewport.svelte';
import type { ComboboxItemProps } from './ComboboxItem.svelte';
import type { ComboboxItemTextProps } from './ComboboxItemText.svelte';
import type { ComboboxItemIndicatorProps } from './ComboboxItemIndicator.svelte';
import type { ComboboxGroupProps } from './ComboboxGroup.svelte';
import type { ComboboxGroupHeadingProps } from './ComboboxGroupHeading.svelte';
import type { ComboboxEmptyProps } from './ComboboxEmpty.svelte';

/** Editable typeahead combobox. Pure compound: `Combobox.Root` + `Input`/`Portal`/`Content`/`Viewport`/`Item`/`ItemText`/`ItemIndicator`/`Group`/`GroupHeading`/`Empty`. */
// svelte2tsx emits each generic part via an unnameable `$$IsomorphicComponent` alias; a plain object emits an EMPTY index.d.ts (proven on Select). The cast to the public `Component` form is the least-bad workaround — it restores types, at the cost of erasing the V generic (P3 — a tooling limitation).
export const Combobox = {
	Root,
	Input,
	Portal,
	Content,
	Viewport,
	Item,
	ItemText,
	ItemIndicator,
	Group,
	GroupHeading,
	Empty
} as {
	Root: Component<ComboboxRootProps<any>, {}, 'open' | 'value' | 'inputValue'>;
	Input: Component<ComboboxInputProps<any>, {}, 'ref'>;
	Portal: Component<ComboboxPortalProps, {}, ''>;
	Content: Component<ComboboxContentProps, {}, 'ref'>;
	Viewport: Component<ComboboxViewportProps, {}, 'ref'>;
	Item: Component<ComboboxItemProps<any>, {}, 'ref'>;
	ItemText: Component<ComboboxItemTextProps, {}, 'ref'>;
	ItemIndicator: Component<ComboboxItemIndicatorProps, {}, 'ref'>;
	Group: Component<ComboboxGroupProps, {}, 'ref'>;
	GroupHeading: Component<ComboboxGroupHeadingProps, {}, 'ref'>;
	Empty: Component<ComboboxEmptyProps, {}, ''>;
};

export type {
	ComboboxItem,
	ComboboxGroup,
	ComboboxItems,
	ComboboxType
} from './comboboxState.svelte';
export type { ComboboxRootProps } from './Combobox.svelte';
export type { ComboboxInputProps } from './ComboboxInput.svelte';
export type { ComboboxPortalProps } from './ComboboxPortal.svelte';
export type { ComboboxContentProps } from './ComboboxContent.svelte';
export type { ComboboxViewportProps } from './ComboboxViewport.svelte';
export type { ComboboxItemProps } from './ComboboxItem.svelte';
export type { ComboboxItemTextProps } from './ComboboxItemText.svelte';
export type { ComboboxItemIndicatorProps } from './ComboboxItemIndicator.svelte';
export type { ComboboxGroupProps } from './ComboboxGroup.svelte';
export type { ComboboxGroupHeadingProps } from './ComboboxGroupHeading.svelte';
export type { ComboboxEmptyProps } from './ComboboxEmpty.svelte';
