<script lang="ts" module>
	export type CalendarHeadingProps = {
		/** Caret glyph size in px. */
		caretPx?: number;
	};
</script>

<script lang="ts">
	import { fade } from 'svelte/transition';
	import type { TransitionConfig } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import { CaretDownIcon } from 'phosphor-svelte';
	import Pressable from '../../primitives/Pressable.svelte';
	import { getCalendarCtx } from './context';

	let { caretPx = 11 }: CalendarHeadingProps = $props();

	const root = getCalendarCtx();

	let leftTitle = $derived(root.leftTitle);
	let rightTitle = $derived(root.rightTitle);
	let leftClickable = $derived(leftTitle !== undefined && root.view === 'days');
	let rightClickable = $derived(rightTitle !== undefined);

	function chipReveal(node: HTMLElement, { duration = 200 }: { duration?: number } = {}): TransitionConfig {
		const w = node.getBoundingClientRect().width;
		return {
			duration,
			easing: cubicOut,
			css: (t) => `opacity: ${t}; max-width: ${t * w}px;`
		};
	}
</script>

<div class="calendar-header__title" aria-live="polite">
	{#if leftTitle !== undefined}
		<span
			class="calendar-header__chip-slot"
			in:chipReveal={{ duration: 220 }}
			out:chipReveal={{ duration: 160 }}
		>
			<Pressable
				variant="transparent"
				size="small"
				color={root.color}
				disabled={root.disabled || !leftClickable}
				onclick={() => root.handleLeft()}
			>
				<span class="calendar-header__chip-stack">
					{#key leftTitle}
						<span
							class="calendar-header__chip-text"
							in:fade={{ duration: 180, easing: cubicOut }}
							out:fade={{ duration: 120, easing: cubicOut }}
						>{leftTitle}</span>
					{/key}
				</span>
				{#if leftClickable}
					<CaretDownIcon size={caretPx} weight="bold" />
				{/if}
			</Pressable>
		</span>
	{/if}
	{#if rightTitle !== undefined}
		<span
			class="calendar-header__chip-slot"
			in:chipReveal={{ duration: 220 }}
			out:chipReveal={{ duration: 160 }}
		>
			<Pressable
				variant="transparent"
				size="small"
				color={root.color}
				disabled={root.disabled || !rightClickable}
				onclick={() => root.handleRight()}
			>
				<span class="calendar-header__chip-stack">
					{#key rightTitle}
						<span
							class="calendar-header__chip-text"
							in:fade={{ duration: 180, easing: cubicOut }}
							out:fade={{ duration: 120, easing: cubicOut }}
						>{rightTitle}</span>
					{/key}
				</span>
				{#if rightClickable}
					<CaretDownIcon size={caretPx} weight="bold" />
				{/if}
			</Pressable>
		</span>
	{/if}
</div>

<style>
	.calendar-header__title {
		flex: 1;
		min-width: 0;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: var(--space-1);
	}
	.calendar-header__chip-slot {
		display: inline-flex;
		align-items: center;
		overflow: hidden;
		white-space: nowrap;
		-webkit-user-select: none;
		user-select: none;
	}
	.calendar-header__chip-stack {
		display: inline-grid;
		grid-template-areas: 'stack';
		align-items: center;
		justify-items: center;
	}
	.calendar-header__chip-text {
		grid-area: stack;
		display: inline-block;
		white-space: nowrap;
	}
</style>
