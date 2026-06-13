import type { Attachment } from 'svelte/attachments';

/**
 * Attachment that writes the node into a setter on mount and clears it on destroy — replaces
 * public `bind:this`. Change-guarded: the setter only fires when the node identity actually
 * changes, so a re-run with the same node never bounces the captured value (and any `$state`
 * it backs) null→node→null. Mint the returned attachment ONCE with stable identity (hoist it
 * out of any `$derived`/`merged` spread); re-minting per recompute re-runs the attachment and,
 * if the setter writes `$state` read elsewhere reactively, drives an update-depth loop.
 */
export function attachRef<El extends Element = HTMLElement>(
	set: (node: El | null) => void
): Attachment<El> {
	let current: El | null = null;
	return (node) => {
		if (current !== node) {
			current = node;
			set(node);
		}
		return () => {
			if (current !== null) {
				current = null;
				set(null);
			}
		};
	};
}
