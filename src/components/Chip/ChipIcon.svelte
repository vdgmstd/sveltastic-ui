<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import type { WithElementRef } from '../../types';

	export type ChipIconProps = WithElementRef<
		{
			children?: Snippet;
			child?: Snippet<[{ props: Record<string, unknown> }]>;
		} & HTMLAttributes<HTMLSpanElement>,
		HTMLSpanElement
	>;
</script>

<script lang="ts">
	import { createAttachmentKey } from 'svelte/attachments';
	import { cn } from '../../utils/cn';
	import { attachRef } from '../../utils/ref';
	import { mergeProps } from '../../utils/mergeProps';
	import { useChipCtx } from './context';

	let { children, child, ref = $bindable(null), class: className, ...rest }: ChipIconProps =
		$props();
	useChipCtx();

	const refKey = createAttachmentKey();
	let merged = $derived(
		mergeProps(rest, {
			class: cn('chip__icon', className),
			'aria-hidden': 'true',
			[refKey]: attachRef<HTMLSpanElement>((n) => (ref = n))
		})
	);
</script>

{#if child}
	{@render child({ props: merged })}
{:else}
	<span {...merged}>{@render children?.()}</span>
{/if}

<style>
	.chip__icon {
		position: relative;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		flex: 0 0 auto;
	}
</style>
