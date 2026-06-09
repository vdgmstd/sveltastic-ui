import type { Component } from 'svelte';
import Root from './Checkbox.svelte';
import Indicator from './CheckboxIndicator.svelte';
import Icon from './CheckboxIcon.svelte';
import Label from './CheckboxLabel.svelte';
import Group from './CheckboxGroup.svelte';
import GroupLabel from './CheckboxGroupLabel.svelte';

import type { CheckboxRootProps } from './Checkbox.svelte';
import type { CheckboxIndicatorProps } from './CheckboxIndicator.svelte';
import type { CheckboxIconProps } from './CheckboxIcon.svelte';
import type { CheckboxLabelProps } from './CheckboxLabel.svelte';
import type { CheckboxGroupProps } from './CheckboxGroup.svelte';
import type { CheckboxGroupLabelProps } from './CheckboxGroupLabel.svelte';

/** Checkbox compound: `Checkbox.Root` + `Checkbox.Indicator` / `Checkbox.Icon` / `Checkbox.Label`, grouped via `Checkbox.Group` + `Checkbox.GroupLabel`. */
// Root is generic <V>; svelte2tsx aliases the generic so the barrel can't name it — cast each part to its public Component form so build:ui emits the .d.ts.
export const Checkbox = { Root, Indicator, Icon, Label, Group, GroupLabel } as {
	Root: Component<CheckboxRootProps<any>, {}, 'ref' | 'checked' | 'indeterminate'>;
	Indicator: Component<CheckboxIndicatorProps, {}, 'ref'>;
	Icon: Component<CheckboxIconProps, {}, 'ref'>;
	Label: Component<CheckboxLabelProps, {}, 'ref'>;
	Group: Component<CheckboxGroupProps, {}, 'ref' | 'value'>;
	GroupLabel: Component<CheckboxGroupLabelProps, {}, 'ref'>;
};

export type { CheckboxRootProps } from './Checkbox.svelte';
export type { CheckboxIndicatorProps } from './CheckboxIndicator.svelte';
export type { CheckboxIconProps } from './CheckboxIcon.svelte';
export type { CheckboxLabelProps } from './CheckboxLabel.svelte';
export type { CheckboxGroupProps } from './CheckboxGroup.svelte';
export type { CheckboxGroupLabelProps } from './CheckboxGroupLabel.svelte';
