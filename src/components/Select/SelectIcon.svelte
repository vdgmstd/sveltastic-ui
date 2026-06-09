<script lang="ts" module>
	import type { Snippet } from 'svelte';

	export type SelectIconProps = {
		/** Custom indicator content (replaces the default chevron). Rotates with open state via the trigger. */
		children?: Snippet;
	};
</script>

<script lang="ts" generics="V">
	import { getSelectCtx } from './context';

	let { children }: SelectIconProps = $props();
	const root = getSelectCtx<V>();

	$effect(() => {
		root.iconSnippet = children;
		return () => {
			if (root.iconSnippet === children) root.iconSnippet = undefined;
		};
	});
</script>
