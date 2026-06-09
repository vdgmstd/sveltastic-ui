<script lang="ts" module>
	import type { Snippet } from 'svelte';

	export type MenuItemTrailingProps = {
		/** Right-aligned trailing content (shortcut hint, badge…). */
		children?: Snippet;
	};
</script>

<script lang="ts">
	import { getMenuItemCtx } from './context';

	let { children }: MenuItemTrailingProps = $props();
	const item = getMenuItemCtx();

	$effect(() => item?.registerTrailing(slot));
</script>

{#snippet slot()}
	<span class="menu-item__trailing">{@render children?.()}</span>
{/snippet}

<style>
	/* Shortcut hint typography inside the trailing slot. */
	:global(.menu-item__trailing .menu-item__shortcut) {
		font-size: var(--fs-sm);
		opacity: 0.55;
		font-variant-numeric: tabular-nums;
		letter-spacing: 0.02em;
		-webkit-user-select: none;
		user-select: none;
	}
</style>
