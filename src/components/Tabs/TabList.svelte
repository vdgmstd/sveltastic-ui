<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { WithElementRef } from '../../types';
	import type { HTMLAttributes } from 'svelte/elements';

	export type TabsListProps = WithElementRef<
		{
			/** Trigger row label for screen readers. */
			ariaLabel?: string;
			/** Stretch the row to fill its container; tabs distribute evenly. */
			block?: boolean;
			/** `<Tabs.Trigger>` children. */
			children?: Snippet;
			/** Render-delegation: receive the merged props and render your own tablist element. */
			child?: Snippet<[{ props: Record<string, unknown> }]>;
		} & Omit<HTMLAttributes<HTMLDivElement>, 'children'>,
		HTMLDivElement
	>;
</script>

<script lang="ts">
	import { boolAttr } from '../../utils/attrs';
	import { mergeProps } from '../../utils/mergeProps';
	import { attachRef } from '../../utils/ref';
	import { createAttachmentKey } from 'svelte/attachments';
	import { pressBounce } from '../../actions/pressBounce.svelte';
	import { createSlidingIndicator } from '../../state/slidingIndicator.svelte';
	import { useTabsContext } from './context';

	let {
		ref = $bindable(null),
		ariaLabel,
		block = false,
		children,
		child,
		class: className,
		...rest
	}: TabsListProps = $props();
	const ctx = useTabsContext();

	let variant = $derived(ctx?.variant ?? 'underline');
	let size = $derived(ctx?.size ?? 'medium');
	let orientation = $derived(ctx?.orientation ?? 'horizontal');
	let disabled = $derived(ctx?.disabled ?? false);
	let isUnderline = $derived(variant === 'underline');
	let isVertical = $derived(orientation === 'vertical');

	let container: HTMLDivElement | null = $state(null);
	let thumbLayer = $state<HTMLSpanElement>();

	const thumb = createSlidingIndicator({ spring: { stiffness: 0.18, damping: 0.78 } });
	const press = pressBounce({ disabled: () => disabled || isUnderline });

	$effect(() => {
		thumb.setSpring(
			isUnderline ? { stiffness: 0.14, damping: 0.55 } : { stiffness: 0.18, damping: 0.78 }
		);
	});

	function measure(): void {
		const active = container?.querySelector<HTMLElement>('[role="tab"][data-state="active"]');
		thumb.measure(active ?? null, container);
	}

	$effect(() => {
		void ctx?.value;
		void orientation;
		measure();
	});

	$effect(() => {
		if (!container) return;
		return thumb.observe(container, measure);
	});

	$effect(() => () => thumb.destroy());

	$effect(() => {
		ctx?.setThumbLayer(thumbLayer);
		return () => ctx?.setThumbLayer(undefined);
	});

	function handlePointerDown(e: PointerEvent): void {
		const tab = (e.target as HTMLElement | null)?.closest<HTMLElement>('[role="tab"]');
		if (!tab || tab.hasAttribute('disabled')) return;
		press.onpointerdown(e);
	}

	const attrs = $derived({
		class: [
			'tab-list',
			`tab-list--${variant}`,
			`tab-list--size-${size}`,
			block ? 'tab-list--block' : undefined
		]
			.filter(Boolean)
			.join(' '),
		role: 'tablist' as const,
		'aria-label': ariaLabel,
		'aria-orientation': orientation,
		'aria-disabled': disabled || undefined,
		'data-orientation': orientation,
		'data-disabled': boolAttr(disabled),
		'data-ready': boolAttr(thumb.ready),
		'data-testid': 'tab-list',
		onpointerdown: handlePointerDown
	});
	const refKey = createAttachmentKey();
	const merged = $derived(
		mergeProps(rest, attrs, {
			class: className,
			[refKey]: attachRef<HTMLDivElement>((n) => {
				ref = n;
				container = n;
			})
		})
	);
</script>

{#snippet thumbSpan()}
	<span
		class="tab-list__thumb"
		data-hidden={boolAttr((isVertical ? thumb.h : thumb.w) === 0)}
		aria-hidden="true"
		style:--x={`${thumb.x}px`}
		style:--y={`${thumb.y}px`}
		style:--w={`${thumb.w}px`}
		style:--h={`${thumb.h}px`}
		style:--ps={press.scale}
	>
		{#if !isUnderline}
			<span bind:this={thumbLayer} class="tab-list__thumb-ripples" aria-hidden="true"></span>
		{/if}
	</span>
{/snippet}

{#if child}
	{@render child({ props: merged })}
{:else}
	<div {...merged}>
		{@render thumbSpan()}
		{@render children?.()}
	</div>
{/if}

<style>
	:where(.tab-list) {
		--x: 0px;
		--y: 0px;
		--w: 0px;
		--h: 0px;
		--pad: 3px;
		--radius: var(--rad-md);
		--inner-radius: 10px;
		--item-py: 5px;
		--item-px: var(--space-6);
		--font-size: var(--fs-md);
		--ripple-soft-alpha: 0.2;
		--underline-h: 2px;

		position: relative;
		display: inline-flex;
		align-items: stretch;
		padding: var(--pad);
		background: rgb(var(--gray-2));
		border-radius: var(--radius);
		-webkit-user-select: none;
		user-select: none;
		isolation: isolate;
	}

	:where(.tab-list[data-orientation='vertical']) {
		flex-direction: column;
		align-items: stretch;
	}

	:where(.tab-list--size-xl) {
		--pad: var(--space-3);
		--item-py: var(--space-5);
		--item-px: var(--space-8);
		--font-size: var(--fs-xl);
		--radius: var(--rad-2xl);
		--inner-radius: var(--rad-lg);
	}

	:where(.tab-list--size-large) {
		--pad: var(--space-2);
		--item-py: var(--space-3);
		--item-px: var(--space-7);
		--font-size: var(--fs-lg);
		--radius: var(--rad-lg);
		--inner-radius: var(--rad-md);
	}

	:where(.tab-list--size-small) {
		--pad: var(--space-1);
		--item-py: var(--space-2);
		--item-px: var(--space-5);
		--font-size: var(--fs-sm);
		--radius: var(--rad-sm);
		--inner-radius: var(--rad-sm);
	}

	:where(.tab-list--size-mini) {
		--pad: 1px;
		--item-py: var(--space-1);
		--item-px: var(--space-4);
		--font-size: var(--fs-xs);
		--radius: var(--rad-xs);
		--inner-radius: var(--rad-xs);
	}

	:where(.tab-list--block) {
		width: 100%;
	}
	.tab-list--block :global(.tab) {
		flex: 1 1 0;
		justify-content: center;
	}

	:where(.tab-list[data-disabled]) {
		opacity: 0.55;
	}

	.tab-list__thumb {
		position: absolute;
		top: var(--pad);
		bottom: var(--pad);
		left: 0;
		width: var(--w);
		transform: translateX(var(--x)) scale(var(--ps, 1));
		transform-origin: center;
		background: rgb(var(--c));
		border-radius: var(--inner-radius);
		pointer-events: none;
		z-index: 1;
		transition: background-color 220ms var(--ease-standard);
	}

	:where(.tab-list[data-orientation='vertical']) .tab-list__thumb {
		top: 0;
		bottom: auto;
		left: var(--pad);
		right: var(--pad);
		width: auto;
		height: var(--h);
		transform: translateY(var(--y)) scale(var(--ps, 1));
	}

	.tab-list__thumb-ripples {
		position: absolute;
		inset: 0;
		overflow: hidden;
		pointer-events: none;
		border-radius: inherit;
	}

	.tab-list__thumb[data-hidden] {
		opacity: 0;
	}

	/* underline — transparent rail, animated bottom bar */
	:where(.tab-list--underline) {
		--pad: 0px;
		background: transparent;
		border-bottom: 1px solid rgb(var(--text) / 0.08);
	}
	.tab-list--underline .tab-list__thumb {
		top: auto;
		bottom: -1px;
		height: var(--underline-h);
		border-radius: var(--rad-pill);
	}
	:where(.tab-list--underline[data-orientation='vertical']) {
		border-bottom: 0;
		border-inline-start: 1px solid rgb(var(--text) / 0.08);
	}
	.tab-list--underline[data-orientation='vertical'] .tab-list__thumb {
		top: 0;
		bottom: auto;
		left: -1px;
		right: auto;
		width: var(--underline-h);
		height: var(--h);
		transform: translateY(var(--y));
	}

	/* flat — soft accent track, slightly accent-tinted thumb */
	:where(.tab-list--flat) {
		background: rgb(var(--c) / 0.08);
	}
	.tab-list--flat .tab-list__thumb {
		background: rgb(var(--c) / 0.15);
	}

	/* border — outlined track and thumb */
	:where(.tab-list--border) {
		background: transparent;
		box-shadow: inset 0 0 0 1px rgb(var(--text) / 0.18);
	}
	.tab-list--border .tab-list__thumb {
		background: transparent;
		box-shadow: inset 0 0 0 2px rgb(var(--c));
	}

	/* relief — sunken rail, raised accent thumb */
	.tab-list--relief .tab-list__thumb {
		box-shadow:
			inset 0 -3px 0 color-mix(in oklab, rgb(var(--c)), black 28%),
			0 1px 2px rgb(0 0 0 / 0.1);
	}
</style>
