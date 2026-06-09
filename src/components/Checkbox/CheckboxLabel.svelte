<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import type { WithElementRef } from '../../types';

	export type CheckboxLabelProps = WithElementRef<
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
	import { cn } from '../../utils/cn';
	import { mergeProps } from '../../utils/mergeProps';
	import { attachRef } from '../../utils/ref';

	let {
		children,
		child,
		ref = $bindable(null),
		class: className,
		...rest
	}: CheckboxLabelProps = $props();

	const refKey = createAttachmentKey();
	const merged = $derived(
		mergeProps(rest, {
			class: cn('checkbox__label', className),
			'data-testid': 'checkbox-label',
			[refKey]: attachRef<HTMLSpanElement>((n) => (ref = n))
		})
	);
</script>

{#if child}
	{@render child({ props: merged })}
{:else}
	<span {...merged}>{@render children?.()}</span>
{/if}

<style>
	.checkbox__label {
		position: relative;
		padding: var(--space-4) var(--space-2);
		cursor: pointer;
		opacity: calc(1 - 0.6 * var(--lt));
	}
	.checkbox__label::before {
		content: '';
		position: absolute;
		left: 4px;
		top: 50%;
		width: calc(var(--lt) * (100% - 8px));
		height: 2px;
		background: rgb(var(--text) / 0.6);
	}
	:global(.checkbox[data-label-before]) .checkbox__label {
		order: -1;
	}
	:global(.checkbox[data-disabled]) .checkbox__label {
		opacity: 0.5;
	}
</style>
