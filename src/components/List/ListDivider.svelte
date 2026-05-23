<script lang="ts" module>
	import type { HTMLAttributes } from 'svelte/elements';

	export type ListDividerProps = {
		/** Inset divider — leaves a gutter on the left to align with item label. */
		inset?: boolean;
	} & HTMLAttributes<HTMLHRElement>;
</script>

<script lang="ts">
	import { cn } from '../../utils/cn';

	let { inset = false, class: className, style: userStyle, ...rest }: ListDividerProps = $props();
</script>

<hr
	class={cn('list-divider', inset && 'list-divider--inset', className)}
	style={userStyle}
	data-testid="list-divider"
	{...rest}
/>

<style>
	:where(.list-divider) {
		border: 0;
		height: 1px;
		margin: 4px 0;
		background: rgb(var(--text) / 0.08);
	}
	:where(.list-divider--inset) {
		margin-left: 44px;
	}
</style>
