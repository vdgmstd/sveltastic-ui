<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { WithElementRef } from '../../types';

	export type ComboboxItemProps<V = unknown> = WithElementRef<
		{
			/** Stored when this row is picked. */
			value: V;
			/** Visible label (used by the default row + filtering). */
			label?: string;
			/** Inert row, can't be picked. */
			disabled?: boolean;
			/** Override the auto-derived flat row index. Auto-indexing from mount order covers manual composition; pass this only to force a position. */
			index?: number;
			/** Custom row content (composed from Combobox.ItemText / Combobox.ItemIndicator). */
			children?: Snippet;
			/** Render-delegation: receive the merged option props and render your own element. */
			child?: Snippet<[{ props: Record<string, unknown> }]>;
		},
		HTMLElement
	>;
</script>

<script lang="ts" generics="V">
	import { createAttachmentKey } from 'svelte/attachments';
	import MenuItem from '../../primitives/MenuItem.svelte';
	import { mergeProps } from '../../utils/mergeProps';
	import { attachRef } from '../../utils/ref';
	import { dataState, boolAttr } from '../../utils/attrs';
	import { getComboboxCtx, setComboboxItemCtx } from './context';

	let {
		ref = $bindable(null),
		value,
		label,
		disabled = false,
		index: indexProp,
		children,
		child,
		...rest
	}: ComboboxItemProps<V> = $props();
	const root = getComboboxCtx<V>();

	const token = Symbol('ComboboxItem');
	let autoIndex = $derived(indexProp === undefined);
	$effect(() => {
		if (autoIndex) return root.registerItem(token);
	});
	let index = $derived(autoIndex ? root.itemIndex(token) : (indexProp as number));

	let isSelected = $derived(root.isSelected(value));
	let isHighlighted = $derived(index >= 0 && root.activeIndex === index);
	let optionId = $derived(root.optionId(index));

	setComboboxItemCtx({
		get isSelected() { return isSelected; },
		get isHighlighted() { return isHighlighted; },
		get label() { return label ?? String(value); }
	});

	function pick(): void {
		root.pick({ value, label: label ?? String(value), disabled });
	}

	const refKey = createAttachmentKey();
	const baseAttrs = $derived({
		id: optionId,
		'data-state': dataState(isSelected ? 'checked' : 'unchecked'),
		'data-selected': boolAttr(isSelected),
		'data-highlighted': boolAttr(isHighlighted),
		'data-disabled': boolAttr(disabled),
		'data-value': String(value),
		'data-label': label ?? String(value),
		'data-combobox-item': '',
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

<div class="combobox__row">
	{#if child}
		{@render child({ props: merged })}
	{:else}
		<MenuItem role="option" selected={isSelected} showCheck={!children} {disabled} {...menuProps}>
			{#if children}{@render children()}{:else}{label ?? String(value)}{/if}
		</MenuItem>
	{/if}
</div>

<style>
	.combobox__row {
		display: contents;
	}

	:global(.combobox__row .menu-item[data-highlighted]:not(:disabled):not([aria-disabled='true'])) {
		background: rgb(var(--c, var(--primary)) / 0.1);
	}
</style>
