<script lang="ts" module>
	import type { Snippet } from 'svelte';

	export type MenuFooterProps = {
		/** Sticky popup footer content. Receives a `close` callback. */
		children?: Snippet<[() => void]>;
	};
</script>

<script lang="ts">
	import { getMenuCtx } from './context';

	let { children }: MenuFooterProps = $props();
	const root = getMenuCtx();

	$effect(() => {
		root.footerSnippet = body;
		return () => {
			if (root.footerSnippet === body) root.footerSnippet = undefined;
		};
	});
</script>

{#snippet body(close: () => void)}
	{@render children?.(close)}
{/snippet}
