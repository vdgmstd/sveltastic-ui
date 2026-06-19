<script lang="ts" module>
	import type { PartProps } from '../../types';

	export type CardFooterProps = PartProps<HTMLDivElement> & {
		/** Float the strip absolutely, pinned to the card's bottom edge and hung 50% outside it (`.card__actions`). Default `false` renders the in-flow `.card__buttons` strip. */
		floating?: boolean;
	};
</script>

<script lang="ts">
	import { createAttachmentKey } from 'svelte/attachments';
	import { cn } from '../../utils/cn';
	import { boolAttr } from '../../utils/attrs';
	import { attachRef } from '../../utils/ref';
	import { mergeProps } from '../../utils/mergeProps';

	let {
		floating = false,
		children,
		child,
		ref = $bindable(null),
		class: className,
		...rest
	}: CardFooterProps = $props();

	const refKey = createAttachmentKey();

	let merged = $derived(
		mergeProps(rest, {
			class: cn(floating ? 'card__actions' : 'card__buttons', className),
			'data-floating': boolAttr(floating),
			[refKey]: attachRef<HTMLDivElement>((n) => (ref = n))
		})
	);
</script>

{#if child}
	{@render child({ props: merged })}
{:else}
	<div {...merged}>{@render children?.()}</div>
{/if}
