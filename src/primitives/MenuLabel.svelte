<script lang="ts" module>
	import type { Snippet } from 'svelte';

	export type MenuLabelProps = {
		children?: Snippet;
	};
</script>

<script lang="ts">
	let { children }: MenuLabelProps = $props();
</script>

<div class="menu-label">{#if children}{@render children()}{/if}</div>

<style>
	.menu-label {
		padding: var(--space-3) var(--space-5) var(--space-2);
		font-size: var(--fs-xs);
		text-transform: uppercase;
		letter-spacing: 0.08em;
		font-weight: 600;
		opacity: 0.5;
		-webkit-user-select: none;
		user-select: none;
	}
</style>
