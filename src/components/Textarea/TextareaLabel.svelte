<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { HTMLLabelAttributes } from 'svelte/elements';
	import type { WithElementRef } from '../../types';

	export type TextareaLabelProps = WithElementRef<
		Omit<HTMLLabelAttributes, 'for'> & {
			children?: Snippet;
			child?: Snippet<[{ props: Record<string, unknown> }]>;
		},
		HTMLLabelElement
	>;
</script>

<script lang="ts">
	import { createAttachmentKey } from 'svelte/attachments';
	import { cn } from '../../utils/cn';
	import { attachRef } from '../../utils/ref';
	import { mergeProps } from '../../utils/mergeProps';
	import { useTextareaCtx } from './context';

	let { ref = $bindable(null), class: className, children, child, ...rest }: TextareaLabelProps =
		$props();
	const ctx = useTextareaCtx();

	let isInline = $derived(ctx.labelStyle === 'inline');

	const refKey = createAttachmentKey();
	const merged = $derived(
		mergeProps(rest, {
			class: cn(
				isInline ? 'textarea__label-block' : 'textarea__label',
				ctx.isFloating && 'textarea__label--placeholder',
				!ctx.isFloating && !isInline && 'textarea__label--label',
				className
			),
			for: ctx.id,
			[refKey]: attachRef<HTMLLabelElement>((n) => (ref = n))
		})
	);
</script>

{#if child}
	{@render child({ props: merged })}
{:else}
	<label {...merged}>{@render children?.()}</label>
{/if}
