<script lang="ts" module>
	import type { Snippet } from 'svelte';

	export type MenuContentProps = {
		/** Menu rows — `Menu.Item` / `Menu.CheckboxItem` / `Menu.RadioGroup` / `Menu.Group` / `Menu.Separator`. Receives a `close` callback. */
		children?: Snippet<[() => void]>;
	};
</script>

<script lang="ts">
	import { getMenuCtx } from './context';

	let { children }: MenuContentProps = $props();
	const root = getMenuCtx();

	$effect(() => {
		root.contentSnippet = body;
		return () => {
			if (root.contentSnippet === body) root.contentSnippet = undefined;
		};
	});
</script>

{#snippet body(close: () => void)}
	{@render children?.(close)}
{/snippet}
