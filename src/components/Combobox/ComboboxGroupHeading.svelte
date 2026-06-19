<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { WithElementRef } from '../../types';

	export type ComboboxGroupHeadingProps = WithElementRef<{ children?: Snippet }, HTMLDivElement>;
</script>

<script lang="ts">
	import { attachRef } from '../../utils/ref';
	import MenuLabel from '../../primitives/MenuLabel.svelte';
	import { getComboboxGroupCtx } from './context';

	let { ref = $bindable(null), children }: ComboboxGroupHeadingProps = $props();

	const uid = $props.id();
	const headingId = `combobox-heading-${uid}`;
	const group = getComboboxGroupCtx();

	$effect(() => {
		group?.registerHeading(headingId);
		return () => group?.registerHeading(undefined);
	});
</script>

<div id={headingId} data-combobox-group-heading="" {@attach attachRef<HTMLDivElement>((n) => (ref = n))}>
	<MenuLabel>{@render children?.()}</MenuLabel>
</div>
