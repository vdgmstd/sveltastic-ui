<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import type { WithElementRef } from '../../types';

	export type ButtonGroupProps = WithElementRef<
		{
			/** Render-delegation: receive the merged prop bag and render your own element. */
			child?: Snippet<[{ props: Record<string, unknown> }]>;
			/** Grouped buttons. */
			children?: Snippet;
		} & Omit<HTMLAttributes<HTMLDivElement>, 'children'>
	>;
</script>

<script lang="ts">
	import { createAttachmentKey } from 'svelte/attachments';
	import { cn } from '../../utils/cn';
	import { attachRef } from '../../utils/ref';
	import { mergeProps } from '../../utils/mergeProps';

	let {
		children,
		child,
		ref = $bindable(null),
		class: className,
		...rest
	}: ButtonGroupProps = $props();

	const refKey = createAttachmentKey();
	let groupProps = $derived(
		mergeProps(rest, {
			class: cn('button-group', className),
			role: 'group' as const,
			'data-testid': 'button-group',
			[refKey]: attachRef<HTMLElement>((n) => (ref = n))
		})
	);
</script>

{#if child}
	{@render child({ props: groupProps })}
{:else}
	<div {...groupProps}>
		{@render children?.()}
	</div>
{/if}

<style>
	:where(.button-group) {
		display: inline-flex;
		align-items: center;
		justify-content: center;
	}
	.button-group :global(.button) {
		margin: 0;
	}
	.button-group :global(.button:not(:first-of-type):not(:last-of-type)) {
		border-radius: 0;
	}
	.button-group :global(.button--border:not(:first-of-type) .button__bg::before) {
		border-inline-start-width: 0;
	}
	.button-group :global(.button:first-of-type) {
		border-start-end-radius: 0;
		border-end-end-radius: 0;
	}
	.button-group :global(.button:last-of-type) {
		border-start-start-radius: 0;
		border-end-start-radius: 0;
	}
	/* No per-button press dip in a group — the shrinking fill would open gaps at shared edges. */
	.button-group :global(.button[data-pressing] .button__bg) {
		transform: none !important;
	}
</style>
