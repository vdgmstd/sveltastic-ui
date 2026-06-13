<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { WithElementRef } from '../../types';
	import type { HTMLButtonAttributes } from 'svelte/elements';

	export type TabsTriggerProps = WithElementRef<
		{
			/** Tab identifier. Must be unique within the parent `<Tabs.Root>`. */
			value: string;
			/** Disable this single tab. */
			disabled?: boolean;
			/** Trigger content — place `<Tabs.Icon>` / `<Tabs.Label>` or arbitrary nodes. */
			children?: Snippet;
			/** Render-delegation: receive the merged props and render your own trigger element. */
			child?: Snippet<[{ props: Record<string, unknown> }]>;
		} & Omit<HTMLButtonAttributes, 'children' | 'disabled'>,
		HTMLButtonElement
	>;
</script>

<script lang="ts">
	import { createAttachmentKey } from 'svelte/attachments';
	import { ripple as rippleAction } from '../../actions/ripple.svelte';
	import { boolAttr } from '../../utils/attrs';
	import { mergeProps } from '../../utils/mergeProps';
	import { attachRef } from '../../utils/ref';
	import { useTabsContext } from './context';
	import { TabState } from './tabsState.svelte';

	let {
		ref = $bindable(null),
		value,
		disabled = false,
		children,
		child,
		class: className,
		...rest
	}: TabsTriggerProps = $props();
	const ctx = useTabsContext();

	const tab = new TabState(
		ctx,
		() => value,
		() => disabled
	);

	let variant = $derived(ctx.variant);
	let color = $derived(ctx.color);
	let orientation = $derived(ctx.orientation);
	let isActive = $derived(tab.isActive);
	let isInert = $derived(tab.isInert);
	let onFilledThumb = $derived(variant === 'default' || variant === 'relief');

	let rippleOptions = $derived({
		disabled: isInert || variant === 'underline' || !ctx.ripple,
		color: onFilledThumb && isActive ? '255 255 255' : color,
		soft: true,
		duration: 1000,
		mountTo: ctx.thumbLayer,
		// Label colour is owned by CSS + the sliding thumb; a ripple text shift flashes white-wrong on flat/border.
		textColor: 'currentColor' as const
	});

	$effect(() => {
		ctx.adoptDefault(value, isInert);
	});

	// Mint once: re-minting in the $derived re-runs the attachment every recompute → update-depth loop
	// (the ref attachment writes `node`, and `merged` reads the registry via `tabindexFor`, so a fresh
	// attachment closure each recompute bounced `node` and re-fired registration).
	const refKey = createAttachmentKey();

	let node = $state<HTMLElement | null>(null);
	// Stable, change-guarded ref attachment: identity never changes, captured node only updates on
	// actual DOM-node change — so `merged` recomputing (e.g. on registry-driven `tabindexFor`) can't
	// re-run this and bounce `node`.
	const attachNode = attachRef<HTMLButtonElement>((n) => {
		ref = n;
		node = n;
	});
	// Re-register on in-place `value` change so roving keyboard nav follows without remount.
	$effect(() => {
		if (node) return ctx.roving.register(value, node, () => tab.isInert);
	});

	const attrs = $derived({
		type: 'button' as const,
		class: `tab tab--variant-${variant}`,
		role: 'tab' as const,
		id: ctx.tabId(value),
		'aria-selected': isActive,
		'aria-controls': ctx.panelId(value),
		'aria-disabled': isInert ? ('true' as const) : undefined,
		tabindex: ctx.roving.tabindexFor(value),
		disabled: isInert || undefined,
		'data-state': isActive ? ('active' as const) : ('inactive' as const),
		'data-value': value,
		'data-orientation': orientation,
		'data-disabled': boolAttr(isInert),
		'data-testid': 'tab',
		onclick: () => tab.select(),
		onfocus: () => tab.handleFocus(),
		onkeydown: (e: KeyboardEvent) => tab.handleKeydown(e)
	});
	const merged = $derived(mergeProps(rest, attrs, { class: className, [refKey]: attachNode }));
</script>

{#if child}
	{@render child({ props: merged })}
{:else}
	<button {...merged} use:rippleAction={rippleOptions}>
		{@render children?.()}
	</button>
{/if}

<style>
	/* Global so child-delegated tabs in the consumer scope still match; inner :where keeps zero specificity. */
	:global(:where(.tab)) {
		position: relative;
		z-index: 2;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: var(--space-3);
		padding: var(--item-py, 5px) var(--item-px, var(--space-6));
		background: transparent;
		border: 0;
		color: rgb(var(--text) / 0.6);
		font: inherit;
		font-size: var(--font-size, var(--fs-md));
		font-weight: 500;
		cursor: pointer;
		border-radius: var(--inner-radius, 10px);
		white-space: nowrap;
		outline: none;
		transition: color 220ms var(--ease-standard);
	}

	:global(:where(.tab:hover[data-state='inactive']:not(:disabled))) {
		color: rgb(var(--text) / 0.95);
	}

	:global(:where(.tab:focus-visible[data-state='inactive'])) {
		color: rgb(var(--c));
	}

	/* Visible focus ring for keyboard users, on both active and inactive tabs. */
	:global(:where(.tab:focus-visible)) {
		box-shadow: 0 0 0 2px rgb(var(--c) / 0.6);
	}

	:global(:where(.tab:disabled)),
	:global(:where(.tab[data-disabled])) {
		opacity: 0.45;
		cursor: not-allowed;
	}

	/* Ramp the active colour in step with the spring thumb — neither front-loaded (white-on-track flash) nor back-loaded (late). */
	:global(:where(.tab[data-state='active'])) {
		transition: color 240ms cubic-bezier(0.35, 0, 0.65, 1);
	}

	:global(:where(.tab--variant-underline[data-state='active'])),
	:global(:where(.tab--variant-flat[data-state='active'])),
	:global(:where(.tab--variant-border[data-state='active'])) {
		color: rgb(var(--c));
	}

	:global(:where(.tab--variant-default[data-state='active'])),
	:global(:where(.tab--variant-relief[data-state='active'])) {
		color: rgb(var(--on-accent));
	}
</style>
