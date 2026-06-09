<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import type { WithElementRef } from '../../types';

	export type DialogFooterProps = WithElementRef<
		Omit<HTMLAttributes<HTMLElement>, 'children'> & {
			children?: Snippet;
			child?: Snippet<[{ props: Record<string, unknown> }]>;
		},
		HTMLElement
	>;
</script>

<script lang="ts">
	import { createAttachmentKey } from 'svelte/attachments';
	import { mergeProps } from '../../utils/mergeProps';
	import { attachRef } from '../../utils/ref';
	import { cn } from '../../utils/cn';

	let { ref = $bindable(null), class: className, children, child, ...rest }: DialogFooterProps =
		$props();
	const refKey = createAttachmentKey();
	const merged = $derived(
		mergeProps(rest, {
			class: cn('dialog__footer', className),
			[refKey]: attachRef((n) => (ref = n))
		})
	);
</script>

{#if child}
	{@render child({ props: merged })}
{:else}
	<footer {...merged}>{@render children?.()}</footer>
{/if}

<style>
	.dialog__footer {
		flex-shrink: 0;
		display: flex;
		justify-content: flex-end;
		gap: var(--space-4);
		padding: var(--space-6) var(--space-9) var(--space-8);
	}
</style>
