<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import type { WithElementRef } from '../../types';

	export type ListGroupProps = WithElementRef<
		{
			/** Body — usually `<List.GroupLabel>` + `<List.Item>` children. */
			children?: Snippet;
			/** Render-delegation: receive the merged props and render your own element. */
			child?: Snippet<[{ props: Record<string, unknown> }]>;
		} & Omit<HTMLAttributes<HTMLDivElement>, 'children'>
	>;
</script>

<script lang="ts">
	import { createAttachmentKey } from 'svelte/attachments';
	import { mergeProps } from '../../utils/mergeProps';
	import { attachRef } from '../../utils/ref';
	import { setListGroupContext } from './context';

	let {
		children,
		child,
		ref = $bindable(null),
		class: className,
		style: userStyle,
		...rest
	}: ListGroupProps = $props();

	const labelId = $props.id();
	let labelled = $state(false);

	setListGroupContext({ labelId, setLabelled: () => (labelled = true) });

	const attrs = $derived({
		class: 'list-group',
		role: 'group',
		'aria-labelledby': labelled ? labelId : undefined,
		'data-testid': 'list-group',
		style: userStyle
	});
	const merged = $derived(
		mergeProps(rest, attrs, {
			class: className,
			[createAttachmentKey()]: attachRef<HTMLDivElement>((n) => (ref = n))
		})
	);
</script>

{#if child}
	{@render child({ props: merged })}
{:else}
	<div {...merged}>{@render children?.()}</div>
{/if}

<style>
	:where(.list-group) {
		display: flex;
		flex-direction: column;
	}
	.list-group + :global(.list-group) {
		margin-top: var(--space-3);
	}
</style>
