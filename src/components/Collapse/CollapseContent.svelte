<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import type { WithElementRef } from '../../types';

	export type CollapseContentProps = WithElementRef<
		{
			children?: Snippet;
			/** Keep the content mounted while closed so a consumer transition can drive it. */
			forceMount?: boolean;
			/** Render-delegation: receive the merged props plus the live `open` flag. */
			child?: Snippet<[{ props: Record<string, unknown>; open: boolean }]>;
		} & HTMLAttributes<HTMLDivElement>,
		HTMLDivElement
	>;
</script>

<script lang="ts">
	import { createAttachmentKey } from 'svelte/attachments';
	import { slide } from 'svelte/transition';
	import { quintOut } from 'svelte/easing';
	import { reducedMotion } from '../../state/reducedMotion.svelte';
	import { cn } from '../../utils/cn';
	import { mergeProps } from '../../utils/mergeProps';
	import { attachRef } from '../../utils/ref';
	import { getCollapseItemContext } from './context';

	let {
		ref = $bindable(null),
		class: className,
		children,
		forceMount = false,
		child,
		...rest
	}: CollapseContentProps = $props();
	const root = getCollapseItemContext();

	$effect(() => reducedMotion.subscribe());
	let slideDuration = $derived(reducedMotion.current ? 0 : 360);

	const refKey = createAttachmentKey();
	const merged = $derived(
		mergeProps(rest, root.contentAttrs, {
			class: cn('collapse__body', className),
			[refKey]: attachRef<HTMLDivElement>((n) => (ref = n))
		})
	);
</script>

{#if child}
	{@render child({ props: merged, open: root.isOpen })}
{:else if forceMount}
	<div {...merged} hidden={!root.isOpen}>
		<div class="collapse__body-inner">
			{@render children?.()}
		</div>
	</div>
{:else if root.isOpen}
	<div
		{...merged}
		transition:slide={{ duration: slideDuration, easing: quintOut }}
		onintroend={() => root.completeOpen()}
		onoutroend={() => root.completeClose()}
	>
		<div class="collapse__body-inner">
			{@render children?.()}
		</div>
	</div>
{/if}
