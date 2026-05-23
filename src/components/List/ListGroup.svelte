<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';

	export type ListGroupProps = {
		/** Section caption (small uppercase). */
		label?: Snippet;
		/** Body — usually `<ListItem>` children. */
		children?: Snippet;
	} & Omit<HTMLAttributes<HTMLDivElement>, 'children'>;
</script>

<script lang="ts">
	import { cn } from '../../utils/cn';

	let { label, children, class: className, style: userStyle, ...rest }: ListGroupProps = $props();
</script>

<div class={cn('list-group', className)} style={userStyle} role="group" data-testid="list-group" {...rest}>
	{#if label}
		<div class="list-group__label">{@render label()}</div>
	{/if}
	{@render children?.()}
</div>

<style>
	:where(.list-group) {
		display: flex;
		flex-direction: column;
	}
	.list-group + :global(.list-group) {
		margin-top: 6px;
	}
	.list-group__label {
		padding: 6px 12px 4px;
		font-size: 0.65rem;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		font-weight: 600;
		opacity: 0.5;
	}
</style>
