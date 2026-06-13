<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import type { WithElementRef } from '../../types';

	export type UploadFooterProps = WithElementRef<
		{
			/** Custom footer content; replaces the built-in count + clear row. */
			children?: Snippet;
			/** Render-delegation: receive the merged props and render your own footer element. */
			child?: Snippet<[{ props: Record<string, unknown> }]>;
		} & Omit<HTMLAttributes<HTMLDivElement>, 'children'>,
		HTMLDivElement
	>;
</script>

<script lang="ts">
	import { cubicOut } from 'svelte/easing';
	import { slide } from 'svelte/transition';
	import { TrashIcon } from 'phosphor-svelte';
	import { createAttachmentKey } from 'svelte/attachments';
	import { mergeProps } from '../../utils/mergeProps';
	import { attachRef } from '../../utils/ref';
	import { formatSize } from './upload';
	import { useUploadContext } from './context';

	let {
		children,
		child,
		class: className,
		ref = $bindable(null),
		...rest
	}: UploadFooterProps = $props();

	const root = useUploadContext();
	const refKey = createAttachmentKey();

	const clear = () => root.ctl.clear();
	const showFooterRow = $derived(root.hasFiles && (root.clearable || !!children));

	const merged = $derived(
		mergeProps(rest, { class: 'upload__footer' }, {
			class: className,
			[refKey]: attachRef<HTMLDivElement>((n) => (ref = n))
		})
	);
</script>

{#if showFooterRow}
	{#if child}
		{@render child({ props: merged })}
	{:else}
		<div {...merged} transition:slide={{ duration: 280, easing: cubicOut }}>
			{#if children}
				{@render children()}
			{:else}
				<span class="upload__count">
					<span>{root.countText}</span>
					<span class="upload__dot" aria-hidden="true">·</span>
					<span class="upload__total">{formatSize(root.totalSize)}</span>
				</span>
				{#if root.clearable}
					<button
						type="button"
						class="upload__clear"
						onclick={(e) => {
							e.stopPropagation();
							clear();
						}}
					>
						<TrashIcon size={12} weight="bold" />
						<span class="upload__clear-label">{root.clearText}</span>
					</button>
				{/if}
			{/if}
		</div>
	{/if}
{/if}
