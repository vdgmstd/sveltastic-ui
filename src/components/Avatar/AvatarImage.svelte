<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { HTMLImgAttributes } from 'svelte/elements';
	import type { WithElementRef } from '../../types';

	export type AvatarImageProps = WithElementRef<
		{
			/** Image URL. Drives the root loading status via an off-DOM probe. */
			src?: string;
			/** Accessible name for the image. */
			alt?: string;
			/** Render-delegation: receive the merged props and render your own element. */
			child?: Snippet<[{ props: Record<string, unknown> }]>;
		} & HTMLImgAttributes,
		HTMLImageElement
	>;
</script>

<script lang="ts">
	import { untrack } from 'svelte';
	import { createAttachmentKey } from 'svelte/attachments';
	import { cn } from '../../utils/cn';
	import { dataState } from '../../utils/attrs';
	import { attachRef } from '../../utils/ref';
	import { mergeProps } from '../../utils/mergeProps';
	import { getAvatarContext } from './context';

	let {
		src,
		alt,
		crossorigin,
		referrerpolicy,
		child,
		ref = $bindable(null),
		class: className,
		style: userStyle,
		...rest
	}: AvatarImageProps = $props();

	const root = getAvatarContext();
	const refKey = createAttachmentKey();

	$effect(() => {
		if (!src) {
			untrack(() => root.setStatus('error'));
			return;
		}
		const co = crossorigin;
		const rp = referrerpolicy ?? undefined;
		return untrack(() => root.loadImage(src, co, rp));
	});

	let isVisible = $derived(root.status === 'loaded');
	let style = $derived(
		[isVisible ? 'display:block' : 'display:none', userStyle].filter(Boolean).join(';')
	);

	const imageProps = $derived(
		mergeProps(rest, {
			src,
			alt: alt ?? '',
			crossorigin,
			referrerpolicy,
			class: cn('avatar__img', className),
			'data-avatar-image': '',
			'data-status': dataState(root.status),
			style,
			[refKey]: attachRef<HTMLImageElement>((n) => (ref = n))
		})
	);
</script>

<!-- Rounded clip wrapper keeps the img + hover zoom inside the frame; body itself is overflow:visible so badges/icons escape. -->
<span class="avatar__img-clip" aria-hidden="true">
	{#if child}
		{@render child({ props: imageProps })}
	{:else}
		<img {...imageProps} />
	{/if}
</span>

<style>
	.avatar__img-clip {
		position: absolute;
		inset: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		overflow: hidden;
		border-radius: inherit;
	}
</style>
