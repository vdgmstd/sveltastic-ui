<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { HTMLLabelAttributes } from 'svelte/elements';
	import type { WithElementRef } from '../../types';

	export type SwitchLabelProps = WithElementRef<
		{
			/** Label content. */
			children?: Snippet;
			/** Render-delegation: receive the merged props and render your own label element. */
			child?: Snippet<[{ props: Record<string, unknown> }]>;
		} & Omit<HTMLLabelAttributes, 'children'>,
		HTMLLabelElement
	>;
</script>

<script lang="ts">
	import { createAttachmentKey } from 'svelte/attachments';
	import { cn } from '../../utils/cn';
	import { boolAttr } from '../../utils/attrs';
	import { mergeProps } from '../../utils/mergeProps';
	import { attachRef } from '../../utils/ref';
	import { useSwitchContext } from './context';

	let {
		children,
		child,
		ref = $bindable(null),
		class: className,
		...rest
	}: SwitchLabelProps = $props();

	const root = useSwitchContext();

	const refKey = createAttachmentKey();
	const attrs = $derived({
		class: cn('switch__label', className),
		for: root.id,
		'data-testid': 'switch-label',
		'data-disabled': boolAttr(root.disabled)
	});
	const merged = $derived(
		mergeProps(rest, attrs, {
			[refKey]: attachRef<HTMLLabelElement>((n) => (ref = n))
		})
	);
</script>

{#if child}
	{@render child({ props: merged })}
{:else}
	<label {...merged}>{@render children?.()}</label>
{/if}

<style>
	.switch__label {
		-webkit-user-select: none;
		user-select: none;
		cursor: pointer;
	}
	.switch__label[data-disabled] {
		opacity: 0.5;
		cursor: not-allowed;
	}
</style>
