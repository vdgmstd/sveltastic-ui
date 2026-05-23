<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';

	export type ButtonGroupProps = {
		children?: Snippet;
	} & HTMLAttributes<HTMLDivElement>;
</script>

<script lang="ts">
	import { cn } from '../../utils/cn';

	let { children, class: className, style: userStyle, ...rest }: ButtonGroupProps = $props();
</script>

<div class={cn('button-group', className)} style={userStyle} data-testid="button-group" {...rest}>
	{@render children?.()}
</div>

<style>
	:where(.button-group) {
		display: inline-flex;
		align-items: center;
		justify-content: center;
	}
	.button-group :global(.button) { margin: 0; }
	.button-group :global(.button:not(:first-of-type):not(:last-of-type)) {
		border-radius: 0;
	}
	.button-group :global(.button--border:not(:first-of-type) .button__bg::before) {
		border-left-width: 0;
	}
	.button-group :global(.button:first-of-type) {
		border-top-right-radius: 0;
		border-bottom-right-radius: 0;
	}
	.button-group :global(.button:last-of-type) {
		border-top-left-radius: 0;
		border-bottom-left-radius: 0;
	}
</style>
