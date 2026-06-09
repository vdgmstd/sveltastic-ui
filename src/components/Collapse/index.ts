import Root from './Collapse.svelte';
import Trigger from './CollapseTrigger.svelte';
import Icon from './CollapseIcon.svelte';
import Title from './CollapseTitle.svelte';
import Caret from './CollapseCaret.svelte';
import Extra from './CollapseExtra.svelte';
import Content from './CollapseContent.svelte';
import Group from './CollapseGroup.svelte';

/** Disclosure widget — compose `Collapse.Root` with `Trigger`/`Icon`/`Title`/`Caret`/`Extra`/`Content`; wrap items in `Collapse.Group` for accordion behavior. */
export const Collapse = { Root, Trigger, Icon, Title, Caret, Extra, Content, Group };

export type { CollapseProps, CollapseVariant } from './Collapse.svelte';
export type { CollapseTriggerProps } from './CollapseTrigger.svelte';
export type { CollapseIconProps } from './CollapseIcon.svelte';
export type { CollapseTitleProps } from './CollapseTitle.svelte';
export type { CollapseCaretProps } from './CollapseCaret.svelte';
export type { CollapseExtraProps } from './CollapseExtra.svelte';
export type { CollapseContentProps } from './CollapseContent.svelte';
export type { CollapseGroupProps, CollapseGroupLayout } from './CollapseGroup.svelte';
export type { CollapseGroupType } from './context';
