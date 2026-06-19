<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import type { WithElementRef } from '../../types';

	export type ToastRootProps = WithElementRef<
		Omit<HTMLAttributes<HTMLDivElement>, 'children'> & {
			children?: Snippet;
			/** Render-delegation: receive the merged props and render your own element. */
			child?: Snippet<[{ props: Record<string, unknown> }]>;
		},
		HTMLDivElement
	>;
</script>

<script lang="ts">
	import { createAttachmentKey } from 'svelte/attachments';
	import { cn } from '../../utils/cn';
	import { mergeProps } from '../../utils/mergeProps';
	import { attachRef } from '../../utils/ref';
	import { rgbTriplet } from '../../utils/color';
	import { getToastCtx } from './context';

	let { ref = $bindable(null), children, child, class: className, ...rest }: ToastRootProps = $props();
	const ctx = getToastCtx();

	let entry = $derived(ctx.entry);
	let assertive = $derived(entry.color === 'danger' || entry.color === 'warning');
	let triplet = $derived(rgbTriplet(entry.color ?? 'primary'));

	const refKey = createAttachmentKey();
	const merged = $derived(
		mergeProps(rest, {
			class: cn('toast', entry.border && 'toast--border', entry.square && 'toast--square', className),
			role: assertive ? ('alert' as const) : ('status' as const),
			'aria-live': assertive ? ('assertive' as const) : ('polite' as const),
			'data-toast': '',
			'data-color': entry.color ?? 'primary',
			[refKey]: attachRef<HTMLDivElement>((n) => (ref = n))
		})
	);
</script>

{#if child}
	{@render child({ props: { ...merged, style: `--c:${triplet}` } })}
{:else}
	<div {...merged} style:--c={triplet}>{@render children?.()}</div>
{/if}
