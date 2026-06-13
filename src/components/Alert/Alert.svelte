<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import type { Color, WithElementRef } from '../../types';
	import type { AlertVariant } from './alert.svelte';

	export type { AlertVariant };

	export type AlertRootProps = WithElementRef<
		{
			/** Visual variant. */
			variant?: AlertVariant;
			/** Palette name, hex, `rgb(...)`, or `"r,g,b"` triplet. */
			color?: Color;
			/** End-stop color for the `gradient` variant. Defaults to the `--gradient-end` token. */
			gradientEnd?: Color;
			/** Show / hide the alert. Two-way bindable. */
			open?: boolean;
			/**
			 * Collapse toggle on the title. `undefined` disables the affordance entirely; `true`/`false`
			 * enables a click-to-collapse handle via `<Alert.Toggle>`. Two-way bindable.
			 */
			collapsed?: boolean | undefined;
			/** Accessible name for the wrapping region when the alert has interactive controls. */
			regionAriaLabel?: string;
			/** Default content. */
			children?: Snippet;
			/** Render-delegation: receive the merged props and render your own host element. */
			child?: Snippet<[{ props: Record<string, unknown> }]>;
			/** Fires when `open` changes — receives the new open state. */
			onOpenChange?: (open: boolean) => void;
			/** Fires after the open/close transition finishes — receives the settled open state. */
			onOpenChangeComplete?: (open: boolean) => void;
			/** Fires when the collapse toggle changes — receives the new collapsed state. */
			onCollapsedChange?: (collapsed: boolean) => void;
		} & Omit<HTMLAttributes<HTMLDivElement>, 'color' | 'title'>
	>;
</script>

<script lang="ts">
	import { slide } from 'svelte/transition';
	import { cubicInOut } from 'svelte/easing';
	import { createAttachmentKey } from 'svelte/attachments';

	import { rgbTriplet } from '../../utils/color';
	import { cn } from '../../utils/cn';
	import { boolAttr } from '../../utils/attrs';
	import { attachRef } from '../../utils/ref';
	import { mergeProps } from '../../utils/mergeProps';
	import { setAlertCtx } from './context';
	import { AlertRootState } from './alert.svelte';

	let {
		variant = 'relief',
		color = 'primary',
		gradientEnd,
		open = $bindable(true),
		collapsed = $bindable(undefined),
		regionAriaLabel = 'Notice',
		children,
		child,
		onOpenChange,
		onOpenChangeComplete,
		onCollapsedChange,
		ref = $bindable(null),
		class: className,
		style: userStyle,
		...rest
	}: AlertRootProps = $props();

	const uid = $props.id();
	const root = setAlertCtx(
		new AlertRootState(
			{
				getOpen: () => open,
				setOpenProp: (v) => (open = v),
				getCollapsed: () => collapsed,
				setCollapsedProp: (v) => (collapsed = v),
				getOnOpenChange: () => onOpenChange,
				getOnOpenChangeComplete: () => onOpenChangeComplete,
				getOnCollapsedChange: () => onCollapsedChange
			},
			uid
		)
	);

	let triplet = $derived(rgbTriplet(color));
	let endTriplet = $derived(gradientEnd ? rgbTriplet(gradientEnd) : undefined);

	const refKey = createAttachmentKey();
	const rootProps = $derived(
		mergeProps(rest, {
			class: cn('alert', `alert--${variant}`, className),
			role: root.isInteractive ? ('region' as const) : ('alert' as const),
			'aria-label': root.isInteractive ? regionAriaLabel : undefined,
			'data-state': root.isCollapsed ? ('collapsed' as const) : ('expanded' as const),
			'data-variant': variant,
			'data-dismissible': boolAttr(root.hasDismiss),
			'data-interactive': boolAttr(root.isInteractive),
			'data-testid': 'alert',
			style: `--c:${triplet};${endTriplet ? `--ge:${endTriplet};` : ''}${userStyle ?? ''}`,
			[refKey]: attachRef<HTMLElement>((n) => (ref = n))
		})
	);
</script>

{#if open}
	{#if child}
		{@render child({ props: rootProps })}
	{:else}
		<div
			{...rootProps}
			transition:slide={{ duration: root.motionDuration, easing: cubicInOut }}
			onoutroend={() => root.completeOpen(false)}
			onintroend={() => root.completeOpen(true)}
		>
			{@render children?.()}
		</div>
	{/if}
{/if}

<style>
	:where(.alert) {
		--c: var(--primary);
		--ge: var(--gradient-end);

		position: relative;
		width: 100%;
		padding: 0 var(--space-8);
		background: rgb(var(--c));
		color: rgb(var(--on-accent));
		border-radius: var(--rad-xl);
		font-size: var(--fs-md);
		z-index: 10;
		overflow: hidden;
		box-sizing: border-box;
	}

	.alert :global(::selection) { background: rgb(255 255 255 / 0.2); }

	.alert :global(b) { font-weight: 600; }
	.alert :global(a) {
		color: inherit;
		text-decoration: underline;
		transition: opacity var(--dur) var(--ease-standard);
	}
	.alert :global(a:hover) { opacity: 0.6; }

	:where(.alert--relief) {
		box-shadow: 6px 6px 0 0 rgb(var(--c) / 0.3);
	}

	.alert--gradient::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background: linear-gradient(30deg, rgb(var(--ge) / 0) 33%, rgb(var(--ge)) 100%);
		border-radius: inherit;
		z-index: -1;
		pointer-events: none;
		box-sizing: border-box;
	}

	.alert :global(.alert__title) ~ :global(.alert__content) :global(.alert__content__text) {
		padding-top: 0;
	}
	.alert :global(.alert__icon) ~ :global(.alert__title) { padding-inline-start: 35px; }
	.alert :global(.alert__icon) ~ :global(.alert__content) :global(.alert__content__text) {
		padding-inline-start: 35px;
	}
	.alert :global(.alert__icon) ~ :global(.alert__footer) { padding-inline-start: 35px; }

	.alert :global(.alert__close) {
		position: absolute;
		top: 9px;
		inset-inline-end: 6px;
		width: 30px;
		height: 30px;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 0;
		background: transparent;
		color: rgb(var(--on-accent));
		border: 0;
		border-radius: var(--rad-sm);
		cursor: pointer;
		transition: transform var(--dur) var(--ease-standard),
			box-shadow var(--dur) var(--ease-standard),
			background-color var(--dur) var(--ease-standard);
	}
	.alert :global(.alert__close:hover) {
		transform: translate(0, -2px);
		box-shadow: 0 5px 18px 0 rgb(0 0 0 / 0.15);
	}
	.alert--relief :global(.alert__close:hover) {
		background: rgb(0 0 0 / 0.2);
	}
	.alert :global(.alert__close:focus-visible) {
		outline: 2px solid rgb(255 255 255 / 0.6);
		outline-offset: 2px;
	}
	.alert :global(.alert__close svg) { fill: currentColor; }

	.alert :global(.alert__progress) {
		position: absolute;
		bottom: 0;
		left: 0;
		width: 100%;
		height: 2px;
		background: rgb(255 255 255 / 0.2);
	}
	.alert :global(.alert__progress__bar) {
		position: relative;
		left: 0;
		width: 100%;
		height: 100%;
		background: rgb(255 255 255);
		transform: scaleX(var(--w, 0));
		transform-origin: left;
	}
	:global([dir='rtl']) .alert :global(.alert__progress__bar) {
		transform-origin: right;
	}
</style>
