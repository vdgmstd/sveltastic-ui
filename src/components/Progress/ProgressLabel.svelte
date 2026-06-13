<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import type { WithElementRef } from '../../types';

	export type ProgressLabelProps = WithElementRef<
		{
			/** Label content rendered over the bar (linear) or centered in the ring (circular). */
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
	import { attachRef } from '../../utils/ref';
	import { mergeProps } from '../../utils/mergeProps';
	import { useProgressCtx } from './context';

	let {
		children,
		child,
		ref = $bindable(null),
		id: idProp,
		class: className,
		...rest
	}: ProgressLabelProps = $props();

	const ctx = useProgressCtx();
	let labelId = $derived(idProp ?? ctx.defaultLabelId);
	$effect(() => {
		ctx.hasLabel = true;
		ctx.labelId = labelId;
		return () => {
			ctx.hasLabel = false;
			ctx.labelId = undefined;
		};
	});

	const refKey = createAttachmentKey();
	const merged = $derived(
		mergeProps(rest, {
			id: labelId,
			class: cn('progress__label', className),
			'data-shape': ctx.shape,
			'data-testid': 'progress-label',
			[refKey]: attachRef((n) => (ref = n as HTMLSpanElement))
		})
	);
</script>

{#if child}
	{@render child({ props: merged })}
{:else}
	<span {...merged}>{@render children?.()}</span>
{/if}

<style>
	.progress__label {
		position: absolute;
		inset: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: var(--fs-xs);
		font-weight: 500;
		color: rgb(var(--c));
		pointer-events: none;
		-webkit-user-select: none;
		user-select: none;
	}
	.progress__label[data-shape='linear'] {
		mix-blend-mode: difference;
	}
</style>
