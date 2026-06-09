import { getContext, setContext } from 'svelte';
import type { Snippet } from 'svelte';
import type { MenuRootState, MenuRadioGroupBinding } from './menu.svelte';

const KEY = Symbol('Menu');
const RADIO_KEY = Symbol('MenuRadioGroup');
const GROUP_KEY = Symbol('MenuGroup');
const ITEM_KEY = Symbol('MenuItem');

export function setMenuCtx(state: MenuRootState): MenuRootState {
	return setContext(KEY, state);
}

export function getMenuCtx(): MenuRootState {
	const ctx = getContext<MenuRootState>(KEY);
	if (!ctx) throw new Error('Menu parts must be used within <Menu.Root>');
	return ctx;
}

export function setMenuRadioGroupCtx(group: MenuRadioGroupBinding): MenuRadioGroupBinding {
	return setContext(RADIO_KEY, group);
}

export function getMenuRadioGroupCtx(): MenuRadioGroupBinding {
	const ctx = getContext<MenuRadioGroupBinding | undefined>(RADIO_KEY);
	if (!ctx) throw new Error('Menu.RadioItem must be used within <Menu.RadioGroup>');
	return ctx;
}

/** Group heading id wiring for Menu.Group + Menu.GroupHeading. */
export type MenuGroupCtx = {
	readonly headingId: string | undefined;
	registerHeading: (id: string) => void;
};

export function setMenuGroupCtx(group: MenuGroupCtx): MenuGroupCtx {
	return setContext(GROUP_KEY, group);
}

export function getMenuGroupCtx(): MenuGroupCtx | undefined {
	return getContext<MenuGroupCtx | undefined>(GROUP_KEY);
}

/** Item-slot wiring so ItemIcon/ItemTrailing render in the row's fixed flex slots while bare children fill the label. */
export type MenuItemCtx = {
	registerIcon: (snippet: Snippet) => () => void;
	registerTrailing: (snippet: Snippet) => () => void;
};

export function setMenuItemCtx(item: MenuItemCtx): MenuItemCtx {
	return setContext(ITEM_KEY, item);
}

export function getMenuItemCtx(): MenuItemCtx | undefined {
	return getContext<MenuItemCtx | undefined>(ITEM_KEY);
}
