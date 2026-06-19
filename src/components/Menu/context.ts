import { createPartContext } from '../../utils/context';
import type { Snippet } from 'svelte';
import type { MenuRootState, MenuRadioGroupBinding } from './menu.svelte';

const root = createPartContext<MenuRootState>('Menu', 'Menu parts must be used within <Menu.Root>');
const radioGroup = createPartContext<MenuRadioGroupBinding>('MenuRadioGroup', 'Menu.RadioItem must be used within <Menu.RadioGroup>');
const group = createPartContext<MenuGroupCtx>('MenuGroup');
const item = createPartContext<MenuItemCtx>('MenuItem');

export const setMenuCtx = root.set;

export const getMenuCtx = root.get;

export const setMenuRadioGroupCtx = radioGroup.set;

export const getMenuRadioGroupCtx = radioGroup.get;

/** Group heading id wiring for Menu.Group + Menu.GroupHeading. */
export type MenuGroupCtx = {
	readonly headingId: string | undefined;
	registerHeading: (id: string) => void;
};

export const setMenuGroupCtx = group.set;

export const getMenuGroupCtx = group.find;

/** Item-slot wiring so ItemIcon/ItemTrailing render in the row's fixed flex slots while bare children fill the label. */
export type MenuItemCtx = {
	registerIcon: (snippet: Snippet) => () => void;
	registerTrailing: (snippet: Snippet) => () => void;
};

export const setMenuItemCtx = item.set;

export const getMenuItemCtx = item.find;
