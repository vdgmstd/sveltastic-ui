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
			/** Render-delegation: receive the merged props + the kit's `body` snippet (the sliding-indicator thumb + triggers); render your own tablist element with `{@render body()}` inside it so the indicator is preserved. */
			child?: Snippet<[{ props: Record<string, unknown>; body: Snippet }]>;
		} & Omit<HTMLAttributes<HTMLDivElement>, 'children'>,
		HTMLDivElement
	>;
</script>

<script lang="ts">
	import '../../styles/tab-list.css';
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

	let variant = $derived(ctx.variant);
	let size = $derived(ctx.size);
	let orientation = $derived(ctx.orientation);
	let disabled = $derived(ctx.disabled);
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
		void ctx.value;
		void orientation;
		measure();
	});

	$effect(() => {
		if (!container) return;
		return thumb.observe(container, measure);
	});

	$effect(() => () => thumb.destroy());

	$effect(() => {
		ctx.setThumbLayer(thumbLayer);
		return () => ctx.setThumbLayer(undefined);
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

{#snippet body()}
	{@render thumbSpan()}
	{@render children?.()}
{/snippet}

{#if child}
	{@render child({ props: merged, body })}
{:else}
	<div {...merged}>
		{@render body()}
	</div>
{/if}

