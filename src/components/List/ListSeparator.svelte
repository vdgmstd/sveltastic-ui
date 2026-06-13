<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import type { WithElementRef } from '../../types';

	export type ListSeparatorProps = WithElementRef<
		{
			/** Inset divider — leaves a gutter on the left to align with item label. */
			inset?: boolean;
			/** Render-delegation: receive the merged props and render your own element. */
			child?: Snippet<[{ props: Record<string, unknown> }]>;
		} & HTMLAttributes<HTMLHRElement>,
		HTMLHRElement
	>;
</script>

<script lang="ts">
	import { createAttachmentKey } from 'svelte/attachments';
	import { boolAttr } from '../../utils/attrs';
	import { mergeProps } from '../../utils/mergeProps';
	import { attachRef } from '../../utils/ref';

	let {
		inset = false,
		child,
		ref = $bindable(null),
		class: className,
		style: userStyle,
		...rest
	}: ListSeparatorProps = $props();

	const attrs = $derived({
		class: ['list-divider', inset ? 'list-divider--inset' : undefined].filter(Boolean).join(' '),
		'data-inset': boolAttr(inset),
		'data-testid': 'list-separator',
		style: userStyle
	});
	const merged = $derived(
		mergeProps(rest, attrs, {
			class: className,
			[createAttachmentKey()]: attachRef<HTMLHRElement>((n) => (ref = n))
		})
	);
</script>

{#if child}
	{@render child({ props: merged })}
{:else}
	<hr {...merged} />
{/if}

<style>
	:where(.list-divider) {
		border: 0;
		height: 1px;
		margin: var(--space-2) 0;
		background: rgb(var(--text) / 0.08);
	}
	:where(.list-divider--inset),
	:where(.list-divider[data-inset]) {
		margin-inline-start: 44px;
	}
</style>
