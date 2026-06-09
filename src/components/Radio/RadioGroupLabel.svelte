<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import type { WithElementRef } from '../../types';

	export type RadioGroupLabelProps = WithElementRef<
		{
			/** Label content. */
			children?: Snippet;
			/** Render-delegation: receive the merged props and render your own label element. */
			child?: Snippet<[{ props: Record<string, unknown> }]>;
		} & Omit<HTMLAttributes<HTMLSpanElement>, 'children'>,
		HTMLSpanElement
	>;
</script>

<script lang="ts">
	import { createAttachmentKey } from 'svelte/attachments';
	import { mergeProps } from '../../utils/mergeProps';
	import { attachRef } from '../../utils/ref';

	let {
		ref = $bindable(null),
		children,
		child,
		class: className,
		...rest
	}: RadioGroupLabelProps = $props();

	const refKey = createAttachmentKey();
	const attrs = $derived({
		class: 'radio__label',
		'data-testid': 'radio-group-label'
	});
	const merged = $derived(
		mergeProps(rest, attrs, {
			class: className,
			[refKey]: attachRef<HTMLSpanElement>((n) => (ref = n))
		})
	);
</script>

{#if child}
	{@render child({ props: merged })}
{:else}
	<span {...merged}>{@render children?.()}</span>
{/if}
