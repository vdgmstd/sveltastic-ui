<script lang="ts" module>
	import type { PartProps } from '../../types';

	/** Props for `Card.Image` — the clipped `.card__img-clip` holder (overflow hidden, hover-zoom on the direct child). */
	export type CardImageProps = PartProps<HTMLDivElement>;
</script>

<script lang="ts">
	import { createAttachmentKey } from 'svelte/attachments';
	import { cn } from '../../utils/cn';
	import { attachRef } from '../../utils/ref';
	import { mergeProps } from '../../utils/mergeProps';

	let { children, child, ref = $bindable(null), class: className, ...rest }: CardImageProps =
		$props();

	const refKey = createAttachmentKey();

	let merged = $derived(
		mergeProps(rest, {
			class: cn('card__img-clip', className),
			[refKey]: attachRef<HTMLDivElement>((n) => (ref = n))
		})
	);
</script>

{#if child}
	{@render child({ props: merged })}
{:else}
	<div {...merged}>{@render children?.()}</div>
{/if}
