<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import type { WithElementRef } from '../../types';

	export type DialogTitleProps = WithElementRef<
		Omit<HTMLAttributes<HTMLElement>, 'children'> & {
			children?: Snippet;
			child?: Snippet<[{ props: Record<string, unknown> }]>;
		},
		HTMLElement
	>;
</script>

<script lang="ts">
	import { createAttachmentKey } from 'svelte/attachments';
	import { getDialogCtx } from './context';
	import { mergeProps } from '../../utils/mergeProps';
	import { attachRef } from '../../utils/ref';
	import { cn } from '../../utils/cn';

	let { ref = $bindable(null), class: className, children, child, ...rest }: DialogTitleProps =
		$props();
	const root = getDialogCtx();
	const uid = $props.id();
	const titleId = `dialog-title-${uid}`;
	const refKey = createAttachmentKey();

	$effect(() => {
		root.titleId = titleId;
		return () => {
			if (root.titleId === titleId) root.titleId = undefined;
		};
	});

	const merged = $derived(
		mergeProps(rest, { id: titleId }, {
			class: cn('dialog__header', className),
			[refKey]: attachRef((n) => (ref = n))
		})
	);
</script>

{#if child}
	{@render child({ props: merged })}
{:else}
	<header {...merged}>{@render children?.()}</header>
{/if}

<style>
	.dialog__header {
		flex-shrink: 0;
		padding-block: var(--space-8) var(--space-6);
		padding-inline: var(--space-9) 56px;
		font-size: var(--fs-xl);
		font-weight: 600;
	}
</style>
