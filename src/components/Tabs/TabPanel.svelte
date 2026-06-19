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
	let isActive = $derived(ctx.value === value);
	let panelVariant = $derived(ctx.panelVariant);
	let orientation = $derived(ctx.orientation);
	let transitionMode = $derived(ctx.transition);
	let useTransition = $derived(transitionMode !== 'none' && !keepMounted);

	let overlapMode = $derived(transitionMode === 'fade' || transitionMode === 'crossfade');

	function clearPin(node: HTMLElement): void {
		node.style.position = '';
		node.style.top = '';
		node.style.left = '';
		node.style.width = '';
	}

	// Pin the leaving panel within the positioned `.tabs-root` (its offset parent) so it overlays in place during the crossfade.
	// Offset coords (not the viewport rect) stay correct under scroll; a 0-size panel is left in flow rather than pinned to (0,0).
	// Anchor to the SLOT top (min of leaving + incoming offsets), not `node.offsetTop`: when the incoming panel is earlier
	// in DOM (reverse switch) it has already mounted in flow above the leaver, pushing its measured offset down — which would
	// stack the two panels instead of overlaying them.
	function pinLeaving(node: HTMLElement): void {
		const w = node.offsetWidth;
		if (w === 0) return;
		const root = node.offsetParent ?? node.parentElement;
		const incoming = root?.querySelector<HTMLElement>(`#${CSS.escape(ctx.panelId(ctx.value ?? ''))}`);
		const top = incoming ? Math.min(node.offsetTop, incoming.offsetTop) : node.offsetTop;
		const left = incoming ? Math.min(node.offsetLeft, incoming.offsetLeft) : node.offsetLeft;
		node.style.position = 'absolute';
		node.style.top = `${top}px`;
		node.style.left = `${left}px`;
		node.style.width = `${w}px`;
	}

	const send = (node: Element, params: { key: string }) => {
		const config = ctx.send(node, params);
		if (overlapMode && node instanceof HTMLElement) pinLeaving(node);
		return config;
	};
	const receive = (node: Element, params: { key: string }) => {
		if (node instanceof HTMLElement) clearPin(node);
		return ctx.receive(node, params);
	};

	const attrs = $derived({
		class: `tab-panel tab-panel--${panelVariant}`,
		role: 'tabpanel' as const,
		id: ctx.panelId(value),
		'aria-labelledby': ctx.tabId(value),
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
