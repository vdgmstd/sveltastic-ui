<script lang="ts" module>
	import type { PartProps } from '../../types';

	/** Props for `Card.Body` — the `.card__text` body-copy region. */
	export type CardBodyProps = PartProps<HTMLDivElement>;
</script>

<script lang="ts">
	import { createAttachmentKey } from 'svelte/attachments';
	import { cn } from '../../utils/cn';
	import { attachRef } from '../../utils/ref';
	import { mergeProps } from '../../utils/mergeProps';

	let { children, child, ref = $bindable(null), class: className, ...rest }: CardBodyProps = $props();

	const refKey = createAttachmentKey();

	let merged = $derived(
		mergeProps(rest, { class: cn('card__text', className), [refKey]: attachRef<HTMLDivElement>((n) => (ref = n)) })
	);
</script>

{#if child}
	{@render child({ props: merged })}
{:else}
	<div {...merged}>{@render children?.()}</div>
{/if}
