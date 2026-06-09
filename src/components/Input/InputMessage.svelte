<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import type { WithElementRef } from '../../types';

	export type InputMessageProps = WithElementRef<
		Omit<HTMLAttributes<HTMLDivElement>, 'children'> & {
			children?: Snippet;
			child?: Snippet<[{ props: Record<string, unknown> }]>;
		}
	>;
</script>

<script lang="ts">
	import { createAttachmentKey } from 'svelte/attachments';
	import { slide } from 'svelte/transition';
	import { cubicInOut } from 'svelte/easing';
	import { cn } from '../../utils/cn';
	import { attachRef } from '../../utils/ref';
	import { mergeProps } from '../../utils/mergeProps';
	import { useInputCtx } from './context';

	let { ref = $bindable(null), class: className, children, child, ...rest }: InputMessageProps =
		$props();
	const ctx = useInputCtx();

	$effect(() => {
		ctx.hasMessage = true;
		return () => {
			ctx.hasMessage = false;
		};
	});

	const refKey = createAttachmentKey();
	const merged = $derived(
		mergeProps(rest, {
			class: cn('input__message', className),
			id: ctx.messageId,
			role: ctx.fieldState === 'danger' ? ('alert' as const) : ('status' as const),
			[refKey]: attachRef<HTMLDivElement>((n) => (ref = n))
		})
	);
</script>

{#if child}
	{@render child({ props: merged })}
{:else}
	<div {...merged} transition:slide={{ duration: 250, easing: cubicInOut }}>
		{@render children?.()}
	</div>
{/if}
