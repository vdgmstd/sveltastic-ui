import Provider from './ToastProvider.svelte';
import Root from './ToastRoot.svelte';
import Title from './ToastTitle.svelte';
import Description from './ToastDescription.svelte';
import Icon from './ToastIcon.svelte';
import Action from './ToastAction.svelte';
import Close from './ToastClose.svelte';

/** Toast notifications. Imperative `toast()` / `notify()` + a styled compound for custom bodies: `Toast.Provider` + `Root`/`Icon`/`Title`/`Description`/`Action`/`Close`. */
export const Toast = {
	Provider,
	Root,
	Title,
	Description,
	Icon,
	Action,
	Close
};

export { toast } from '../../state/toast.svelte';
export type {
	ToastPosition,
	ToastOptions,
	ToastHandle,
	ToastEntry,
	ToastRenderContext
} from '../../state/toast.svelte';

export type { ToastProviderProps } from './ToastProvider.svelte';
export type { ToastRootProps } from './ToastRoot.svelte';
export type { ToastTitleProps } from './ToastTitle.svelte';
export type { ToastDescriptionProps } from './ToastDescription.svelte';
export type { ToastIconProps } from './ToastIcon.svelte';
export type { ToastActionProps } from './ToastAction.svelte';
export type { ToastCloseProps } from './ToastClose.svelte';
