<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import type { WithElementRef } from '../../types';

	export type ComboboxContentProps = WithElementRef<
		Omit<HTMLAttributes<HTMLDivElement>, 'children'> & {
			/** Hand-authored rows (`Combobox.Item` / `Combobox.Group` / `Combobox.Empty`). When set, replaces the data-driven `items` rows. */
			children?: Snippet;
			/** Render-delegation: receive the merged props + a `body` snippet of the rows and render your own content element. */
			child?: Snippet<[{ props: Record<string, unknown>; body: Snippet }]>;
		},
		HTMLDivElement
	>;
</script>

<script lang="ts" generics="V">
	import { TrayIcon } from 'phosphor-svelte';
	import { cn } from '../../utils/cn';
	import { mergeProps } from '../../utils/mergeProps';
	import MenuLabel from '../../primitives/MenuLabel.svelte';
	import Item from './ComboboxItem.svelte';
	import { getComboboxCtx } from './context';

	let {
		ref = $bindable(null),
		children,
		child,
		class: className,
		...rest
	}: ComboboxContentProps = $props();
	const root = getComboboxCtx<V>();

	const setRef = (node: HTMLElement | null): void => {
		ref = node as HTMLDivElement | null;
	};
	const merged = $derived(mergeProps(rest, { class: cn(className) || undefined }));

	$effect(() => {
		root.contentSnippet = body;
		root.contentChild = child;
		root.setContentRef = setRef;
		return () => {
			if (root.contentSnippet === body) root.contentSnippet = undefined;
			root.contentChild = undefined;
			root.setContentRef = undefined;
		};
	});
	$effect(() => {
		root.contentProps = merged;
		return () => {
			root.contentProps = {};
		};
	});
</script>

{#snippet body(_close: () => void)}
	{#if children}
		{@render children()}
	{:else if root.visibleItems.length === 0}
		<div class="combobox__empty" data-state={root.open ? 'open' : 'closed'}>
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
	.combobox__empty {
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
