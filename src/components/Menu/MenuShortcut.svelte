<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import type { WithElementRef } from '../../types';

	/** Keyboard-hint typography placed inside `Menu.ItemTrailing`; styled by the trailing slot's shortcut rule. */
	export type MenuShortcutProps = WithElementRef<
		Omit<HTMLAttributes<HTMLSpanElement>, 'children'> & {
			children?: Snippet;
			child?: Snippet<[{ props: Record<string, unknown> }]>;
		},
		HTMLSpanElement
	>;
</script>

<script lang="ts">
	import { createAttachmentKey } from 'svelte/attachments';
	import { mergeProps } from '../../utils/mergeProps';
	import { attachRef } from '../../utils/ref';
	import { cn } from '../../utils/cn';

	let { ref = $bindable(null), class: className, children, child, ...rest }: MenuShortcutProps =
		$props();
	const refKey = createAttachmentKey();
	const merged = $derived(
		mergeProps(rest, {
			class: cn('menu-item__shortcut', className),
			[refKey]: attachRef<HTMLSpanElement>((n) => (ref = n))
		})
	);
</script>

{#if child}
	{@render child({ props: merged })}
{:else}
	<span {...merged}>{@render children?.()}</span>
{/if}
