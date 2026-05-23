<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import type { Color, Size } from '../../types';
	import type { ListVariant, ListRole } from './context';

	export type { ListVariant, ListRole } from './context';

	export type ListProps<T = unknown> = {
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
		/** Allow multiple selection (`role: 'listbox'` only). */
		multiple?: boolean;
		/** Selected value(s). Accepts `T` or `T[]`. Two-way bindable. */
		selected?: T | T[];
		/** Items array — alternative to `children` snippet. Pair with `item` snippet. */
		items?: T[];
		/** Render function for an item from `items`. */
		item?: Snippet<[T, number]>;
		/** Sticky header above the surface. */
		header?: Snippet;
		/** Section label rendered inside the surface (small uppercase caption). */
		label?: Snippet;
		/** Default content — use `<ListItem>` children directly. */
		children?: Snippet;
		/** Footer slot pinned below the surface. */
		footer?: Snippet;
		/** Empty-state body shown when `items` is empty. */
		empty?: Snippet;
		/** Fired on selection change (`role: 'listbox'`). */
		onselect?: (value: T) => void;
	} & Omit<HTMLAttributes<HTMLDivElement>, 'children' | 'role'>;
</script>

<script lang="ts" generics="T">
	import { rgbTriplet } from '../../utils/color';
	import { cn } from '../../utils/cn';
	import { createListContext, type ListContext } from './context';

	let {
		variant = 'default',
		color = 'primary',
		size = 'medium',
		divided = false,
		disabled = false,
		role = 'list',
		multiple = false,
		selected = $bindable(),
		items,
		item,
		header,
		label,
		children,
		footer,
		empty,
		onselect,
		class: className,
		style: userStyle,
		...rest
	}: ListProps<T> = $props();

	let triplet = $derived(rgbTriplet(color));
	let surfaceRole = $derived(role === 'menu' ? 'menu' : role === 'listbox' ? 'listbox' : 'list');
	let isInteractive = $derived(role !== 'list');

	type Entry = { id: string; el: HTMLElement; getValue: () => unknown; getDisabled: () => boolean };
	const order: string[] = $state([]);
	const entries = new Map<string, Entry>();

	function isSelected(value: unknown): boolean {
		if (multiple) {
			return Array.isArray(selected) && (selected as unknown[]).includes(value);
		}
		return selected === value;
	}

	function select(value: unknown): void {
		if (role !== 'listbox') {
			onselect?.(value as T);
			return;
		}
		if (multiple) {
			const next = Array.isArray(selected) ? [...(selected as unknown[])] : [];
			const idx = next.indexOf(value);
			if (idx >= 0) next.splice(idx, 1);
			else next.push(value);
			selected = next as T[];
		} else {
			selected = value as T;
		}
		onselect?.(value as T);
	}

	function register(id: string, el: HTMLElement, getValue: () => unknown, getDisabled: () => boolean): void {
		entries.set(id, { id, el, getValue, getDisabled });
		if (!order.includes(id)) order.push(id);
	}

	function unregister(id: string): void {
		entries.delete(id);
		const i = order.indexOf(id);
		if (i >= 0) order.splice(i, 1);
	}

	function focusEntry(id: string): void {
		const entry = entries.get(id);
		entry?.el.focus();
	}

	function focusNext(from: string, dir: 1 | -1): void {
		const ids = order.filter((id) => !entries.get(id)?.getDisabled());
		if (ids.length === 0) return;
		const i = ids.indexOf(from);
		const next = i === -1 ? (dir > 0 ? 0 : ids.length - 1) : (i + dir + ids.length) % ids.length;
		focusEntry(ids[next]);
	}

	function focusEdge(edge: 'first' | 'last'): void {
		const ids = order.filter((id) => !entries.get(id)?.getDisabled());
		if (ids.length === 0) return;
		focusEntry(edge === 'first' ? ids[0] : ids[ids.length - 1]);
	}

	const ctx: ListContext = {
		get variant() { return variant; },
		get color() { return color; },
		get size() { return size; },
		get divided() { return divided; },
		get role() { return role; },
		get multiple() { return multiple; },
		get disabled() { return disabled; },
		isSelected,
		select,
		register,
		unregister,
		focusNext,
		focusEdge
	};
	createListContext(ctx);

	let isEmpty = $derived(!!items && items.length === 0);
</script>

<div
	class={cn(
		'list',
		`list--${variant}`,
		`list--size-${size}`,
		divided && 'list--divided',
		isInteractive && 'list--interactive',
		className
	)}
	style:--c={triplet}
	style={userStyle}
	data-testid="list"
	{...rest}
>
	{#if header}
		<div class="list__header">{@render header()}</div>
	{/if}
	{#if label}
		<div class="list__label">{@render label()}</div>
	{/if}
	<div
		class="list__body"
		role={surfaceRole}
		aria-multiselectable={role === 'listbox' && multiple ? true : undefined}
	>
		{#if isEmpty && empty}
			<div class="list__empty">{@render empty()}</div>
		{:else if items && item}
			{#each items as data, i (i)}
				{@render item(data, i)}
			{/each}
		{:else}
			{@render children?.()}
		{/if}
	</div>
	{#if footer}
		<div class="list__footer">{@render footer()}</div>
	{/if}
</div>

<style>
	:where(.list) {
		--c: var(--primary);
		--list-radius: 20px;
		--list-pad-y: 8px;
		--list-pad-x: 8px;
		--list-gap: 0px;
		--list-font: 0.9rem;
		display: flex;
		flex-direction: column;
		color: rgb(var(--text));
	}

	.list__header {
		font-size: 0.75rem;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		font-weight: 600;
		opacity: 0.55;
		padding: 0 12px 6px;
	}
	.list__footer {
		font-size: 0.75rem;
		opacity: 0.6;
		padding: 6px 12px 0;
	}

	.list__label {
		font-size: 0.65rem;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		font-weight: 600;
		opacity: 0.5;
		padding: 8px 14px 4px;
	}

	.list__body {
		display: flex;
		flex-direction: column;
		gap: var(--list-gap);
		padding: var(--list-pad-y) var(--list-pad-x);
		border-radius: var(--list-radius);
		font-size: var(--list-font);
	}

	.list__empty {
		display: flex;
		align-items: center;
		justify-content: center;
		min-height: 80px;
		font-size: 0.85rem;
		opacity: 0.55;
		text-align: center;
		padding: 16px;
	}

	.list--default .list__body {
		background: rgb(var(--gray-2));
	}

	.list--flat .list__body {
		background: rgb(var(--c) / 0.08);
	}

	.list--transparent .list__body {
		background: transparent;
		padding: 0;
	}

	.list--border .list__body {
		background: transparent;
		box-shadow: inset 0 0 0 1px rgb(var(--text) / 0.1);
	}

	.list--shadow .list__body {
		background: rgb(var(--gray-2));
		box-shadow: 0 4px 12px -4px rgb(0 0 0 / 0.18);
	}

	.list--divided .list__body {
		padding: 0;
	}
	.list--divided .list__body :global(.list-item) {
		border-radius: 0;
	}
	.list--divided .list__body :global(.list-item .list-item__bg) {
		inset: 0;
		border-radius: 0;
	}
	.list--divided .list__body :global(.list-item:first-child .list-item__bg) {
		border-top-left-radius: var(--list-radius);
		border-top-right-radius: var(--list-radius);
	}
	.list--divided .list__body :global(.list-item:last-child .list-item__bg) {
		border-bottom-left-radius: var(--list-radius);
		border-bottom-right-radius: var(--list-radius);
	}
	.list--divided .list__body :global(.list-item + .list-item)::before {
		content: '';
		position: absolute;
		left: 12px;
		right: 12px;
		top: 0;
		height: 1px;
		background: rgb(var(--text) / 0.08);
		z-index: 1;
		pointer-events: none;
	}

	:where(.list--size-xl)     { --list-radius: 24px; --list-pad-y: 10px; --list-pad-x: 10px; --list-font: 1.05rem; }
	:where(.list--size-large)  { --list-radius: 22px; --list-pad-y: 9px;  --list-pad-x: 9px;  --list-font: 0.95rem; }
	:where(.list--size-medium) { --list-radius: 20px; --list-pad-y: 8px;  --list-pad-x: 8px;  --list-font: 0.9rem; }
	:where(.list--size-small)  { --list-radius: 16px; --list-pad-y: 6px;  --list-pad-x: 6px;  --list-font: 0.8rem; }
	:where(.list--size-mini)   { --list-radius: 12px; --list-pad-y: 4px;  --list-pad-x: 4px;  --list-font: 0.7rem; }
</style>
