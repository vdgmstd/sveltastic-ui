<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import type { WithElementRef } from '../../types';

	export type ButtonIconProps = WithElementRef<
		{
			/** Side the glyph sits relative to the label. */
			position?: 'leading' | 'trailing';
			children?: Snippet;
			child?: Snippet<[{ props: Record<string, unknown> }]>;
		} & Omit<HTMLAttributes<HTMLSpanElement>, 'children'>
	>;
</script>

<script lang="ts">
	import { createAttachmentKey } from 'svelte/attachments';
	import { cn } from '../../utils/cn';
	import { attachRef } from '../../utils/ref';
	import { mergeProps } from '../../utils/mergeProps';

	let {
		position = 'leading',
		children,
		child,
		ref = $bindable(null),
		class: className,
		...rest
	}: ButtonIconProps = $props();

	const refKey = createAttachmentKey();
	const merged = $derived(
		mergeProps(rest, {
			class: cn('button__icon', `button__icon--${position}`, className),
			'aria-hidden': 'true',
			'data-position': position,
			'data-testid': 'button-icon',
			[refKey]: attachRef<HTMLElement>((n) => (ref = n))
		})
	);
</script>

{#if child}
	{@render child({ props: merged })}
{:else}
	<span {...merged}>{@render children?.()}</span>
{/if}

<style>
	.button__icon {
		display: inline-flex;
		align-items: center;
		justify-content: center;
	}
	.button__icon :global(svg) {
		flex-shrink: 0;
		/* Pin to the glyph's own size; Safari 16 resolves max-content to the SVG viewBox (huge). */
		min-width: 1em;
		min-height: 1em;
	}
</style>
