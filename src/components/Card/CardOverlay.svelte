<script lang="ts" module>
	import type { PartProps } from '../../types';

	/** Props for `Card.Overlay` — the absolutely-positioned `.card__interactions` region (sibling of `Card.Image`). */
	export type CardOverlayProps = PartProps<HTMLDivElement>;
</script>

<script lang="ts">
	import { createAttachmentKey } from 'svelte/attachments';
	import { cn } from '../../utils/cn';
	import { attachRef } from '../../utils/ref';
	import { mergeProps } from '../../utils/mergeProps';

	let { children, child, ref = $bindable(null), class: className, ...rest }: CardOverlayProps =
		$props();

	const refKey = createAttachmentKey();

	let merged = $derived(
		mergeProps(rest, {
			class: cn('card__interactions', className),
			[refKey]: attachRef<HTMLDivElement>((n) => (ref = n))
		})
	);
</script>

{#if child}
	{@render child({ props: merged })}
{:else}
	<div {...merged}>{@render children?.()}</div>
{/if}
