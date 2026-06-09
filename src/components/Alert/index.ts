import Root from './Alert.svelte';
import Icon from './AlertIcon.svelte';
import Title from './AlertTitle.svelte';
import Toggle from './AlertToggle.svelte';
import Description from './AlertDescription.svelte';
import Action from './AlertAction.svelte';
import Close from './AlertClose.svelte';
import Progress from './AlertProgress.svelte';
import Pager from './AlertPager.svelte';

/** Dismissible banner. Compound: `Alert.Root` + `Alert.Icon`/`Alert.Title`/`Alert.Toggle`/`Alert.Description`/`Alert.Action`/`Alert.Close`/`Alert.Progress`/`Alert.Pager`. */
export const Alert = {
	Root,
	Icon,
	Title,
	Toggle,
	Description,
	Action,
	Close,
	Progress,
	Pager
};

export type { AlertRootProps, AlertVariant } from './Alert.svelte';
export type { AlertIconProps } from './AlertIcon.svelte';
export type { AlertTitleProps } from './AlertTitle.svelte';
export type { AlertToggleProps } from './AlertToggle.svelte';
export type { AlertDescriptionProps } from './AlertDescription.svelte';
export type { AlertActionProps } from './AlertAction.svelte';
export type { AlertCloseProps } from './AlertClose.svelte';
export type { AlertProgressProps } from './AlertProgress.svelte';
export type { AlertPagerProps } from './AlertPager.svelte';
