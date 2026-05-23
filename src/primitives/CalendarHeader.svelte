<script lang="ts" module>
	import type { Color } from '../types';

	export type CalendarHeaderProps = {
		leftTitle?: string;
		rightTitle?: string;
		title?: string;
		disabled?: boolean;
		prevDisabled?: boolean;
		nextDisabled?: boolean;
		prevLabel?: string;
		nextLabel?: string;
		color?: Color;
		/** Prev/next chevron glyph size in px. */
		iconPx?: number;
		/** Caret glyph next to chip dropdowns in px. */
		caretPx?: number;
		onprev?: () => void;
		onnext?: () => void;
		onleft?: () => void;
		onright?: () => void;
	};
</script>

<script lang="ts">
	import { fade } from 'svelte/transition';
	import type { TransitionConfig } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import { CaretLeftIcon, CaretRightIcon, CaretDownIcon } from 'phosphor-svelte';
	import Button from '../components/Button/Button.svelte';

	function chipReveal(node: HTMLElement, { duration = 200 }: { duration?: number } = {}): TransitionConfig {
		const w = node.getBoundingClientRect().width;
		return {
			duration,
			easing: cubicOut,
			css: (t) => `opacity: ${t}; max-width: ${t * w}px;`
		};
	}

	let {
		leftTitle,
		rightTitle,
		title,
		disabled = false,
		prevDisabled = false,
		nextDisabled = false,
		prevLabel = 'Previous',
		nextLabel = 'Next',
		color = 'primary',
		iconPx = 14,
		caretPx = 11,
		onprev,
		onnext,
		onleft,
		onright
	}: CalendarHeaderProps = $props();

	let leftClickable = $derived(!!onleft && leftTitle !== undefined);
	let rightClickable = $derived(!!onright && rightTitle !== undefined);
</script>

<div class="calendar-header" class:calendar-header--disabled={disabled}>
	<Button
		variant="transparent"
		size="small"
		iconOnly
		{color}
		disabled={disabled || prevDisabled}
		aria-label={prevLabel}
		onclick={onprev}
	>
		<CaretLeftIcon size={iconPx} weight="bold" />
	</Button>
	<div class="calendar-header__title">
		{#if leftTitle !== undefined || rightTitle !== undefined}
			{#if leftTitle !== undefined}
				<span
					class="calendar-header__chip-slot"
					in:chipReveal={{ duration: 220 }}
					out:chipReveal={{ duration: 160 }}
				>
					<Button
						variant="transparent"
						size="small"
						{color}
						disabled={disabled || !leftClickable}
						onclick={onleft}
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
					</Button>
				</span>
			{/if}
			{#if rightTitle !== undefined}
				<span
					class="calendar-header__chip-slot"
					in:chipReveal={{ duration: 220 }}
					out:chipReveal={{ duration: 160 }}
				>
					<Button
						variant="transparent"
						size="small"
						{color}
						disabled={disabled || !rightClickable}
						onclick={onright}
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
					</Button>
				</span>
			{/if}
		{:else}
			<span class="calendar-header__static">{title ?? ''}</span>
		{/if}
	</div>
	<Button
		variant="transparent"
		size="small"
		iconOnly
		{color}
		disabled={disabled || nextDisabled}
		aria-label={nextLabel}
		onclick={onnext}
	>
		<CaretRightIcon size={iconPx} weight="bold" />
	</Button>
</div>

<style>
	.calendar-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 4px;
		padding: 0 2px var(--cal-header-pad-b, 8px);
	}
	.calendar-header--disabled { opacity: 0.5; pointer-events: none; }
	.calendar-header__title {
		flex: 1;
		min-width: 0;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 2px;
	}
	.calendar-header__static {
		padding: 0 8px;
		font-size: var(--cal-static-font, 0.85rem);
		font-weight: 500;
		opacity: 0.85;
	}
	.calendar-header__chip-slot {
		display: inline-flex;
		align-items: center;
		overflow: hidden;
		white-space: nowrap;
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
