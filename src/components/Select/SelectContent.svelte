<script lang="ts" module>
	import type { Snippet } from 'svelte';

	export type SelectContentProps = {
		/** Hand-authored rows. When set, replaces the data-driven `items` rows. */
		children?: Snippet;
	};
</script>

<script lang="ts" generics="V">
	import { TrayIcon } from 'phosphor-svelte';
	import MenuLabel from '../../primitives/MenuLabel.svelte';
	import Item from './SelectItem.svelte';
	import { getSelectCtx } from './context';

	let { children }: SelectContentProps = $props();
	const root = getSelectCtx<V>();

	$effect(() => {
		root.contentSnippet = body;
		return () => {
			if (root.contentSnippet === body) root.contentSnippet = undefined;
		};
	});
</script>

{#snippet body(_close: () => void)}
	{#if children}
		{@render children()}
	{:else if root.visibleItems.length === 0}
		<div class="select__empty" data-state={root.open ? 'open' : 'closed'}>
			{#if root.emptySnippet}
				{@render root.emptySnippet()}
			{:else}
				<TrayIcon size={28} weight="duotone" />
				<span>{root.emptyText}</span>
			{/if}
		</div>
	{:else}
		{#each root.renderSections as section, i (section.title ?? `_${i}`)}
			{#if section.title}
				<MenuLabel>{section.title}</MenuLabel>
			{/if}
			{#each section.items as item, j (item.value)}
				{@const gi = root.sectionOffsets[i] + j}
				<Item value={item.value} label={item.label} disabled={item.disabled} index={gi} />
			{/each}
		{/each}
	{/if}
{/snippet}

<style>
	.select__empty {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: var(--space-3);
		padding: var(--space-8) var(--space-7);
		font-size: var(--fs-md);
		color: rgb(var(--text) / 0.5);
		text-align: center;
	}
</style>
