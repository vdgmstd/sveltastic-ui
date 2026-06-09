import Root from './Menu.svelte';
import Trigger from './MenuTrigger.svelte';
import Content from './MenuContent.svelte';
import Header from './MenuHeader.svelte';
import Footer from './MenuFooter.svelte';
import Item from './MenuItem.svelte';
import ItemIcon from './MenuItemIcon.svelte';
import ItemTrailing from './MenuItemTrailing.svelte';
import Shortcut from './MenuShortcut.svelte';
import CheckboxItem from './MenuCheckboxItem.svelte';
import RadioGroup from './MenuRadioGroup.svelte';
import RadioItem from './MenuRadioItem.svelte';
import Group from './MenuGroup.svelte';
import GroupHeading from './MenuGroupHeading.svelte';
import Separator from './MenuSeparator.svelte';

/** Dropdown menu. Pure compound: `Menu.Root` + `Trigger`/`Content`/`Header`/`Footer`/`Item`/`ItemIcon`/`ItemTrailing`/`Shortcut`/`CheckboxItem`/`RadioGroup`/`RadioItem`/`Group`/`GroupHeading`/`Separator`. */
export const Menu = {
	Root,
	Trigger,
	Content,
	Header,
	Footer,
	Item,
	ItemIcon,
	ItemTrailing,
	Shortcut,
	CheckboxItem,
	RadioGroup,
	RadioItem,
	Group,
	GroupHeading,
	Separator
};

export type {
	MenuPlacement,
	MenuTriggerOn,
	MenuOpenAnim,
	MenuPopupRole,
	MenuRootProps
} from './Menu.svelte';
export type { MenuTriggerProps } from './MenuTrigger.svelte';
export type { MenuContentProps } from './MenuContent.svelte';
export type { MenuHeaderProps } from './MenuHeader.svelte';
export type { MenuFooterProps } from './MenuFooter.svelte';
export type { MenuItemProps, MenuItemSelectEvent } from './MenuItem.svelte';
export type { MenuItemIconProps } from './MenuItemIcon.svelte';
export type { MenuItemTrailingProps } from './MenuItemTrailing.svelte';
export type { MenuShortcutProps } from './MenuShortcut.svelte';
export type { MenuCheckboxItemProps } from './MenuCheckboxItem.svelte';
export type { MenuRadioGroupProps } from './MenuRadioGroup.svelte';
export type { MenuRadioItemProps } from './MenuRadioItem.svelte';
export type { MenuGroupProps } from './MenuGroup.svelte';
export type { MenuGroupHeadingProps } from './MenuGroupHeading.svelte';
export type { MenuSeparatorProps } from './MenuSeparator.svelte';
