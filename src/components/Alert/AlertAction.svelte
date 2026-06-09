<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import type { WithElementRef } from '../../types';

	export type AlertActionProps = WithElementRef<
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

	let { ref = $bindable(null), class: className, children, child, ...rest }: AlertActionProps =
		$props();

	const refKey = createAttachmentKey();
	const merged = $derived(
		mergeProps(rest, {
			class: cn('alert__footer', className),
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
	.alert__footer {
		position: relative;
		width: 100%;
		padding: 0 var(--space-7) var(--space-5);
		display: flex;
		align-items: center;
		justify-content: flex-end;
		box-sizing: border-box;
		-webkit-user-select: none;
		user-select: none;
	}
</style>
