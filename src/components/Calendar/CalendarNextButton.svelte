<script lang="ts" module>
	import type { Snippet } from 'svelte';

	export type CalendarNextButtonProps = {
		/** Accessible label. */
		ariaLabel?: string;
		/** Glyph size in px. */
		iconPx?: number;
		children?: Snippet;
	};
</script>

<script lang="ts">
	import { CaretRightIcon } from 'phosphor-svelte';
	import Pressable from '../../primitives/Pressable.svelte';
	import { getCalendarCtx } from './context';

	let { ariaLabel = 'Next', iconPx = 14, children }: CalendarNextButtonProps = $props();

	const root = getCalendarCtx();
</script>

<Pressable
	variant="transparent"
	size="small"
	iconOnly
	color={root.color}
	disabled={root.disabled}
	aria-label={ariaLabel}
	onclick={() => root.handleNext()}
>
	{#if children}{@render children()}{:else}<CaretRightIcon size={iconPx} weight="bold" />{/if}
</Pressable>
