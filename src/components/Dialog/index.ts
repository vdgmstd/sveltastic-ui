import Root from './Dialog.svelte';
import Trigger from './DialogTrigger.svelte';
import Portal from './DialogPortal.svelte';
import Content from './DialogContent.svelte';
import Title from './DialogTitle.svelte';
import Description from './DialogDescription.svelte';
import Body from './DialogBody.svelte';
import Footer from './DialogFooter.svelte';
import Close from './DialogClose.svelte';

/** Modal dialog. Compound: `Dialog.Root` + `Trigger`/`Portal`/`Content`/`Title`/`Description`/`Body`/`Footer`/`Close`. */
export const Dialog = { Root, Trigger, Portal, Content, Title, Description, Body, Footer, Close };

export type { DialogRootProps, DialogSize, DialogAlign, DialogRole } from './Dialog.svelte';
export type { DialogPortalProps } from './DialogPortal.svelte';
export type { DialogContentProps } from './DialogContent.svelte';
export type { DialogTriggerProps } from './DialogTrigger.svelte';
export type { DialogTitleProps } from './DialogTitle.svelte';
export type { DialogDescriptionProps } from './DialogDescription.svelte';
export type { DialogCloseProps } from './DialogClose.svelte';
export type { DialogBodyProps } from './DialogBody.svelte';
export type { DialogFooterProps } from './DialogFooter.svelte';
