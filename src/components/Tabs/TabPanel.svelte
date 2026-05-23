<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';

	export type TabPanelProps = {
		/** Matching `<Tab value>` to display this panel for. */
		value: string;
		/** Keep mounted when inactive (just hidden). Default: unmount. */
		keepMounted?: boolean;
		/** Panel content. */
		children?: Snippet;
	} & Omit<HTMLAttributes<HTMLDivElement>, 'children'>;
</script>

<script lang="ts">
	import { cn } from '../../utils/cn';
	import { useTabsContext } from './context';

	let {
		value,
		keepMounted = false,
		children,
		class: className,
		style: userStyle,
		...rest
	}: TabPanelProps = $props();
	const ctx = useTabsContext();
	let isActive = $derived(ctx?.value === value);
	let panelVariant = $derived(ctx?.panelVariant ?? 'plain');
	let transitionMode = $derived(ctx?.transition ?? 'crossfade');
	let useTransition = $derived(transitionMode !== 'none' && !keepMounted);

	const send = (node: Element, params: { key: string }) =>
		ctx ? ctx.send(node, params) : { duration: 0 };
	const receive = (node: Element, params: { key: string }) =>
		ctx ? ctx.receive(node, params) : { duration: 0 };
</script>

{#if isActive || keepMounted}
	{#if useTransition}
		<div
			class={cn('tab-panel', `tab-panel--${panelVariant}`, className)}
			style={userStyle}
			role="tabpanel"
			id={ctx?.panelId(value)}
			aria-labelledby={ctx?.tabId(value)}
			tabindex="0"
			data-testid="tab-panel"
			in:receive={{ key: value }}
			out:send={{ key: value }}
			{...rest}
		>
			{@render children?.()}
		</div>
	{:else}
		<div
			class={cn('tab-panel', `tab-panel--${panelVariant}`, className)}
			style={userStyle}
			role="tabpanel"
			id={ctx?.panelId(value)}
			aria-labelledby={ctx?.tabId(value)}
			hidden={!isActive || undefined}
			tabindex="0"
			data-testid="tab-panel"
			{...rest}
		>
			{@render children?.()}
		</div>
	{/if}
{/if}

<style>
	:where(.tab-panel) {
		padding: 12px 0;
		outline: none;
	}
	:where(.tab-panel:focus-visible) {
		outline: 2px solid rgb(var(--c) / 0.5);
		outline-offset: 2px;
		border-radius: 8px;
	}

	:where(.tab-panel--card) {
		background: rgb(var(--gray-2));
		border-radius: 16px;
		padding: 18px 20px;
		box-shadow: 0 4px 12px -4px rgb(0 0 0 / 0.12);
	}
</style>
