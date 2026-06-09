<script lang="ts" module>
	import type { Snippet } from 'svelte';

	export type MenuItemIconProps = {
		/** Leading icon content. */
		children?: Snippet;
	};
</script>

<script lang="ts">
	import { getMenuItemCtx } from './context';

	let { children }: MenuItemIconProps = $props();
	const item = getMenuItemCtx();

	$effect(() => item?.registerIcon(slot));
</script>

{#snippet slot()}
	<span class="menu-item__icon" aria-hidden="true">{@render children?.()}</span>
{/snippet}
