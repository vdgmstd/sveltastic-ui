<script lang="ts" module>
	import type { Snippet } from 'svelte';

	export type PickerPanelProps = {
		/** RGB triplet for the accent (e.g. `'25 91 255'` or `'var(--primary)'`). */
		triplet: string;
		/** Optional header (calendar nav, mode tabs). */
		header?: Snippet;
		/** Body content (calendar grid, time columns, …). */
		children?: Snippet;
		/** Optional footer (clear / today / apply). */
		footer?: Snippet;
		/** Extra class hook for picker-specific tweaks. */
		variant?: 'default' | 'compact' | 'wide';
	};
</script>

<script lang="ts">
	let { triplet, header, children, footer, variant = 'default' }: PickerPanelProps = $props();
</script>

<div
	class="picker-panel"
	class:picker-panel--compact={variant === 'compact'}
	class:picker-panel--wide={variant === 'wide'}
	style:--c={triplet}
>
	{#if header}
		<div class="picker-panel__header">{@render header()}</div>
	{/if}
	{#if children}
		<div class="picker-panel__body">{@render children()}</div>
	{/if}
	{#if footer}
		<div class="picker-panel__footer">{@render footer()}</div>
	{/if}
</div>

<style>
	.picker-panel {
		--c: var(--primary);
		display: flex;
		flex-direction: column;
		min-width: 280px;
		padding: 12px;
		background: rgb(var(--background));
		border-radius: 12px;
		box-shadow: 0 12px 40px -10px rgb(0 0 0 / 0.25);
		color: rgb(var(--text));
		font-size: 0.85rem;
	}
	.picker-panel--compact { min-width: 200px; padding: 8px; }
	.picker-panel--wide { min-width: 560px; }
	.picker-panel__header { display: flex; flex-direction: column; }
	.picker-panel__body { flex: 1; min-height: 0; }
	.picker-panel__footer {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 8px;
		margin-top: 8px;
		padding-top: 8px;
		border-top: 1px solid rgb(var(--text) / 0.08);
	}
</style>
