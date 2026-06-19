<script lang="ts" module>
	import type { Snippet } from 'svelte';

	export type ComboboxEmptyProps = {
		/** Empty-state content, shown when no rows are available (replaces the default tray + "No data"). */
		children?: Snippet;
	};
</script>

<script lang="ts" generics="V">
	import { getComboboxCtx } from './context';

	let { children }: ComboboxEmptyProps = $props();
	const root = getComboboxCtx<V>();

	$effect(() => {
		root.emptySnippet = children;
		return () => {
			if (root.emptySnippet === children) root.emptySnippet = undefined;
		};
	});
</script>
