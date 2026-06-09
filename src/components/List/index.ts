import type { Component } from 'svelte';
import Root from './List.svelte';
import Body from './ListBody.svelte';
import Header from './ListHeader.svelte';
import Footer from './ListFooter.svelte';
import Label from './ListLabel.svelte';
import Empty from './ListEmpty.svelte';
import Item from './ListItem.svelte';
import ItemLead from './ListItemLead.svelte';
import ItemContent from './ListItemContent.svelte';
import ItemLabel from './ListItemLabel.svelte';
import ItemDescription from './ListItemDescription.svelte';
import ItemTrail from './ListItemTrail.svelte';
import Group from './ListGroup.svelte';
import GroupLabel from './ListGroupLabel.svelte';
import Separator from './ListSeparator.svelte';

import type { ListProps } from './List.svelte';
import type { ListBodyProps } from './ListBody.svelte';
import type { ListHeaderProps } from './ListHeader.svelte';
import type { ListFooterProps } from './ListFooter.svelte';
import type { ListLabelProps } from './ListLabel.svelte';
import type { ListEmptyProps } from './ListEmpty.svelte';
import type { ListItemCastProps } from './ListItem.svelte';
import type { ListItemLeadProps } from './ListItemLead.svelte';
import type { ListItemContentProps } from './ListItemContent.svelte';
import type { ListItemLabelProps } from './ListItemLabel.svelte';
import type { ListItemDescriptionProps } from './ListItemDescription.svelte';
import type { ListItemTrailProps } from './ListItemTrail.svelte';
import type { ListGroupProps } from './ListGroup.svelte';
import type { ListGroupLabelProps } from './ListGroupLabel.svelte';
import type { ListSeparatorProps } from './ListSeparator.svelte';

/** Styled list surface. Pure compound: `List.Root` + `Body`/`Header`/`Footer`/`Label`/`Empty`/`Item`/`ItemLead`/`ItemContent`/`ItemLabel`/`ItemDescription`/`ItemTrail`/`Group`/`GroupLabel`/`Separator`. */
// Root + Item are generic; cast each part to the public `Component` form (resolved in isolation) so the namespace object still emits its index.d.ts under build:ui.
export const List = {
	Root: Root as Component<ListProps<any>, {}, 'ref' | 'selected'>,
	Body: Body as Component<ListBodyProps, {}, 'ref'>,
	Header: Header as Component<ListHeaderProps, {}, 'ref'>,
	Footer: Footer as Component<ListFooterProps, {}, 'ref'>,
	Label: Label as Component<ListLabelProps, {}, 'ref'>,
	Empty: Empty as Component<ListEmptyProps, {}, 'ref'>,
	Item: Item as unknown as Component<ListItemCastProps<any>, {}, 'ref'>,
	ItemLead: ItemLead as Component<ListItemLeadProps, {}, 'ref'>,
	ItemContent: ItemContent as Component<ListItemContentProps, {}, 'ref'>,
	ItemLabel: ItemLabel as Component<ListItemLabelProps, {}, 'ref'>,
	ItemDescription: ItemDescription as Component<ListItemDescriptionProps, {}, 'ref'>,
	ItemTrail: ItemTrail as Component<ListItemTrailProps, {}, 'ref'>,
	Group: Group as Component<ListGroupProps, {}, 'ref'>,
	GroupLabel: GroupLabel as Component<ListGroupLabelProps, {}, 'ref'>,
	Separator: Separator as Component<ListSeparatorProps, {}, 'ref'>
};

export type { ListProps, ListVariant, ListRole, ListType } from './List.svelte';
export type { ListBodyProps } from './ListBody.svelte';
export type { ListHeaderProps } from './ListHeader.svelte';
export type { ListFooterProps } from './ListFooter.svelte';
export type { ListLabelProps } from './ListLabel.svelte';
export type { ListEmptyProps } from './ListEmpty.svelte';
export type { ListItemProps, ListItemVariant } from './ListItem.svelte';
export type { ListItemLeadProps } from './ListItemLead.svelte';
export type { ListItemContentProps } from './ListItemContent.svelte';
export type { ListItemLabelProps } from './ListItemLabel.svelte';
export type { ListItemDescriptionProps } from './ListItemDescription.svelte';
export type { ListItemTrailProps } from './ListItemTrail.svelte';
export type { ListGroupProps } from './ListGroup.svelte';
export type { ListGroupLabelProps } from './ListGroupLabel.svelte';
export type { ListSeparatorProps } from './ListSeparator.svelte';
