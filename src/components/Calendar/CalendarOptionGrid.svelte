<script lang="ts" module>
	import type { Color } from '../../types';
	import type { CalendarOptionItem } from './calendarState.svelte';

	export type CalendarOptionGridProps = {
		items: ReadonlyArray<CalendarOptionItem>;
		columns?: number;
		disabled?: boolean;
		color?: Color;
		/** Accessible name for the option listbox. */
		ariaLabel?: string;
		onselect?: (key: number) => void;
	};
</script>

<script lang="ts">
	import Option from './CalendarOption.svelte';

	let {
		items,
		columns = 3,
		disabled = false,
		color = 'primary',
		ariaLabel,
		onselect
	}: CalendarOptionGridProps = $props();

	let gridEl = $state<HTMLDivElement>();
	let activeKey = $state<number | null>(null);

	let enabledKeys = $derived(items.filter((i) => !(disabled || i.disabled)).map((i) => i.key));
	let rovingKey = $derived(
		activeKey ??
			items.find((i) => i.selected && !(disabled || i.disabled))?.key ??
			items.find((i) => i.current && !(disabled || i.disabled))?.key ??
			enabledKeys[0] ??
			null
	);

	function focusKey(key: number): void {
		activeKey = key;
		const idx = items.findIndex((i) => i.key === key);
		gridEl?.querySelectorAll<HTMLElement>('button')[idx]?.focus();
	}

	function handleKeydown(e: KeyboardEvent): void {
		if (disabled || enabledKeys.length === 0) return;
		const i = rovingKey == null ? -1 : enabledKeys.indexOf(rovingKey);
		let at = -1;
		switch (e.key) {
			case 'ArrowRight': at = i + 1; break;
			case 'ArrowLeft': at = i - 1; break;
			case 'ArrowDown': at = i + columns; break;
			case 'ArrowUp': at = i - columns; break;
			case 'Home': at = 0; break;
			case 'End': at = enabledKeys.length - 1; break;
			default: return;
		}
		e.preventDefault();
		at = Math.max(0, Math.min(enabledKeys.length - 1, at));
		focusKey(enabledKeys[at]);
	}
</script>

<div
	class="option-grid"
	style:grid-template-columns="repeat({columns}, 1fr)"
	bind:this={gridEl}
	role="listbox"
	tabindex={-1}
	aria-label={ariaLabel}
	aria-disabled={disabled || undefined}
	onkeydown={handleKeydown}
>
	{#each items as item (item.key)}
		<Option
			label={item.label}
			{color}
			selected={item.selected}
			current={item.current}
			disabled={disabled || item.disabled}
			focused={item.key === rovingKey}
			onselect={() => onselect?.(item.key)}
		/>
	{/each}
</div>

<style>
	.option-grid {
		display: grid;
		gap: var(--cal-option-gap, var(--space-3));
		padding: var(--space-2) var(--space-1);
		-webkit-user-select: none;
		user-select: none;
	}
</style>
