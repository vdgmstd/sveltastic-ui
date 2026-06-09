<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { HTMLLabelAttributes } from 'svelte/elements';
	import type { WithElementRef } from '../../types';

	export type InputLabelProps = WithElementRef<
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
	import { useInputCtx } from './context';

	let { ref = $bindable(null), class: className, children, child, ...rest }: InputLabelProps = $props();
	const ctx = useInputCtx();

	let isInline = $derived(ctx.labelStyle === 'inline');

	const refKey = createAttachmentKey();
	const merged = $derived(
		mergeProps(rest, {
			class: cn(
				isInline ? 'input__label-block' : 'input__label',
				!isInline && ctx.isFloating && 'input__label--placeholder',
				!isInline && !ctx.isFloating && 'input__label--label',
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
