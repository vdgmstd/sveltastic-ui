<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import type { WithElementRef } from '../../types';

	export type DialogBodyProps = WithElementRef<
		Omit<HTMLAttributes<HTMLDivElement>, 'children'> & {
			children?: Snippet;
			child?: Snippet<[{ props: Record<string, unknown> }]>;
		},
		HTMLDivElement
	>;
</script>

<script lang="ts">
	import { createAttachmentKey } from 'svelte/attachments';
	import { getDialogCtx } from './context';
	import { mergeProps } from '../../utils/mergeProps';
	import { attachRef } from '../../utils/ref';
	import { boolAttr } from '../../utils/attrs';
	import { cn } from '../../utils/cn';

	let { ref = $bindable(null), class: className, children, child, ...rest }: DialogBodyProps =
		$props();
	const root = getDialogCtx();
	const refKey = createAttachmentKey();

	// Reproduces the old `.dialog__header + .dialog__body` adjacency across scoped parts.
	const merged = $derived(
		mergeProps(rest, { 'data-after-title': boolAttr(!!root.titleId) }, {
			class: cn('dialog__body', className),
			[refKey]: attachRef<HTMLDivElement>((n) => (ref = n))
		})
	);
</script>

{#if child}
	{@render child({ props: merged })}
{:else}
	<div {...merged}>{@render children?.()}</div>
{/if}

<style>
	.dialog__body {
		flex: 1 1 auto;
		min-height: 0;
		overflow-y: auto;
		padding: var(--space-6) var(--space-9) var(--space-8);
	}
	.dialog__body[data-after-title] { padding-top: var(--space-2); }
</style>
