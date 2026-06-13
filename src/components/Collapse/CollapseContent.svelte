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
	import type { TransitionConfig } from 'svelte/transition';
	import { quintOut } from 'svelte/easing';
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

	const slideDuration = 360;

	// Height-only collapse; svelte's `slide` animates 6 properties at once, which janks/skips on some WebKit + Windows builds.
	function expand(node: HTMLElement, { duration = 360 } = {}): TransitionConfig {
		const full = node.scrollHeight;
		return {
			duration,
			easing: quintOut,
			css: (t) => `overflow: hidden; height: ${t * full}px`
		};
	}

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
		transition:expand={{ duration: slideDuration }}
		onintroend={() => root.completeOpen()}
		onoutroend={() => root.completeClose()}
	>
		<div class="collapse__body-inner">
			{@render children?.()}
		</div>
	</div>
{/if}
