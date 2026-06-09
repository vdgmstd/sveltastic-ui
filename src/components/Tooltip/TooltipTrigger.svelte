<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import type { WithElementRef } from '../../types';

	export type TooltipTriggerProps = WithElementRef<
		Omit<HTMLAttributes<HTMLDivElement>, 'children'> & {
			children?: Snippet;
			/** Accessible label when the focusable child has no visible text. */
			ariaLabel?: string;
			/** Render-delegation: receive the merged props and render your own wrapper element. */
			child?: Snippet<[{ props: Record<string, unknown> }]>;
		},
		HTMLDivElement
	>;
</script>

<script lang="ts">
	import { createAttachmentKey } from 'svelte/attachments';
	import { getTooltipCtx } from './context';
	import { mergeProps } from '../../utils/mergeProps';
	import { attachRef } from '../../utils/ref';
	import { dataState } from '../../utils/attrs';
	import { cn } from '../../utils/cn';

	let {
		ref = $bindable(null),
		class: className,
		ariaLabel,
		children,
		child,
		...rest
	}: TooltipTriggerProps = $props();
	const root = getTooltipCtx();

	const refKey = createAttachmentKey();

	// ARIA (label + describedby) belongs on the focusable child, not the presentation wrapper (AT-invisible there).
	$effect(() => {
		const node = ref?.firstElementChild;
		if (!node) return;
		if (ariaLabel) node.setAttribute('aria-label', ariaLabel);
		if (root.bubbleId && root.open) node.setAttribute('aria-describedby', root.bubbleId);
		else node.removeAttribute('aria-describedby');
		return () => {
			node.removeAttribute('aria-describedby');
			if (ariaLabel) node.removeAttribute('aria-label');
		};
	});

	const attrs = $derived({
		class: cn('tooltip-trigger', className),
		role: 'presentation',
		'data-state': dataState(root.open ? 'open' : 'closed'),
		'data-testid': 'tooltip-trigger',
		onmouseenter: root.handleEnter,
		onmouseleave: root.handleLeave,
		onfocusin: root.handleEnter,
		onfocusout: root.handleLeave,
		onclick: root.handleClick
	});
	const merged = $derived(
		mergeProps(rest, attrs, {
			[refKey]: attachRef<HTMLDivElement>((n) => {
				ref = n;
				root.triggerRef = n;
			})
		})
	);
</script>

{#if child}
	{@render child({ props: merged })}
{:else}
	<!-- Decorative wrapper: keyboard + ARIA come from the interactive child; click bubbles from it for trigger="click". -->
	<div {...merged}>{@render children?.()}</div>
{/if}

<style>
	:where(.tooltip-trigger) {
		display: inline-flex;
	}
</style>
