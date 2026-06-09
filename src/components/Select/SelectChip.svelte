<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { SelectItem } from './selectState.svelte';

	/** Payload a custom Select.Chip template receives per selected item. */
	export type SelectChipPayload<V = unknown> = { item: SelectItem<V>; remove: () => void };

	export type SelectChipProps<V = unknown> = {
		/** Custom chip content, rendered once per selected item with its data + remove callback. */
		children?: Snippet<[SelectChipPayload<V>]>;
	};

	export type { SelectItem } from './selectState.svelte';
</script>

<script lang="ts" generics="V">
	import { getSelectCtx } from './context';

	let { children }: SelectChipProps<V> = $props();
	const root = getSelectCtx<V>();

	$effect(() => {
		root.chipSnippet = template;
		return () => {
			if (root.chipSnippet === template) root.chipSnippet = undefined;
		};
	});
</script>

{#snippet template(item: SelectItem<V>, remove: () => void)}
	{@render children?.({ item, remove })}
{/snippet}
