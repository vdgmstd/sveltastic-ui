<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { WithElementRef } from '../../types';
	import type { HTMLAttributes } from 'svelte/elements';

	export type PaginationListProps = WithElementRef<
		{
			/** `<Pagination.Page>` / `<Pagination.Ellipsis>` children. */
			children?: Snippet;
			/** Render-delegation: receive the merged props and render your own list element. */
			child?: Snippet<[{ props: Record<string, unknown> }]>;
		} & Omit<HTMLAttributes<HTMLDivElement>, 'children'>,
		HTMLDivElement
	>;
</script>

<script lang="ts">
	import { createAttachmentKey } from 'svelte/attachments';
	import { mergeProps } from '../../utils/mergeProps';
	import { attachRef } from '../../utils/ref';
	import { usePaginationContext } from './context';

	let {
		ref = $bindable(null),
		children,
		child,
		class: className,
		...rest
	}: PaginationListProps = $props();
	const ctx = usePaginationContext();

	let mode = $derived(ctx.mode);

	const attrs = $derived({
		class: 'pagination__list',
		'data-mode': mode,
		'data-testid': 'pagination-list'
	});
	const merged = $derived(
		mergeProps(rest, attrs, {
			class: className,
			[createAttachmentKey()]: attachRef<HTMLDivElement>((n) => (ref = n))
		})
	);
</script>

{#if child}
	{@render child({ props: merged })}
{:else}
	<div {...merged}>
		{@render children?.()}
	</div>
{/if}

<style>
	.pagination__list {
		display: inline-flex;
		align-items: center;
		gap: var(--space-2);
		flex: 0 1 auto;
		min-width: 0;
	}

	.pagination__list[data-mode='dots'] {
		gap: var(--space-3);
	}
</style>
