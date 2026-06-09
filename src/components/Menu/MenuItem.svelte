<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { WithElementRef } from '../../types';

	export type MenuItemSelectEvent = { preventDefault: () => void; defaultPrevented: boolean };

	export type MenuItemProps = WithElementRef<
		{
			/** Inert row, cannot be picked. */
			disabled?: boolean;
			/** Destructive action — colours and hover state shift to the danger palette. */
			danger?: boolean;
			/** Renders a checkmark on the right and tints the row. */
			selected?: boolean;
			/** Override the root `closeOnSelect` for this row. */
			closeOnSelect?: boolean;
			/** Fires on pick. Call `event.preventDefault()` to keep the menu open. */
			onSelect?: (event: MenuItemSelectEvent) => void;
			/** Row label / arbitrary content. Compose with `Menu.ItemIcon` / `Menu.ItemTrailing`. */
			children?: Snippet;
			/** Render-delegation: receive the merged props and render your own element. */
			child?: Snippet<[{ props: Record<string, unknown> }]>;
		},
		HTMLButtonElement
	>;
</script>

<script lang="ts">
	import { CheckIcon } from 'phosphor-svelte';
	import { createAttachmentKey } from 'svelte/attachments';
	import { mergeProps } from '../../utils/mergeProps';
	import { attachRef } from '../../utils/ref';
	import { boolAttr } from '../../utils/attrs';
	import { getMenuCtx, setMenuItemCtx } from './context';

	let {
		ref = $bindable(null),
		disabled = false,
		danger = false,
		selected = false,
		closeOnSelect,
		onSelect,
		children,
		child,
		...rest
	}: MenuItemProps = $props();
	const root = getMenuCtx();

	const uid = $props.id();
	const id = root.itemId(uid);

	let iconSnippet = $state<Snippet | undefined>(undefined);
	let trailingSnippet = $state<Snippet | undefined>(undefined);
	setMenuItemCtx({
		registerIcon: (s) => { iconSnippet = s; return () => { if (iconSnippet === s) iconSnippet = undefined; }; },
		registerTrailing: (s) => { trailingSnippet = s; return () => { if (trailingSnippet === s) trailingSnippet = undefined; }; }
	});

	function pick(): void {
		if (disabled) return;
		let prevented = false;
		onSelect?.({ preventDefault: () => (prevented = true), get defaultPrevented() { return prevented; } });
		if (!prevented) root.select(closeOnSelect);
	}

	const refKey = createAttachmentKey();
	const rovingKey = createAttachmentKey();
	// Stable identity — inlining re-ran register/deregister each recompute (loop vs tabindexFor).
	const registerRoving = (node: HTMLElement) => root.register(id, node);
	const attrs = $derived({
		type: 'button' as const,
		class: 'menu-item',
		role: 'menuitem' as const,
		disabled: disabled || undefined,
		'aria-disabled': disabled || undefined,
		'data-menu-id': id,
		'data-selected': boolAttr(selected),
		'data-danger': boolAttr(danger),
		'data-disabled': boolAttr(disabled),
		'data-highlighted': boolAttr(root.roving.current === id),
		tabindex: root.tabindexFor(id),
		onclick: pick
	});
	const merged = $derived(
		mergeProps(rest, attrs, {
			[refKey]: attachRef<HTMLButtonElement>((n) => (ref = n)),
			[rovingKey]: registerRoving
		})
	);
</script>

{#if child}
	{@render child({ props: merged })}
{:else}
	<button {...merged}>
		{#if iconSnippet}{@render iconSnippet()}{/if}
		<span class="menu-item__label">{@render children?.()}</span>
		{#if trailingSnippet}
			{@render trailingSnippet()}
		{:else if selected}
			<span class="menu-item__check" aria-hidden="true">
				<CheckIcon size={14} weight="bold" />
			</span>
		{/if}
	</button>
{/if}
