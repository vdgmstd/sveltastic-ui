<script lang="ts" module>
	import type { PartProps } from '../../types';

	/** Props for `Card.Header` — the `.card__title` heading. */
	export type CardHeaderProps = PartProps<HTMLDivElement>;
</script>

<script lang="ts">
	import { createAttachmentKey } from 'svelte/attachments';
	import { cn } from '../../utils/cn';
	import { attachRef } from '../../utils/ref';
	import { mergeProps } from '../../utils/mergeProps';

	let { children, child, ref = $bindable(null), class: className, ...rest }: CardHeaderProps = $props();

	const refKey = createAttachmentKey();

	let merged = $derived(
		mergeProps(rest, { class: cn('card__title', className), [refKey]: attachRef<HTMLDivElement>((n) => (ref = n)) })
	);
</script>

{#if child}
	{@render child({ props: merged })}
{:else}
	<div {...merged}>{@render children?.()}</div>
{/if}
