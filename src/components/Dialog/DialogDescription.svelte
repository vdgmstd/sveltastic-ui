<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import type { WithElementRef } from '../../types';

	export type DialogDescriptionProps = WithElementRef<
		Omit<HTMLAttributes<HTMLParagraphElement>, 'children'> & {
			children?: Snippet;
			child?: Snippet<[{ props: Record<string, unknown> }]>;
		},
		HTMLParagraphElement
	>;
</script>

<script lang="ts">
	import { createAttachmentKey } from 'svelte/attachments';
	import { getDialogCtx } from './context';
	import { mergeProps } from '../../utils/mergeProps';
	import { attachRef } from '../../utils/ref';
	import { cn } from '../../utils/cn';

	let {
		ref = $bindable(null),
		class: className,
		children,
		child,
		...rest
	}: DialogDescriptionProps = $props();
	const root = getDialogCtx();
	const uid = $props.id();
	const descriptionId = `dialog-desc-${uid}`;
	const refKey = createAttachmentKey();

	$effect(() => {
		root.descriptionId = descriptionId;
		return () => {
			if (root.descriptionId === descriptionId) root.descriptionId = undefined;
		};
	});

	const merged = $derived(
		mergeProps(rest, { id: descriptionId }, {
			class: cn('dialog__description', className),
			[refKey]: attachRef<HTMLParagraphElement>((n) => (ref = n))
		})
	);
</script>

{#if child}
	{@render child({ props: merged })}
{:else}
	<p {...merged}>{@render children?.()}</p>
{/if}

<style>
	.dialog__description { margin: 0; }
</style>
