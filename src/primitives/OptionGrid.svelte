<script lang="ts" module>
	import type { Color } from '../types';

	export type OptionItem = {
		key: number;
		label: string;
		disabled?: boolean;
		selected?: boolean;
		current?: boolean;
	};

	export type OptionGridProps = {
		items: ReadonlyArray<OptionItem>;
		columns?: number;
		disabled?: boolean;
		color?: Color;
		onselect?: (key: number) => void;
	};
</script>

<script lang="ts">
	import PickerButton from './PickerButton.svelte';

	let {
		items,
		columns = 3,
		disabled = false,
		color = 'primary',
		onselect
	}: OptionGridProps = $props();
</script>

<div class="option-grid" style:grid-template-columns="repeat({columns}, 1fr)">
	{#each items as item (item.key)}
		<PickerButton
			variant="option"
			{color}
			selected={item.selected}
			current={item.current && !item.selected}
			disabled={disabled || item.disabled}
			onclick={() => onselect?.(item.key)}
		>
			{item.label}
		</PickerButton>
	{/each}
</div>

<style>
	.option-grid {
		display: grid;
		gap: var(--cal-option-gap, 6px);
		padding: 4px 2px;
	}
</style>
