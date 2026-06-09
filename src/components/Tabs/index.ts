import type { Component } from 'svelte';
import Root from './Tabs.svelte';
import List from './TabList.svelte';
import Trigger from './Tab.svelte';
import Icon from './TabIcon.svelte';
import Label from './TabLabel.svelte';
import Content from './TabPanel.svelte';
import type { TabsRootProps } from './Tabs.svelte';
import type { TabsListProps } from './TabList.svelte';
import type { TabsTriggerProps } from './Tab.svelte';
import type { TabsIconProps } from './TabIcon.svelte';
import type { TabsLabelProps } from './TabLabel.svelte';
import type { TabsContentProps } from './TabPanel.svelte';

/** Tabbed navigation compound: `Tabs.Root` + `Tabs.List` / `Tabs.Trigger` / `Tabs.Icon` / `Tabs.Label` / `Tabs.Content`. */
export const Tabs = {
	Root,
	List,
	Trigger,
	Icon,
	Label,
	Content
} as {
	Root: Component<TabsRootProps, {}, 'value' | 'ref'>;
	List: Component<TabsListProps, {}, 'ref'>;
	Trigger: Component<TabsTriggerProps, {}, 'ref'>;
	Icon: Component<TabsIconProps, {}, 'ref'>;
	Label: Component<TabsLabelProps, {}, 'ref'>;
	Content: Component<TabsContentProps, {}, 'ref'>;
};

export type {
	TabsVariant,
	TabsPanelVariant,
	TabsTransition,
	TabsOrientation,
	TabsActivationMode
} from './context';
export type { TabsRootProps } from './Tabs.svelte';
export type { TabsListProps } from './TabList.svelte';
export type { TabsTriggerProps } from './Tab.svelte';
export type { TabsIconProps } from './TabIcon.svelte';
export type { TabsLabelProps } from './TabLabel.svelte';
export type { TabsContentProps } from './TabPanel.svelte';
