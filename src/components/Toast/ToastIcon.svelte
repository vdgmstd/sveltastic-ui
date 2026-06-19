<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import type { WithElementRef } from '../../types';

	export type ToastIconProps = WithElementRef<
		Omit<HTMLAttributes<HTMLSpanElement>, 'children'> & {
			children?: Snippet;
			/** Render-delegation: receive the merged props and render your own element. */
			child?: Snippet<[{ props: Record<string, unknown> }]>;
		},
		HTMLSpanElement
	>;
</script>

<script lang="ts">
	import { createAttachmentKey } from 'svelte/attachments';
	import { cn } from '../../utils/cn';
	import { mergeProps } from '../../utils/mergeProps';
	import { attachRef } from '../../utils/ref';
	import Spinner from '../../primitives/Spinner.svelte';
	import { getToastCtx } from './context';

	let { ref = $bindable(null), children, child, class: className, ...rest }: ToastIconProps = $props();
	const ctx = getToastCtx();

	let entry = $derived(ctx.entry);

	const refKey = createAttachmentKey();
	const merged = $derived(
		mergeProps(rest, {
			class: cn(entry.loading ? 'toast__spinner' : 'toast__icon', className),
			'aria-hidden': true,
			[refKey]: attachRef<HTMLSpanElement>((n) => (ref = n))
		})
	);
</script>

{#if child}
	{@render child({ props: merged })}
{:else}
	<span {...merged}>
		{#if children}
			{@render children()}
		{:else if entry.loading}
			<Spinner color={entry.color ?? 'primary'} size={20} thickness={2.4} speed={800} />
		{:else if entry.icon}
			{@render entry.icon()}
		{/if}
	</span>
{/if}
