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
		padding: 6px 10px 4px;
		font-size: 0.65rem;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		font-weight: 600;
		opacity: 0.5;
	}
</style>
