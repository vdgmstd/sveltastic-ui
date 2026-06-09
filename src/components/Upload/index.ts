import Root from './UploadRoot.svelte';
import Dropzone from './UploadDropzone.svelte';
import List from './UploadList.svelte';
import Item from './UploadItem.svelte';
import ItemRemove from './UploadItemRemove.svelte';
import Footer from './UploadFooter.svelte';

/** File upload field. Compound: `Upload.Root` + `Upload.Dropzone`/`List`/`Item`/`ItemRemove`/`Footer`. */
export const Upload = { Root, Dropzone, List, Item, ItemRemove, Footer };

export type { UploadError, UploadErrorReason } from './upload';
export type { UploadVariant } from './context';
export type { UploadRootProps } from './UploadRoot.svelte';
export type { UploadDropzoneProps } from './UploadDropzone.svelte';
export type { UploadListProps } from './UploadList.svelte';
export type { UploadItemProps } from './UploadItem.svelte';
export type { UploadItemRemoveProps } from './UploadItemRemove.svelte';
export type { UploadFooterProps } from './UploadFooter.svelte';
