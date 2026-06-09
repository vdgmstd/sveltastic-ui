<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { WithElementRef } from '../../types';

	export type CalendarHeaderProps = WithElementRef<
		{
			children?: Snippet;
			/** Render-delegation snippet (bits-ui `asChild`). */
			child?: Snippet<[{ props: Record<string, unknown> }]>;
			class?: string;
		},
		HTMLDivElement
	>;
</script>

<script lang="ts">
	import { createAttachmentKey } from 'svelte/attachments';
	import { boolAttr } from '../../utils/attrs';
	import { mergeProps } from '../../utils/mergeProps';
	import { attachRef } from '../../utils/ref';
	import { getCalendarCtx } from './context';
	import PrevButton from './CalendarPrevButton.svelte';
	import Heading from './CalendarHeading.svelte';
	import NextButton from './CalendarNextButton.svelte';

	let {
		ref = $bindable(null),
		children,
		child,
		class: className,
		...rest
	}: CalendarHeaderProps = $props();

	const root = getCalendarCtx();
	const refKey = createAttachmentKey();

	let merged = $derived(
		mergeProps(rest, { 'data-disabled': boolAttr(root.disabled) }, {
			class: ['calendar-header', className],
			[refKey]: attachRef<HTMLDivElement>((n) => (ref = n))
		})
	);
</script>

{#if child}
	{@render child({ props: merged })}
{:else}
	<div {...merged}>
		{#if children}
			{@render children()}
		{:else}
			<PrevButton iconPx={root.iconPx} />
			<Heading caretPx={root.caretPx} />
			<NextButton iconPx={root.iconPx} />
		{/if}
	</div>
{/if}

<style>
	.calendar-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-2);
		padding: 0 var(--space-1) var(--cal-header-pad-b, var(--space-4));
	}
	.calendar-header[data-disabled] { opacity: 0.5; pointer-events: none; }
</style>
