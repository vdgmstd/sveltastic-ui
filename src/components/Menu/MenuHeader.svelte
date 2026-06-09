<script lang="ts" module>
	import type { Snippet } from 'svelte';

	export type MenuHeaderProps = {
		/** Sticky popup header content. Receives a `close` callback. */
		children?: Snippet<[() => void]>;
	};
</script>

<script lang="ts">
	import { getMenuCtx } from './context';

	let { children }: MenuHeaderProps = $props();
	const root = getMenuCtx();

	$effect(() => {
		root.headerSnippet = body;
		return () => {
			if (root.headerSnippet === body) root.headerSnippet = undefined;
		};
	});
</script>

{#snippet body(close: () => void)}
	{@render children?.(close)}
{/snippet}
