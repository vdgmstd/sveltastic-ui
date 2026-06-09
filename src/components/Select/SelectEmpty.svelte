<script lang="ts" module>
	import type { Snippet } from 'svelte';

	export type SelectEmptyProps = {
		/** Empty-state content, shown when no rows are available (replaces the default tray + "No data"). */
		children?: Snippet;
	};
</script>

<script lang="ts" generics="V">
	import { getSelectCtx } from './context';

	let { children }: SelectEmptyProps = $props();
	const root = getSelectCtx<V>();

	$effect(() => {
		root.emptySnippet = children;
		return () => {
			if (root.emptySnippet === children) root.emptySnippet = undefined;
		};
	});
</script>
