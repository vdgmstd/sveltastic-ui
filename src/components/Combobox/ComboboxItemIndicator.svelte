<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import type { WithElementRef } from '../../types';

	export type ComboboxItemIndicatorProps = WithElementRef<
		Omit<HTMLAttributes<HTMLSpanElement>, 'children'> & {
			children?: Snippet;
			/** Render-delegation: receive the merged props and render your own element. */
			child?: Snippet<[{ props: Record<string, unknown> }]>;
		},
		HTMLSpanElement
	>;
</script>

<script lang="ts">
	import { createAttachmentKey } from 'svelte/attachments';
	import { CheckIcon } from 'phosphor-svelte';
	import { cn } from '../../utils/cn';
	import { mergeProps } from '../../utils/mergeProps';
	import { attachRef } from '../../utils/ref';
	import { dataState } from '../../utils/attrs';
	import { getComboboxItemCtx } from './context';

	let {
		ref = $bindable(null),
		children,
		child,
		class: className,
		...rest
	}: ComboboxItemIndicatorProps = $props();
	const item = getComboboxItemCtx();

	const refKey = createAttachmentKey();
	const merged = $derived(
		mergeProps(rest, {
			class: cn('combobox__item-indicator', className),
			'aria-hidden': true,
			'data-state': dataState(item?.isSelected ? 'checked' : 'unchecked'),
			[refKey]: attachRef<HTMLSpanElement>((n) => (ref = n))
		})
	);
</script>

{#if item?.isSelected}
	{#if child}
		{@render child({ props: merged })}
	{:else}
		<span {...merged}>
			{#if children}{@render children()}{:else}<CheckIcon size={14} weight="bold" />{/if}
		</span>
	{/if}
{/if}

<style>
	.combobox__item-indicator {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
		color: rgb(var(--c, var(--primary)));
	}
</style>
