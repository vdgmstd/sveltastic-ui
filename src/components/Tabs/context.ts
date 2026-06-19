import { createPartContext } from '../../utils/context';
import type { TabsRootState } from './tabsState.svelte';

export type TabsVariant = 'underline' | 'default' | 'flat' | 'border' | 'relief';
export type TabsPanelVariant = 'plain' | 'card';
export type TabsTransition = 'fade' | 'crossfade' | 'slide' | 'none';
export type TabsOrientation = 'horizontal' | 'vertical';
export type TabsActivationMode = 'automatic' | 'manual';

const ctx = createPartContext<TabsRootState>('Tabs', '<Tabs> parts must be used within <Tabs.Root>');

export const setTabsContext = ctx.set;
export const useTabsContext = ctx.get;
