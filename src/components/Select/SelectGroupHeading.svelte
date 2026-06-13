<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { WithElementRef } from '../../types';

	export type SelectGroupHeadingProps = WithElementRef<
		{ children?: Snippet },
		HTMLDivElement
	>;
</script>

<script lang="ts">
	import { attachRef } from '../../utils/ref';
	import MenuLabel from '../../primitives/MenuLabel.svelte';
	import { getSelectGroupCtx } from './context';

	let { ref = $bindable(null), children }: SelectGroupHeadingProps = $props();

	const uid = $props.id();
	const headingId = `select-heading-${uid}`;
	const group = getSelectGroupCtx();

	$effect(() => {
		group?.registerHeading(headingId);
		return () => group?.registerHeading(undefined);
	});
</script>

<div id={headingId} {@attach attachRef<HTMLDivElement>((n) => (ref = n))}>
	<MenuLabel>{@render children?.()}</MenuLabel>
</div>
