<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import type { WithElementRef } from '../../types';

	export type ProgressTrackProps = WithElementRef<
		{
			/** Default content rendered inside the linear track surface (e.g. an `Indicator`). */
			children?: Snippet;
			/** Render-delegation: receive the merged props and render your own track element. */
			child?: Snippet<[{ props: Record<string, unknown> }]>;
		} & Omit<HTMLAttributes<HTMLDivElement>, 'children'>,
		HTMLDivElement
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
		class: className,
		...rest
	}: ProgressTrackProps = $props();

	const ctx = useProgressCtx();
	let isCircular = $derived(ctx.shape === 'circular');

	const refKey = createAttachmentKey();
	const merged = $derived(
		mergeProps(rest, {
			class: cn(isCircular ? 'progress__svg' : 'progress__track', className),
			'aria-hidden': true,
			'data-shape': ctx.shape,
			'data-testid': 'progress-track',
			[refKey]: attachRef((n) => (ref = n as HTMLDivElement))
		})
	);
</script>

{#if child}
	{@render child({ props: merged })}
{:else if isCircular}
	{#if !ctx.isIndeterminate}
		<svg {...merged} viewBox="0 0 {ctx.size} {ctx.size}">
			<circle
				class="progress__ring-track"
				cx={ctx.size / 2}
				cy={ctx.size / 2}
				r={ctx.radius}
				stroke-width={ctx.thickness}
				stroke-dasharray="{ctx.thickness * 0.5} {ctx.thickness * 2.5}"
				fill="none"
			/>
		</svg>
	{/if}
	{@render children?.()}
{:else}
	<div {...merged}>{@render children?.()}</div>
{/if}

<style>
	.progress__track {
		position: absolute;
		inset: 0;
		background: rgb(var(--c) / 0.15);
		border-radius: var(--rad-pill);
		overflow: hidden;
		box-shadow: 0 1px 4px rgb(var(--c) / 0.25);
	}

	.progress__svg {
		position: absolute;
		inset: 0;
		display: block;
		width: 100%;
		height: 100%;
	}
	.progress__ring-track {
		stroke: rgb(var(--c));
		opacity: 0.3;
		stroke-linecap: round;
	}
</style>
