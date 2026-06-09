<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import type { Color, Size, WithElementRef } from '../../types';
	import type { ListVariant, ListRole } from './context';

	export type { ListVariant, ListRole } from './context';

	/** Selectable mode. `'single'` keeps one value; `'multiple'` keeps an array. Implies listbox semantics. */
	export type ListType = 'single' | 'multiple';

	export type ListProps<T = unknown> = WithElementRef<
		{
			/** Surface variant. */
			variant?: ListVariant;
			/** Palette name or hex / `rgb(...)` / `r,g,b`. Exposes `--c` for descendants. */
			color?: Color;
			/** Density token shared across all items. */
			size?: Size;
			/** Hairline divider between items. */
			divided?: boolean;
			/** Disable every item at once. */
			disabled?: boolean;
			/** A11y mode. `'list'` static, `'menu'` action group, `'listbox'` selectable. Drives item role + keyboard nav. */
			role?: ListRole;
			/** Selection mode. `'multiple'` implies `role: 'listbox'` + array `selected`. */
			type?: ListType;
			/** Allow multiple selection (`role: 'listbox'` only). Prefer `type: 'multiple'`. */
			multiple?: boolean;
			/** Selected value(s). Accepts `T` or `T[]`. Two-way bindable. */
			selected?: T | T[];
			/** Default content — `<List.Body>` plus optional `<List.Header>` / `<List.Footer>`. */
			children?: Snippet;
			/** Render-delegation: receive the merged props and render your own surface element. */
			child?: Snippet<[{ props: Record<string, unknown> }]>;
			/** Fired when the selection changes (`role: 'listbox'`). */
			onSelectedChange?: (value: T | T[]) => void;
		} & Omit<HTMLAttributes<HTMLDivElement>, 'children' | 'role'>
	>;
</script>

<script lang="ts" generics="T">
	import { createAttachmentKey } from 'svelte/attachments';
	import { rgbTriplet } from '../../utils/color';
	import { boolAttr } from '../../utils/attrs';
	import { mergeProps } from '../../utils/mergeProps';
	import { attachRef } from '../../utils/ref';
	import { setListContext } from './context';
	import { ListRootState } from './listState.svelte';

	let {
		variant = 'default',
		color = 'primary',
		size = 'medium',
		divided = false,
		disabled = false,
		role,
		type,
		multiple = false,
		selected = $bindable(),
		children,
		child,
		onSelectedChange,
		ref = $bindable(null),
		class: className,
		style: userStyle,
		...rest
	}: ListProps<T> = $props();

	let triplet = $derived(rgbTriplet(color));
	let resolvedRole = $derived<ListRole>(role ?? (type ? 'listbox' : 'list'));
	let resolvedMultiple = $derived(type === 'multiple' || multiple);

	function setSelected(value: unknown): void {
		selected = value as T | T[];
		onSelectedChange?.(value as T | T[]);
	}

	const root = setListContext(
		new ListRootState({
			variant: () => variant,
			color: () => color,
			size: () => size,
			divided: () => divided,
			disabled: () => disabled,
			role: () => resolvedRole,
			multiple: () => resolvedMultiple,
			getSelected: () => selected,
			setSelected
		})
	);

	$effect(() => () => root.destroy());

	const attrs = $derived({
		class: 'list',
		'data-variant': variant,
		'data-size': size,
		'data-divided': boolAttr(divided),
		'data-interactive': boolAttr(root.isInteractive),
		'data-disabled': boolAttr(disabled),
		'data-testid': 'list'
	});
	const merged = $derived(
		mergeProps(rest, attrs, {
			class: className,
			[createAttachmentKey()]: attachRef<HTMLDivElement>((n) => (ref = n))
		})
	);
</script>

{#if child}
	{@render child({ props: { ...merged, style: `--c:${triplet};${userStyle ?? ''}` } })}
{:else}
	<div {...merged} style:--c={triplet} style={userStyle}>
		{@render children?.()}
	</div>
{/if}

<style>
	:where(.list) {
		--c: var(--primary);
		display: flex;
		flex-direction: column;
		color: rgb(var(--text));
	}
</style>
