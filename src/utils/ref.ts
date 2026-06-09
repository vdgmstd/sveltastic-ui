import type { Attachment } from 'svelte/attachments';

/** Attachment that writes the node into a setter on mount and clears it on destroy — replaces public `bind:this`. */
export function attachRef<El extends Element = HTMLElement>(
	set: (node: El | null) => void
): Attachment<El> {
	return (node) => {
		set(node);
		return () => set(null);
	};
}
