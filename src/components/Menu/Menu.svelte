<script lang="ts" module>
	import type { Component, Snippet } from 'svelte';
	import type {
		PopoverPlacement,
		PopoverTriggerOn,
		PopoverOpenAnim,
		PopoverRole
	} from '../../primitives/Popover.svelte';

	export type MenuPlacement = PopoverPlacement;
	export type MenuTriggerOn = PopoverTriggerOn;
	export type MenuOpenAnim = PopoverOpenAnim;
	export type MenuPopupRole = PopoverRole;

	export type MenuIconComponent = Component<Record<string, unknown>>;

	export type MenuItemEntry = {
		type: 'item';
		/** Row text. */
		label: string;
		/** Leading icon (any phosphor-svelte component or matching API). */
		icon?: MenuIconComponent;
		/** Right-aligned trailing text — shortcut hint, count, etc. */
		trailing?: string;
		/** Destructive action — colours and hover state shift to the danger palette. */
		danger?: boolean;
		/** Inert row, cannot be picked. */
		disabled?: boolean;
		/** Renders a checkmark on the right and tints the row. */
		selected?: boolean;
		/** Click handler. Receives the menu's `close` callback. */
		onclick?: (close: () => void) => void;
	};

	export type MenuLabelEntry = {
		type: 'label';
		/** Section heading text. */
		text: string;
	};

	export type MenuDividerEntry = {
		type: 'divider';
	};

	export type MenuEntry = MenuItemEntry | MenuLabelEntry | MenuDividerEntry;

	export type MenuProps = {
		open?: boolean;
		placement?: MenuPlacement;
		triggerOn?: MenuTriggerOn;
		offset?: number;
		closeOnClickOutside?: boolean;
		closeOnEsc?: boolean;
		closeOnSelect?: boolean;
		disabled?: boolean;
		block?: boolean;
		matchWidth?: boolean;
		openAnim?: MenuOpenAnim;
		openDuration?: number;
		openEasing?: (t: number) => number;
		popupRole?: MenuPopupRole;
		autoFocus?: boolean;
		/** Default rendering — array of items, labels and dividers. Takes priority over `children`. */
		items?: MenuEntry[];
		/** Anchor / trigger content. Receives `open` for visual state sync. */
		trigger?: Snippet<[boolean]>;
		/** Sticky popup header. Receives a `close` callback. */
		header?: Snippet<[() => void]>;
		/** Advanced custom body — used when `items` is not provided. Receives `close` so rows can dismiss the menu. */
		children?: Snippet<[() => void]>;
		/** Sticky popup footer. Receives a `close` callback. */
		footer?: Snippet<[() => void]>;
		onopenchange?: (open: boolean) => void;
		/** Class merged onto the trigger wrapper. */
		class?: string;
		/** Inline style merged onto the trigger wrapper. */
		style?: string;
	};
</script>

<script lang="ts">
	import Popover from '../../primitives/Popover.svelte';
	import MenuItem from '../../primitives/MenuItem.svelte';
	import MenuLabel from '../../primitives/MenuLabel.svelte';
	import Divider from '../Divider/Divider.svelte';

	let {
		open = $bindable(false),
		items,
		trigger,
		header,
		children,
		footer,
		...rest
	}: MenuProps = $props();
</script>

<Popover
	bind:open
	{trigger}
	{header}
	{footer}
	{...rest}
>
	{#snippet children(close)}
		{#if items}
			{#each items as entry, i (i)}
				{#if entry.type === 'divider'}
					<Divider />
				{:else if entry.type === 'label'}
					<MenuLabel>{entry.text}</MenuLabel>
				{:else}
					<MenuItem
						selected={entry.selected}
						disabled={entry.disabled}
						danger={entry.danger}
						onclick={() => entry.onclick?.(close)}
					>
						{#if entry.icon}
							{@const Icon = entry.icon}
							{#snippet icon()}<Icon size={14} />{/snippet}
						{/if}
						{#if entry.trailing}
							{#snippet trailing()}<span class="menu-item__shortcut">{entry.trailing}</span>{/snippet}
						{/if}
						{entry.label}
					</MenuItem>
				{/if}
			{/each}
		{:else if children}
			{@render children(close)}
		{/if}
	{/snippet}
</Popover>

<style>
	/* Trailing shortcut hint inside items-driven rows. */
	:global(.popover .menu-item__shortcut) {
		font-size: 0.72rem;
		opacity: 0.55;
		font-variant-numeric: tabular-nums;
		letter-spacing: 0.02em;
	}
</style>
