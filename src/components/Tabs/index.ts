import TabsBase from './Tabs.svelte';
import TabList from './TabList.svelte';
import Tab from './Tab.svelte';
import TabPanel from './TabPanel.svelte';

type TabsStatics = {
	List: typeof TabList;
	Tab: typeof Tab;
	Panel: typeof TabPanel;
};

const Tabs = TabsBase as typeof TabsBase & TabsStatics;
Tabs.List = TabList;
Tabs.Tab = Tab;
Tabs.Panel = TabPanel;

export { Tabs };
export type {
	TabsProps,
	TabsVariant,
	TabsPanelVariant,
	TabsTransition
} from './Tabs.svelte';
export type { TabListProps } from './TabList.svelte';
export type { TabProps } from './Tab.svelte';
export type { TabPanelProps } from './TabPanel.svelte';
