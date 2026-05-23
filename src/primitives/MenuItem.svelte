<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { HTMLButtonAttributes } from 'svelte/elements';

	export type MenuItemRole = 'menuitem' | 'option';

	export type MenuItemProps = {
		/** WAI-ARIA role. Use `'option'` inside a listbox (Select), `'menuitem'` otherwise. */
		role?: MenuItemRole;
		/** Renders a checkmark on the right and tints the row. */
		selected?: boolean;
		/** Inert row, can't be picked. */
		disabled?: boolean;
		/** Destructive action — colours and hover state shift to the danger palette. */
		danger?: boolean;
		/** Leading icon. */
		icon?: Snippet;
		/** Right-aligned trailing content (shortcut hint, badge…). */
		trailing?: Snippet;
		/** Row label / arbitrary content. */
		children?: Snippet;
	} & Omit<HTMLButtonAttributes, 'class' | 'style' | 'role' | 'children' | 'disabled'>;
</script>

<script lang="ts">
	import { CheckIcon } from 'phosphor-svelte';

	let {
		role = 'menuitem',
		selected = false,
		disabled = false,
		danger = false,
		icon,
		trailing,
		children,
		...rest
	}: MenuItemProps = $props();
</script>

<button
	type="button"
	class="menu-item"
	class:menu-item--selected={selected}
	class:menu-item--danger={danger}
	{role}
	{disabled}
	aria-disabled={disabled || undefined}
	aria-selected={role === 'option' ? selected : undefined}
	{...rest}
>
	{#if icon}
		<span class="menu-item__icon" aria-hidden="true">
			{@render icon()}
		</span>
	{/if}
	<span class="menu-item__label">
		{#if children}{@render children()}{/if}
	</span>
	{#if trailing}
		<span class="menu-item__trailing">
			{@render trailing()}
		</span>
	{:else if selected}
		<span class="menu-item__check" aria-hidden="true">
			<CheckIcon size={14} weight="bold" />
		</span>
	{/if}
</button>

<style>
	.menu-item {
		display: flex;
		align-items: center;
		gap: 8px;
		width: 100%;
		padding: 8px 10px;
		background: transparent;
		border: 0;
		border-radius: 8px;
		font: inherit;
		font-size: 0.85rem;
		color: inherit;
		text-align: left;
		cursor: pointer;
		transition: background-color 150ms cubic-bezier(0.4, 0, 0.2, 1);
	}
	.menu-item:hover:not(:disabled):not([aria-disabled='true']),
	.menu-item:focus-visible:not(:disabled):not([aria-disabled='true']) {
		background: rgb(var(--c, var(--primary)) / 0.1);
		outline: none;
	}
	.menu-item:disabled,
	.menu-item[aria-disabled='true'] {
		opacity: 0.45;
		cursor: not-allowed;
	}
	.menu-item--selected {
		color: rgb(var(--c, var(--primary)));
		font-weight: 500;
	}
	.menu-item--danger { color: rgb(var(--danger)); }
	.menu-item--danger:hover:not(:disabled):not([aria-disabled='true']),
	.menu-item--danger:focus-visible:not(:disabled):not([aria-disabled='true']) {
		background: rgb(var(--danger) / 0.1);
	}
	.menu-item__icon {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
	}
	.menu-item__label {
		flex: 1 1 auto;
		min-width: 0;
		text-align: left;
	}
	.menu-item__trailing,
	.menu-item__check {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
		opacity: 0.7;
	}
	.menu-item__check {
		color: rgb(var(--c, var(--primary)));
		opacity: 1;
	}
</style>
