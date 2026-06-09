import Root from './Button.svelte';
import Icon from './ButtonIcon.svelte';
import Group from './ButtonGroup.svelte';

/** Button. Compound: `Button.Root` + `Button.Icon` / `Button.Group`. */
export const Button = { Root, Icon, Group };

export type { ButtonRootProps } from './Button.svelte';
export type { ButtonIconProps } from './ButtonIcon.svelte';
export type { ButtonGroupProps } from './ButtonGroup.svelte';
