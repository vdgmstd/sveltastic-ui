<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { WithElementRef } from '../../types';
	import type { HTMLAttributes } from 'svelte/elements';

	export type TabsContentProps = WithElementRef<
		{
			/** Matching `<Tabs.Trigger value>` to display this panel for. */
			value: string;
			/** Keep mounted when inactive (just hidden + inert). Default: unmount. */
			keepMounted?: boolean;
			/** Panel content. */
			children?: Snippet;
			/** Render-delegation: receive the merged props + active flag and render your own panel. */
			child?: Snippet<[{ props: Record<string, unknown>; active: boolean }]>;
		} & Omit<HTMLAttributes<HTMLDivElement>, 'children'>,
		HTMLDivElement
	>;
</script>

<script lang="ts">
	import { createAttachmentKey } from 'svelte/attachments';
	import { mergeProps } from '../../utils/mergeProps';
	import { attachRef } from '../../utils/ref';
	import { useTabsContext } from './context';

	let {
		ref = $bindable(null),
		value,
		keepMounted = false,
		children,
		child,
		class: className,
		...rest
	}: TabsContentProps = $props();
	const ctx = useTabsContext();
	let isActive = $derived(ctx?.value === value);
	let panelVariant = $derived(ctx?.panelVariant ?? 'plain');
	let orientation = $derived(ctx?.orientation ?? 'horizontal');
	let transitionMode = $derived(ctx?.transition ?? 'crossfade');
	let useTransition = $derived(transitionMode !== 'none' && !keepMounted);

	let overlapMode = $derived(transitionMode === 'fade' || transitionMode === 'crossfade');

	function clearPin(node: HTMLElement): void {
		node.style.position = '';
		node.style.insetBlockStart = '';
		node.style.insetInlineStart = '';
		node.style.inlineSize = '';
	}

	// Lift the leaving panel out of flow and pin it over the active one, so the two never stack side-by-side.
	function pinLeaving(node: HTMLElement): void {
		node.style.position = 'absolute';
		const active = node.parentElement?.querySelector<HTMLElement>(
			':scope > .tab-panel[data-state="active"]'
		);
		if (!active) return;
		const a = active.getBoundingClientRect();
		const cb = node.offsetParent as HTMLElement | null;
		if (cb) {
			const c = cb.getBoundingClientRect();
			node.style.insetBlockStart = `${a.top - c.top - cb.clientTop + cb.scrollTop}px`;
			node.style.insetInlineStart = `${a.left - c.left - cb.clientLeft + cb.scrollLeft}px`;
		} else {
			node.style.insetBlockStart = `${a.top + window.scrollY}px`;
			node.style.insetInlineStart = `${a.left + window.scrollX}px`;
		}
		node.style.inlineSize = `${a.width}px`;
	}

	const send = (node: Element, params: { key: string }) => {
		const config = ctx ? ctx.send(node, params) : { duration: 0 };
		if (overlapMode && node instanceof HTMLElement) pinLeaving(node);
		return config;
	};
	const receive = (node: Element, params: { key: string }) => {
		if (node instanceof HTMLElement) clearPin(node);
		return ctx ? ctx.receive(node, params) : { duration: 0 };
	};

	const attrs = $derived({
		class: `tab-panel tab-panel--${panelVariant}`,
		role: 'tabpanel' as const,
		id: ctx?.panelId(value),
		'aria-labelledby': ctx?.tabId(value),
		'data-state': isActive ? ('active' as const) : ('inactive' as const),
		'data-orientation': orientation,
		'data-testid': 'tab-panel'
	});
	const refAttach = { [createAttachmentKey()]: attachRef<HTMLDivElement>((n) => (ref = n)) };
	const transitionProps = $derived(mergeProps(rest, attrs, { class: className, tabindex: 0 }, refAttach));
	const staticProps = $derived(
		mergeProps(
			rest,
			attrs,
			{
				class: className,
				tabindex: isActive ? 0 : -1,
				hidden: !isActive || undefined,
				inert: !isActive || undefined
			},
			refAttach
		)
	);
</script>

{#if child}
	{@render child({ props: useTransition ? transitionProps : staticProps, active: isActive })}
{:else if isActive || keepMounted}
	{#if useTransition}
		<!-- |global: the mount/unmount toggle lives in the parent {#if isActive} block, not here. -->
		<div {...transitionProps} in:receive|global={{ key: value }} out:send|global={{ key: value }}>
			{@render children?.()}
		</div>
	{:else}
		<div {...staticProps}>
			{@render children?.()}
		</div>
	{/if}
{/if}

<style>
	:where(.tab-panel) {
		padding: var(--space-6) 0;
		outline: none;
	}
	:where(.tab-panel:focus-visible) {
		outline: 2px solid rgb(var(--c) / 0.5);
		outline-offset: 2px;
		border-radius: var(--rad-sm);
	}

	:where(.tab-panel--card) {
		background: rgb(var(--gray-2));
		border-radius: var(--rad-lg);
		padding: var(--space-7) var(--space-8);
		box-shadow: 0 4px 12px -4px rgb(0 0 0 / 0.12);
	}
</style>
