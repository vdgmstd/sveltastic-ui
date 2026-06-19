<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { HTMLButtonAttributes } from 'svelte/elements';
	import type { WithElementRef } from '../../types';

	export type PopoverTriggerProps = WithElementRef<
		Omit<HTMLButtonAttributes, 'children'> & {
			children?: Snippet;
			/** Render-delegation: receive the merged props (+ `open`) and render your own trigger element. */
			child?: Snippet<[{ props: Record<string, unknown>; open: boolean }]>;
		},
		HTMLButtonElement
	>;
</script>

<script lang="ts">
	import { createAttachmentKey } from 'svelte/attachments';
	import { cn } from '../../utils/cn';
	import { mergeProps } from '../../utils/mergeProps';
	import { attachRef } from '../../utils/ref';
	import { dataState, boolAttr } from '../../utils/attrs';
	import { getPopoverCtx } from './context';

	let { ref = $bindable(null), class: className, children, child, ...rest }: PopoverTriggerProps =
		$props();
	const root = getPopoverCtx();

	const refKey = createAttachmentKey();
	const merged = $derived(
		mergeProps(rest, {
			class: cn('popover-trigger', className),
			'data-popover-trigger': '',
			'data-state': dataState(root.open ? 'open' : 'closed'),
			'data-disabled': boolAttr(root.disabled),
			[refKey]: attachRef<HTMLButtonElement>((n) => (ref = n))
		})
	);

	$effect(() => {
		root.triggerSnippet = triggerBody;
		return () => {
			if (root.triggerSnippet === triggerBody) root.triggerSnippet = undefined;
		};
	});
</script>

{#snippet triggerBody(arg: { props: Record<string, unknown>; open: boolean })}
	{#if child}
		{@render child({ props: mergeProps(arg.props, merged), open: arg.open })}
	{:else}
		<button type="button" {...mergeProps(arg.props, merged)}>{@render children?.()}</button>
	{/if}
{/snippet}

<style>
	.popover-trigger {
		display: inline-flex;
		align-items: center;
		gap: var(--space-2);
		font: inherit;
		color: inherit;
		cursor: pointer;
	}
	.popover-trigger[data-disabled] {
		cursor: not-allowed;
	}
</style>
