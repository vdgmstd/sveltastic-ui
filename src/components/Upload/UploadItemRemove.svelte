<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { HTMLButtonAttributes } from 'svelte/elements';
	import type { WithElementRef } from '../../types';

	export type UploadItemRemoveProps = WithElementRef<
		{
			/** Custom button content; defaults to an X glyph. */
			children?: Snippet;
			/** Render-delegation: receive the merged props and render your own button. */
			child?: Snippet<[{ props: Record<string, unknown> }]>;
		} & Omit<HTMLButtonAttributes, 'children' | 'type'>,
		HTMLButtonElement
	>;
</script>

<script lang="ts">
	import { XIcon } from 'phosphor-svelte';
	import { createAttachmentKey } from 'svelte/attachments';
	import { mergeProps } from '../../utils/mergeProps';
	import { attachRef } from '../../utils/ref';
	import { useUploadItemContext } from './context';

	let {
		children,
		child,
		class: className,
		ref = $bindable(null),
		...rest
	}: UploadItemRemoveProps = $props();

	const item = useUploadItemContext();
	const refKey = createAttachmentKey();

	const merged = $derived(
		mergeProps(
			rest,
			{
				type: 'button' as const,
				class: 'upload__item-remove',
				'aria-label': `Remove ${item.file.name}`,
				onclick: (e: MouseEvent) => {
					e.stopPropagation();
					item.remove();
				}
			},
			{
				class: className,
				[refKey]: attachRef<HTMLButtonElement>((n) => (ref = n))
			}
		)
	);
</script>

{#if child}
	{@render child({ props: merged })}
{:else}
	<button {...merged}>
		{#if children}
			{@render children()}
		{:else}
			<XIcon size={12} weight="bold" />
		{/if}
	</button>
{/if}
