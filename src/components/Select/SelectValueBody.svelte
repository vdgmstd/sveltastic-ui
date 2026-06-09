<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { SelectItem } from './selectState.svelte';

	export type SelectValueBodyProps<V = unknown> = {
		/** Placeholder for the filter input when nothing is selected (multi). */
		placeholder?: string;
		/** Custom single-mode display, replacing the default label. */
		custom?: Snippet<[{ selected: SelectItem<V> }]>;
	};

	export type { SelectItem } from './selectState.svelte';
</script>

<script lang="ts" generics="V">
	import { scale } from 'svelte/transition';
	import { Chip } from '../Chip';
	import { getSelectCtx } from './context';

	let { placeholder, custom }: SelectValueBodyProps<V> = $props();
	const root = getSelectCtx<V>();

	let chips = $derived(root.collapseChips ? root.chipItems.slice(0, 1) : root.chipItems);
</script>

{#if root.isMultiple}
	<div class="select__chips" data-placeholder={root.chipItems.length === 0 ? '' : undefined}>
		{#each chips as item (item.value)}
			<span
				class="select__chip-wrap"
				in:scale={{ duration: 160, start: 0.7, opacity: 0 }}
				out:scale={{ duration: 140, start: 0.7, opacity: 0 }}
			>
				{#if root.chipSnippet}
					{@render root.chipSnippet(item, () => root.removeChip(item.value))}
				{:else}
					<Chip.Root color={root.resolvedColor} size="small">
						{item.label}
						<Chip.Close onclose={() => root.removeChip(item.value)} />
					</Chip.Root>
				{/if}
			</span>
		{/each}
		{#if root.collapseChips && root.chipItems.length > 1}
			<Chip.Root color={root.resolvedColor} variant="flat" size="small">
				+{root.chipItems.length - 1}
			</Chip.Root>
		{/if}
		{#if root.filter}
			<input
				class="select__filter"
				type="text"
				value={root.filterText}
				placeholder={root.chipItems.length === 0 ? (placeholder ?? root.placeholder) : ''}
				autocomplete="off"
				autocorrect="off"
				autocapitalize="off"
				spellcheck="false"
				aria-autocomplete="list"
				aria-label={root.ariaLabel}
				aria-activedescendant={root.open ? root.activeId : undefined}
				oninput={(e) => root.setFilterText((e.currentTarget as HTMLInputElement).value)}
				onclick={(e) => { if (root.open) e.stopPropagation(); }}
				onkeydown={root.handleTriggerKeydown}
			/>
		{/if}
	</div>
{:else if custom && root.selectedItem && !(root.filter && root.open)}
	<div class="select__selected">
		{@render custom({ selected: root.selectedItem })}
	</div>
{/if}

<style>
	.select__chips {
		display: flex;
		flex-wrap: nowrap;
		align-items: center;
		gap: var(--space-3);
		flex: 1 1 auto;
		min-width: 0;
		overflow: hidden;
	}
	.select__chip-wrap {
		display: inline-flex;
		-webkit-user-select: none;
		user-select: none;
	}
	/* trigger chips are static tags — drop the standalone Chip hover-scale that clips against the field edge */
	.select__chips :global(.chip:not([data-disabled]):hover) {
		transform: none;
	}

	.select__filter {
		flex: 1 1 auto;
		min-width: 60px;
		padding: var(--space-1) 0;
		border: 0;
		outline: none;
		background: transparent;
		color: inherit;
		font: inherit;
		font-size: var(--fs-md);
	}
	@media (pointer: coarse) {
		.select__filter { font-size: max(16px, 1em); }
	}

	.select__selected {
		flex: 1 1 auto;
		min-width: 0;
		display: flex;
		align-items: center;
		padding: var(--space-1) var(--space-2);
		-webkit-user-select: none;
		user-select: none;
	}
</style>
