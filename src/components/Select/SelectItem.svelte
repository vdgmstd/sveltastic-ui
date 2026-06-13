<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { WithElementRef } from '../../types';

	export type SelectItemProps<V = unknown> = WithElementRef<
		{
			/** Stored when this row is picked. */
			value: V;
			/** Visible label (used by the default row + typeahead). */
			label?: string;
			/** Inert row, can't be picked. */
			disabled?: boolean;
			/** Override the auto-derived flat row index. Auto-indexing from mount order covers manual composition; pass this only to force a position. */
			index?: number;
			/** Custom row content (composed from Select.ItemText / Select.ItemIndicator). */
			children?: Snippet;
			/** Render-delegation: receive the merged option props and render your own element. */
			child?: Snippet<[{ props: Record<string, unknown> }]>;
		},
		HTMLElement
	>;
</script>

<script lang="ts" generics="V">
	import { fly } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import { createAttachmentKey } from 'svelte/attachments';
	import MenuItem from '../../primitives/MenuItem.svelte';
	import { mergeProps } from '../../utils/mergeProps';
	import { attachRef } from '../../utils/ref';
	import { dataState, boolAttr } from '../../utils/attrs';
	import { getSelectCtx, setSelectItemCtx } from './context';

	let {
		ref = $bindable(null),
		value,
		label,
		disabled = false,
		index: indexProp,
		children,
		child,
		...rest
	}: SelectItemProps<V> = $props();
	const root = getSelectCtx<V>();

	// Auto-index from mount order unless an explicit `index` is passed (explicit wins).
	const token = Symbol('SelectItem');
	let autoIndex = $derived(indexProp === undefined);
	$effect(() => {
		if (autoIndex) return root.registerItem(token);
	});
	let index = $derived(autoIndex ? root.itemIndex(token) : (indexProp as number));

	let isSelected = $derived(root.isSelected(value));
	let isHighlighted = $derived(index >= 0 && root.activeIndex === index);
	let optionId = $derived(root.optionId(index));

	setSelectItemCtx({
		get isSelected() { return isSelected; },
		get isHighlighted() { return isHighlighted; },
		get label() { return label ?? String(value); }
	});

	function rowIn() {
		const animate = root.isStagger && root.justOpened;
		return animate
			? { y: -6, duration: 220, delay: index * 26, easing: cubicOut }
			: { duration: 0 };
	}

	function pick(): void {
		root.pick({ value, label: label ?? String(value), disabled });
	}

	const refKey = createAttachmentKey();
	const baseAttrs = $derived({
		id: optionId,
		'data-state': dataState(isSelected ? 'checked' : 'unchecked'),
		'data-highlighted': boolAttr(isHighlighted),
		'data-disabled': boolAttr(disabled),
		onmousemove: () => { root.activeIndex = index; },
		onclick: pick
	});

	const merged = $derived(
		mergeProps(
			rest,
			{
				...baseAttrs,
				role: 'option' as const,
				'aria-selected': isSelected,
				'aria-disabled': disabled || undefined
			},
			{ [refKey]: attachRef<HTMLElement>((n) => (ref = n)) }
		)
	);

	const menuProps = $derived(
		mergeProps(rest, baseAttrs, { [refKey]: attachRef<HTMLElement>((n) => (ref = n)) })
	);
</script>

<div
	class="select__row"
	in:fly={rowIn()}
	onintroend={index === root.visibleItems.length - 1 ? root.clearJustOpened : undefined}
>
	{#if child}
		{@render child({ props: merged })}
	{:else}
		<MenuItem role="option" selected={isSelected} showCheck={!children} {disabled} {...menuProps}>
			{#if children}{@render children()}{:else}{label ?? String(value)}{/if}
		</MenuItem>
	{/if}
</div>

<style>
	.select__row {
		display: contents;
	}

	:global(.select__row .menu-item[data-highlighted]:not(:disabled):not([aria-disabled='true'])) {
		background: rgb(var(--c, var(--primary)) / 0.1);
	}
</style>
