<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import type { WithElementRef } from '../../types';

	export type AlertPagerProps = WithElementRef<
		{
			/** Current page (1-based). Two-way bindable. */
			page: number;
			/** Total page count. */
			pages: number;
			/** Accessible label for the previous-page button. */
			prevLabel?: string;
			/** Accessible label for the next-page button. */
			nextLabel?: string;
			/** Render-delegation: receive the merged props and render your own host element. */
			child?: Snippet<[{ props: Record<string, unknown> }]>;
			/** Fires after `page` changes — receives the new 1-based page. */
			onPageChange?: (page: number) => void;
		} & Omit<HTMLAttributes<HTMLDivElement>, 'children'>
	>;
</script>

<script lang="ts">
	import { createAttachmentKey } from 'svelte/attachments';
	import { CaretLeftIcon, CaretRightIcon } from 'phosphor-svelte';

	import { cn } from '../../utils/cn';
	import { attachRef } from '../../utils/ref';
	import { mergeProps } from '../../utils/mergeProps';

	let {
		page = $bindable(),
		pages,
		prevLabel = 'Previous page',
		nextLabel = 'Next page',
		child,
		onPageChange,
		ref = $bindable(null),
		class: className,
		...rest
	}: AlertPagerProps = $props();

	let atStart = $derived(page <= 1);
	let atEnd = $derived(page >= pages);

	function goToPage(next: number): void {
		if (next === page) return;
		if (next < 1 || next > pages) return;
		page = next;
		onPageChange?.(next);
	}

	const refKey = createAttachmentKey();
	const rootProps = $derived(
		mergeProps(rest, {
			class: cn('alert__pagination', className),
			'data-testid': 'alert-pager',
			[refKey]: attachRef<HTMLElement>((n) => (ref = n))
		})
	);
</script>

{#if child}
	{@render child({ props: rootProps })}
{:else}
	<div {...rootProps}>
		<button
			type="button"
			onclick={() => goToPage(page - 1)}
			disabled={atStart || undefined}
			data-disabled={atStart || undefined}
			aria-label={prevLabel}
		>
			<CaretLeftIcon size={14} weight="bold" />
		</button>
		<span aria-live="polite">{page} / {pages}</span>
		<button
			type="button"
			onclick={() => goToPage(page + 1)}
			disabled={atEnd || undefined}
			data-disabled={atEnd || undefined}
			aria-label={nextLabel}
		>
			<CaretRightIcon size={14} weight="bold" />
		</button>
	</div>
{/if}

<style>
	.alert__pagination {
		position: relative;
		padding: 0 var(--space-8);
		margin-bottom: var(--space-5);
		display: flex;
		align-items: center;
		justify-content: flex-start;
		color: rgb(255 255 255);
		-webkit-user-select: none;
		user-select: none;
	}
	.alert__pagination span {
		margin: 0 var(--space-4);
		min-width: 28px;
		font-size: var(--fs-sm);
		text-align: center;
	}
	.alert__pagination button {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		padding: var(--space-2) var(--space-4);
		background: rgb(255 255 255 / 0.15);
		color: rgb(255 255 255);
		border: 0;
		border-radius: var(--rad-sm);
		font-size: var(--fs-lg);
		cursor: pointer;
		transition: background-color var(--dur) var(--ease-standard);
	}
	.alert__pagination button:hover:not(:disabled) {
		background: rgb(255 255 255 / 0.28);
	}
	.alert__pagination button:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}
	.alert__pagination button:focus-visible {
		outline: 2px solid rgb(255 255 255 / 0.6);
		outline-offset: 2px;
	}
</style>
