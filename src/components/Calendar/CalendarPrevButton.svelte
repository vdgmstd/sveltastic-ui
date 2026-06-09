<script lang="ts" module>
	import type { Snippet } from 'svelte';

	export type CalendarPrevButtonProps = {
		/** Accessible label. */
		ariaLabel?: string;
		/** Glyph size in px. */
		iconPx?: number;
		children?: Snippet;
	};
</script>

<script lang="ts">
	import { CaretLeftIcon } from 'phosphor-svelte';
	import Pressable from '../../primitives/Pressable.svelte';
	import { getCalendarCtx } from './context';

	let { ariaLabel = 'Previous', iconPx = 14, children }: CalendarPrevButtonProps = $props();

	const root = getCalendarCtx();
</script>

<Pressable
	variant="transparent"
	size="small"
	iconOnly
	color={root.color}
	disabled={root.disabled}
	aria-label={ariaLabel}
	onclick={() => root.handlePrev()}
>
	{#if children}{@render children()}{:else}<CaretLeftIcon size={iconPx} weight="bold" />{/if}
</Pressable>
