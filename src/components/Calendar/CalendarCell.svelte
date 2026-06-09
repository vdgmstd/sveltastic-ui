<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { Temporal } from '@js-temporal/polyfill';
	import type { WithElementRef } from '../../types';

	export type CalendarCellProps = WithElementRef<
		{
			/** The day this cell wraps — mirrors the day's state onto `data-*`. */
			date: Temporal.PlainDate;
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

	let {
		date,
		ref = $bindable(null),
		children,
		child,
		class: className,
		...rest
	}: CalendarCellProps = $props();

	const root = getCalendarCtx();
	const refKey = createAttachmentKey();

	let s = $derived(root.dayState(date));

	let attrs = $derived({
		role: 'presentation',
		'data-selected': boolAttr(s.isSelected),
		'data-today': boolAttr(s.isToday),
		'data-outside-month': boolAttr(!s.isCurrentMonth),
		'data-disabled': boolAttr(s.isDisabled),
		'data-range-start': boolAttr(s.isRangeStart),
		'data-range-end': boolAttr(s.isRangeEnd),
		'data-in-range': boolAttr(s.isInRange),
		'data-preview': boolAttr(s.isPreview)
	});

	let merged = $derived(
		mergeProps(rest, attrs, {
			class: ['calendar__cell', className],
			[refKey]: attachRef<HTMLDivElement>((n) => (ref = n))
		})
	);
</script>

{#if child}
	{@render child({ props: merged })}
{:else}
	<div {...merged}>{@render children?.()}</div>
{/if}

<style>
	.calendar__cell {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		-webkit-user-select: none;
		user-select: none;
	}
</style>
