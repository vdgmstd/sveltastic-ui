<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import type { WithElementRef } from '../../types';

	export type CheckboxIconProps = WithElementRef<
		{
			/** The custom glyph rendered when checked (replaces the default check). */
			children?: Snippet;
			/** Render-delegation: receive the merged props and render your own glyph element. */
			child?: Snippet<[{ props: Record<string, unknown> }]>;
		} & Omit<HTMLAttributes<HTMLSpanElement>, 'children'>,
		HTMLSpanElement
	>;
</script>

<script lang="ts">
	import { untrack } from 'svelte';
	import { createAttachmentKey } from 'svelte/attachments';
	import { cn } from '../../utils/cn';
	import { mergeProps } from '../../utils/mergeProps';
	import { attachRef } from '../../utils/ref';
	import { useCheckboxRootContext } from './context';

	let {
		children,
		child,
		ref = $bindable(null),
		class: className,
		...rest
	}: CheckboxIconProps = $props();

	const state = useCheckboxRootContext();
	$effect(() => untrack(() => state.registerIcon()));

	const refKey = createAttachmentKey();
	const merged = $derived(
		mergeProps(rest, {
			class: cn('checkbox__glyph', 'checkbox__glyph--custom', className),
			'aria-hidden': 'true',
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
	.checkbox__glyph {
		position: absolute;
		inset: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		color: rgb(var(--on-accent));
		z-index: 2;
	}
	.checkbox__glyph--custom {
		opacity: 0;
		transform: scale(0.4);
		transform-origin: center;
		transition:
			opacity 220ms var(--ease-standard),
			transform 280ms var(--ease-back);
	}
	:global(.checkbox[data-show-glyph]) .checkbox__glyph--custom {
		opacity: 1;
		transform: scale(1);
	}
</style>
