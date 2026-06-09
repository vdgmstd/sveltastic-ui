import Root from './Switch.svelte';
import Thumb from './SwitchThumb.svelte';
import Icon from './SwitchIcon.svelte';
import Label from './SwitchLabel.svelte';

/** Toggle control. Pure compound: `Switch.Root` + `Switch.Thumb` + `Switch.Icon` + `Switch.Label`. */
export const Switch = { Root, Thumb, Icon, Label };

export type { SwitchRootProps } from './Switch.svelte';
export type { SwitchThumbProps } from './SwitchThumb.svelte';
export type { SwitchIconProps, SwitchIconState } from './SwitchIcon.svelte';
export type { SwitchLabelProps } from './SwitchLabel.svelte';
