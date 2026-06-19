import { createPartContext } from '../../utils/context';
import type { UploadRootState } from './uploadState.svelte';

export type UploadVariant = 'default' | 'flat' | 'border';

/** Per-row state shared from Upload.Item down to Upload.ItemRemove. */
export type UploadItemState = {
	readonly file: File;
	readonly removeLabel: string;
	remove: () => void;
};

const rootCtx = createPartContext<UploadRootState>('Upload', 'Upload parts must be used within <Upload.Root>');
export const setUploadContext = rootCtx.set;
export const useUploadContext = rootCtx.get;

const itemCtx = createPartContext<UploadItemState>('UploadItem', '<Upload.ItemRemove> must be used within <Upload.Item>');
export const setUploadItemContext = itemCtx.set;
export const useUploadItemContext = itemCtx.get;
