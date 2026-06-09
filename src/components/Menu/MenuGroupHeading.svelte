<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { WithElementRef } from '../../types';

	export type MenuGroupHeadingProps = WithElementRef<{ children?: Snippet }, HTMLDivElement>;
</script>

<script lang="ts">
	import { attachRef } from '../../utils/ref';
	import MenuLabel from '../../primitives/MenuLabel.svelte';
	import { getMenuGroupCtx } from './context';

	let { ref = $bindable(null), children }: MenuGroupHeadingProps = $props();

	const uid = $props.id();
	const headingId = `menu-heading-${uid}`;
	const group = getMenuGroupCtx();

	$effect(() => {
		group?.registerHeading(headingId);
		return () => group?.registerHeading('');
	});
</script>

<div id={headingId} {@attach attachRef<HTMLDivElement>((n) => (ref = n))}>
	<MenuLabel>{@render children?.()}</MenuLabel>
</div>
