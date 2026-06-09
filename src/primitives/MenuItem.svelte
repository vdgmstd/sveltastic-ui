<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { HTMLButtonAttributes } from 'svelte/elements';

	export type MenuItemRole = 'menuitem' | 'menuitemcheckbox' | 'menuitemradio' | 'option';

	export type MenuItemProps = {
		/** WAI-ARIA role. `'option'` in a listbox (Select), `'menuitemcheckbox'`/`'menuitemradio'` for checkable menu rows, `'menuitem'` otherwise. */
		role?: MenuItemRole;
		/** Renders a checkmark on the right and tints the row. */
		selected?: boolean;
		/** Render the built-in check when selected; off when the row owns its own indicator. */
		showCheck?: boolean;
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
	import { boolAttr } from '../utils/attrs';

	let {
		role = 'menuitem',
		selected = false,
		showCheck = true,
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
	{role}
	{disabled}
	data-selected={boolAttr(selected)}
	data-danger={boolAttr(danger)}
	data-disabled={boolAttr(disabled)}
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
	{:else if selected && showCheck}
		<span class="menu-item__check" aria-hidden="true">
			<CheckIcon size={14} weight="bold" />
		</span>
	{/if}
</button>
