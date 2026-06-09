<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import type { WithElementRef } from '../../types';

	export type SelectItemTextProps = WithElementRef<
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
	import { cn } from '../../utils/cn';
	import { mergeProps } from '../../utils/mergeProps';
	import { attachRef } from '../../utils/ref';
	import { getSelectItemCtx } from './context';

	let { ref = $bindable(null), children, child, class: className, ...rest }: SelectItemTextProps =
		$props();
	const item = getSelectItemCtx();

	const refKey = createAttachmentKey();
	const merged = $derived(
		mergeProps(rest, {
			class: cn('select__item-text', className),
			[refKey]: attachRef<HTMLSpanElement>((n) => (ref = n))
		})
	);
</script>

{#if child}
	{@render child({ props: merged })}
{:else}
	<span {...merged}>{#if children}{@render children()}{:else}{item?.label ?? ''}{/if}</span>
{/if}

<style>
	.select__item-text {
		flex: 1 1 auto;
		min-width: 0;
		text-align: left;
	}
</style>
