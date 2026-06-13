import { getContext, setContext } from 'svelte';
import type { UploadRootState } from './uploadState.svelte';

export type UploadVariant = 'default' | 'flat' | 'border';

/** Per-row state shared from Upload.Item down to Upload.ItemRemove. */
export type UploadItemState = {
	readonly file: File;
	readonly removeLabel: string;
	remove: () => void;
};

const KEY = Symbol('Upload');
const ITEM_KEY = Symbol('UploadItem');

export function setUploadContext(value: UploadRootState): UploadRootState {
	return setContext(KEY, value);
}

export function useUploadContext(): UploadRootState {
	const ctx = getContext<UploadRootState | undefined>(KEY);
	if (!ctx) throw new Error('Upload parts must be used within <Upload.Root>');
	return ctx;
}

export function setUploadItemContext(value: UploadItemState): UploadItemState {
	return setContext(ITEM_KEY, value);
}

export function useUploadItemContext(): UploadItemState {
	const ctx = getContext<UploadItemState | undefined>(ITEM_KEY);
	if (!ctx) throw new Error('<Upload.ItemRemove> must be used within <Upload.Item>');
	return ctx;
}
