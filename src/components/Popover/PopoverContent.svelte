<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import type { WithElementRef } from '../../types';

	export type PopoverContentProps = WithElementRef<
		Omit<HTMLAttributes<HTMLDivElement>, 'children'> & {
			children?: Snippet;
			/** Render-delegation: receive the merged props + a `body` snippet and render your own panel-body element. */
			child?: Snippet<[{ props: Record<string, unknown>; body: Snippet }]>;
		},
		HTMLDivElement
	>;
</script>

<script lang="ts">
	import { cn } from '../../utils/cn';
	import { mergeProps } from '../../utils/mergeProps';
	import { getPopoverCtx } from './context';

	let { ref = $bindable(null), children, child, class: className, ...rest }: PopoverContentProps =
		$props();
	const root = getPopoverCtx();

	const setRef = (node: HTMLElement | null): void => {
		ref = node as HTMLDivElement | null;
	};
	const merged = $derived(
		mergeProps(rest, {
			class: cn('popover-content', className) || undefined,
			'data-popover-content': ''
		})
	);

	$effect(() => {
		root.contentSnippet = body;
		root.contentChild = child;
		root.setContentRef = setRef;
		return () => {
			if (root.contentSnippet === body) root.contentSnippet = undefined;
			root.contentChild = undefined;
			root.setContentRef = undefined;
		};
	});
	$effect(() => {
		root.contentProps = merged;
		return () => {
			root.contentProps = {};
		};
	});
</script>

{#snippet body(_close: () => void)}
	{@render children?.()}
{/snippet}
