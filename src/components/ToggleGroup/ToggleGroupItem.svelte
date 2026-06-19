<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { HTMLButtonAttributes } from 'svelte/elements';
	import type { WithElementRef } from '../../types';

	export type ToggleGroupItemProps = WithElementRef<
		{
			/** Item identifier. Must be unique within the parent `ToggleGroup.Root`. */
			value: string;
			/** Inert this item only (the group `disabled` also cascades). */
			disabled?: boolean;
			/** Square icon-only padding, larger glyph. */
			iconOnly?: boolean;
			/** Accessible name — required for icon-only items with no visible text. */
			ariaLabel?: string;
			/** Label / icon content. */
			children?: Snippet;
			/** Render-delegation: receive the merged props + the styled body and render your own host element. */
			child?: Snippet<[{ props: Record<string, unknown>; body: Snippet }]>;
		} & Omit<HTMLButtonAttributes, 'children' | 'disabled' | 'value' | 'type' | 'color'>,
		HTMLButtonElement
	>;
</script>

<script lang="ts">
	import Pressable, { type PressableProps } from '../../primitives/Pressable.svelte';
	import { getToggleGroupCtx } from './context';

	let {
		value,
		disabled = false,
		iconOnly = false,
		ariaLabel,
		ref = $bindable(null),
		children,
		child,
		class: className,
		...rest
	}: ToggleGroupItemProps = $props();

	const ctx = getToggleGroupCtx();

	let isPressed = $derived(ctx.isPressed(value));
	let isInert = $derived(disabled || ctx.disabled);
	let itemId = $derived(ctx.itemId(value));

	$effect(() => ctx.registerValue(value));
	$effect(() => {
		if (ref && ctx.rovingFocus) return ctx.roving.register(itemId, ref, () => isInert);
	});

	function handleKeydown(event: KeyboardEvent): void {
		ctx.handleKeydown(event, value);
	}
</script>

<Pressable
	{...(rest as PressableProps)}
	bind:ref
	active={isPressed}
	onActiveChange={() => ctx.toggle(value)}
	variant={ctx.variant}
	color={ctx.color}
	size={ctx.size}
	shape={ctx.shape}
	ripple={ctx.ripple}
	disabled={isInert}
	{iconOnly}
	{ariaLabel}
	class={className}
	id={itemId}
	tabindex={ctx.rovingFocus ? ctx.roving.tabindexFor(itemId) : 0}
	onkeydown={handleKeydown}
	data-state={isPressed ? 'on' : 'off'}
	data-value={value}
	data-orientation={ctx.orientation}
	data-toggle-group-item=""
	{child}
>
	{@render children?.()}
</Pressable>
