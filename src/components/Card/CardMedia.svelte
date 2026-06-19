<script lang="ts" module>
	import type { PartProps } from '../../types';

	/** Props for `Card.Media` — the `.card__img` media frame (place `Card.Image` + optional `Card.Overlay` inside). */
	export type CardMediaProps = PartProps<HTMLDivElement>;
</script>

<script lang="ts">
	import { createAttachmentKey } from 'svelte/attachments';
	import { cn } from '../../utils/cn';
	import { attachRef } from '../../utils/ref';
	import { mergeProps } from '../../utils/mergeProps';

	let { children, child, ref = $bindable(null), class: className, ...rest }: CardMediaProps =
		$props();

	const refKey = createAttachmentKey();

	let merged = $derived(
		mergeProps(rest, {
			class: cn('card__img', className),
			[refKey]: attachRef<HTMLDivElement>((n) => (ref = n))
		})
	);
</script>

{#if child}
	{@render child({ props: merged })}
{:else}
	<div {...merged}>{@render children?.()}</div>
{/if}
