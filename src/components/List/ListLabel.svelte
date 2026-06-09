<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import type { WithElementRef } from '../../types';

	export type ListLabelProps = WithElementRef<
		{
			/** Caption content (small uppercase). */
			children?: Snippet;
		} & Omit<HTMLAttributes<HTMLDivElement>, 'children'>
	>;
</script>

<script lang="ts">
	import { createAttachmentKey } from 'svelte/attachments';
	import { mergeProps } from '../../utils/mergeProps';
	import { attachRef } from '../../utils/ref';

	let {
		children,
		ref = $bindable(null),
		class: className,
		style: userStyle,
		...rest
	}: ListLabelProps = $props();

	const attrs = $derived({
		class: 'list__label',
		'data-testid': 'list-label',
		style: userStyle
	});
	const merged = $derived(
		mergeProps(rest, attrs, {
			class: className,
			[createAttachmentKey()]: attachRef<HTMLDivElement>((n) => (ref = n))
		})
	);
</script>

<div {...merged}>{@render children?.()}</div>

<style>
	:where(.list__label) {
		font-size: var(--fs-xs);
		text-transform: uppercase;
		letter-spacing: 0.08em;
		font-weight: 600;
		opacity: 0.5;
		padding: var(--space-4) var(--space-6) var(--space-2);
		-webkit-user-select: none;
		user-select: none;
	}
</style>
