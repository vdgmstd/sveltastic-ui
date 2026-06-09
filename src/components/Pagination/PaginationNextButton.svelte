<script lang="ts" module>
	import type { PaginationArrowProps } from './PaginationArrow.svelte';

	export type PaginationNextButtonProps = Omit<PaginationArrowProps, 'direction'>;
</script>

<script lang="ts">
	import Arrow from './PaginationArrow.svelte';

	let { ref = $bindable(null), ...rest }: PaginationNextButtonProps = $props();
</script>

<Arrow bind:ref direction="next" {...rest} />
