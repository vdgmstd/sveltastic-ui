<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import type { WithElementRef } from '../../types';

	export type AlertIconProps = WithElementRef<
		Omit<HTMLAttributes<HTMLDivElement>, 'children'> & {
			children?: Snippet;
			child?: Snippet<[{ props: Record<string, unknown> }]>;
		}
	>;
</script>

<script lang="ts">
	import { createAttachmentKey } from 'svelte/attachments';
	import { cn } from '../../utils/cn';
	import { attachRef } from '../../utils/ref';
	import { mergeProps } from '../../utils/mergeProps';

	let { ref = $bindable(null), class: className, children, child, ...rest }: AlertIconProps =
		$props();

	const refKey = createAttachmentKey();
	const merged = $derived(
		mergeProps(rest, {
			class: cn('alert__icon', className),
			[refKey]: attachRef<HTMLElement>((n) => (ref = n))
		})
	);
</script>

{#if child}
	{@render child({ props: merged })}
{:else}
	<div {...merged}>{@render children?.()}</div>
{/if}

<style>
	.alert__icon {
		position: absolute;
		top: 15px;
		left: 0;
		width: 50px;
		height: 1.5rem;
		display: flex;
		align-items: center;
		justify-content: center;
		padding-left: var(--space-1);
		box-sizing: border-box;
		-webkit-user-select: none;
		user-select: none;
	}
	.alert__icon :global(i) { font-size: var(--fs-xl); color: rgb(255 255 255); }
	.alert__icon :global(svg) { width: 24px; height: 24px; fill: rgb(255 255 255); }
</style>
