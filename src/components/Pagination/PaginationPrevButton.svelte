<script lang="ts" module>
	import type { PaginationArrowProps } from './PaginationArrow.svelte';

	export type PaginationPrevButtonProps = Omit<PaginationArrowProps, 'direction'>;
</script>

<script lang="ts">
	import Arrow from './PaginationArrow.svelte';

	let { ref = $bindable(null), ...rest }: PaginationPrevButtonProps = $props();
</script>

<Arrow bind:ref direction="prev" {...rest} />
