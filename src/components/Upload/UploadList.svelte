<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import type { WithElementRef } from '../../types';

	export type UploadListProps = WithElementRef<
		{
			/** Custom row loop (`<Upload.Item>` per file); defaults to auto-iterating the uploaded files. */
			children?: Snippet;
			/** Render-delegation: receive the merged props and render your own list element. */
			child?: Snippet<[{ props: Record<string, unknown> }]>;
		} & Omit<HTMLAttributes<HTMLUListElement>, 'children'>,
		HTMLUListElement
	>;
</script>

<script lang="ts">
	import { cubicOut } from 'svelte/easing';
	import { slide } from 'svelte/transition';
	import { createAttachmentKey } from 'svelte/attachments';
	import { mergeProps } from '../../utils/mergeProps';
	import { attachRef } from '../../utils/ref';
	import { useUploadContext } from './context';
	import UploadItem from './UploadItem.svelte';

	let {
		children,
		child,
		class: className,
		ref = $bindable(null),
		...rest
	}: UploadListProps = $props();

	const root = useUploadContext();
	const refKey = createAttachmentKey();

	const merged = $derived(
		mergeProps(rest, { class: 'upload__list' }, {
			class: className,
			[refKey]: attachRef<HTMLUListElement>((n) => (ref = n))
		})
	);
</script>

{#if root.hasFiles && !root.listHidden}
	{#if child}
		{@render child({ props: merged })}
	{:else}
		<ul {...merged} transition:slide={{ duration: 280, easing: cubicOut }}>
			{#if children}
				{@render children()}
			{:else}
				{#each root.files as file (root.ctl.id(file))}
					<UploadItem {file} />
				{/each}
			{/if}
		</ul>
	{/if}
{/if}
