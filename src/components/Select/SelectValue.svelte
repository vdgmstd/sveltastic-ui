<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { SelectItem } from './selectState.svelte';

	export type SelectValueProps<V = unknown> = {
		/** Placeholder shown when nothing is selected (single mode). Defaults to the Root `placeholder`. */
		placeholder?: string;
		/** Custom single-mode display, rendered with the selected item (replaces the default label). */
		children?: Snippet<[{ selected: SelectItem<V> }]>;
	};

	export type { SelectItem } from './selectState.svelte';
</script>

<script lang="ts" generics="V">
	import SelectValueBody from './SelectValueBody.svelte';
	import { getSelectCtx } from './context';

	let { placeholder, children }: SelectValueProps<V> = $props();
	const root = getSelectCtx<V>();

	$effect(() => {
		root.hasCustomValue = !!children;
		root.valueSnippet = body;
		return () => {
			root.hasCustomValue = false;
			if (root.valueSnippet === body) root.valueSnippet = undefined;
		};
	});
</script>

{#snippet body()}
	<SelectValueBody {placeholder} custom={children} />
{/snippet}
