<script lang="ts" module>
	import type { WithElementRef } from '../../types';

	export type MenuSeparatorProps = WithElementRef<
		{ class?: string; style?: string },
		HTMLElement
	>;
</script>

<script lang="ts">
	import Separator from '../../primitives/Separator.svelte';

	let { ref = $bindable(null), ...rest }: MenuSeparatorProps = $props();
</script>

<Separator bind:ref {...rest} />
