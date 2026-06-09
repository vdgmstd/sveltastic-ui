import { getContext, setContext } from 'svelte';
import type { TabsRootState } from './tabsState.svelte';

export type TabsVariant = 'underline' | 'default' | 'flat' | 'border' | 'relief';
export type TabsPanelVariant = 'plain' | 'card';
export type TabsTransition = 'fade' | 'crossfade' | 'slide' | 'none';
export type TabsOrientation = 'horizontal' | 'vertical';
export type TabsActivationMode = 'automatic' | 'manual';

const KEY = Symbol('Tabs');

export function setTabsContext(value: TabsRootState): TabsRootState {
	return setContext(KEY, value);
}

export function useTabsContext(): TabsRootState | undefined {
	return getContext<TabsRootState | undefined>(KEY);
}
