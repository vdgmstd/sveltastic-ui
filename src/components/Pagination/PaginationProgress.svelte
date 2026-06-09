<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { WithElementRef } from '../../types';
	import type { HTMLAttributes } from 'svelte/elements';

	export type PaginationProgressProps = WithElementRef<
		{
			/** Render-delegation: receive the merged props and render your own progressbar element. */
			child?: Snippet<[{ props: Record<string, unknown> }]>;
		} & Omit<HTMLAttributes<HTMLSpanElement>, 'children'>,
		HTMLSpanElement
	>;
</script>

<script lang="ts">
	import { createAttachmentKey } from 'svelte/attachments';
	import { mergeProps } from '../../utils/mergeProps';
	import { attachRef } from '../../utils/ref';
	import { usePaginationContext } from './context';

	let { ref = $bindable(null), child, class: className, ...rest }: PaginationProgressProps = $props();
	const ctx = usePaginationContext();

	let percent = $derived(ctx?.progressPercent ?? 0);

	const attrs = $derived({
		class: 'pagination__progress',
		role: 'progressbar' as const,
		'aria-valuenow': ctx?.safeValue ?? 1,
		'aria-valuemin': 1,
		'aria-valuemax': (ctx?.length ?? 0) || 1,
		'data-testid': 'pagination-progress'
	});
	const merged = $derived(
		mergeProps(rest, attrs, {
			class: className,
			[createAttachmentKey()]: attachRef<HTMLSpanElement>((node) => (ref = node))
		})
	);
</script>

{#if child}
	{@render child({ props: merged })}
{:else}
	<span {...merged}>
		<span class="pagination__progress-bar" style:width="{percent}%"></span>
	</span>
{/if}

<style>
	.pagination__progress {
		position: absolute;
		left: 2rem;
		right: 2rem;
		bottom: 2px;
		height: 2px;
		background: rgb(var(--text) / 0.08);
		border-radius: 2px;
		overflow: hidden;
		display: block;
		-webkit-user-select: none;
		user-select: none;
	}
	.pagination__progress-bar {
		display: block;
		height: 100%;
		background: rgb(var(--c));
		border-radius: inherit;
		transition: width var(--dur) var(--ease);
	}
</style>
