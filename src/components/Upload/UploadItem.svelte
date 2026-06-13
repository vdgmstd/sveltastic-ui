<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { HTMLLiAttributes } from 'svelte/elements';
	import type { WithElementRef } from '../../types';

	export type UploadItemProps = WithElementRef<
		{
			/** The file this row represents. */
			file: File;
			/** Custom row content; defaults to thumbnail + name + size + remove. */
			children?: Snippet;
			/** Render-delegation: receive the merged props and render your own `<li>`. */
			child?: Snippet<[{ props: Record<string, unknown> }]>;
		} & Omit<HTMLLiAttributes, 'children'>,
		HTMLLIElement
	>;
</script>

<script lang="ts">
	import { cubicOut } from 'svelte/easing';
	import { createAttachmentKey } from 'svelte/attachments';
	import { mergeProps } from '../../utils/mergeProps';
	import { attachRef } from '../../utils/ref';
	import { formatSize, fileGlyph } from './upload';
	import { setUploadItemContext, useUploadContext } from './context';
	import UploadItemRemove from './UploadItemRemove.svelte';

	let {
		file,
		children,
		child,
		class: className,
		ref = $bindable(null),
		...rest
	}: UploadItemProps = $props();

	const root = useUploadContext();
	const refKey = createAttachmentKey();

	function slideFade(node: HTMLElement) {
		const cs = getComputedStyle(node);
		const h = node.offsetHeight;
		const pt = parseFloat(cs.paddingTop);
		const pb = parseFloat(cs.paddingBottom);
		return {
			duration: 240,
			easing: cubicOut,
			css: (t: number, u: number) =>
				`overflow: hidden;` +
				`height: ${t * h}px;` +
				`padding-top: ${t * pt}px;` +
				`padding-bottom: ${t * pb}px;` +
				`opacity: ${t};` +
				`transform: translateX(${u * -8}px);`
		};
	}

	const Glyph = $derived(fileGlyph(file));
	const thumb = $derived(root.showThumbs ? root.thumbFor(file) : undefined);

	setUploadItemContext({
		get file() {
			return file;
		},
		get removeLabel() {
			return root.removeLabelFor(file);
		},
		remove: () => root.ctl.remove(file)
	});

	const merged = $derived(
		mergeProps(rest, { class: 'upload__item' }, {
			class: className,
			[refKey]: attachRef<HTMLLIElement>((n) => (ref = n))
		})
	);
</script>

{#if child}
	{@render child({ props: merged })}
{:else}
	<li {...merged} transition:slideFade>
		{#if children}
			{@render children()}
		{:else}
			<span class="upload__item-thumb" aria-hidden="true">
				{#if thumb}
					<img class="upload__item-img" src={thumb} alt="" />
				{:else}
					<Glyph size={root.itemIconSize} weight="duotone" />
				{/if}
			</span>
			<span class="upload__item-text">
				<span class="upload__item-name" title={file.name}>{file.name}</span>
				<span class="upload__item-size">{formatSize(file.size)}</span>
			</span>
			<UploadItemRemove />
		{/if}
	</li>
{/if}
