<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';

	export type TabListProps = {
		/** Trigger row label for screen readers. */
		ariaLabel?: string;
		/** Stretch the row to fill its container; tabs distribute evenly. */
		block?: boolean;
		/** `<Tab>` children. */
		children?: Snippet;
	} & Omit<HTMLAttributes<HTMLDivElement>, 'children'>;
</script>

<script lang="ts">
	import { Spring, Tween } from 'svelte/motion';
	import { cubicOut, backOut } from 'svelte/easing';
	import { cn } from '../../utils/cn';
	import { useTabsContext } from './context';

	let {
		ariaLabel,
		block = false,
		children,
		class: className,
		style: userStyle,
		...rest
	}: TabListProps = $props();
	const ctx = useTabsContext();

	let variant = $derived(ctx?.variant ?? 'underline');
	let size = $derived(ctx?.size ?? 'medium');
	let disabled = $derived(ctx?.disabled ?? false);
	let isUnderline = $derived(variant === 'underline');

	let container = $state<HTMLDivElement>();
	let thumbLayer = $state<HTMLSpanElement>();

	const thumbX = new Spring(0, { stiffness: 0.18, damping: 0.78 });
	const thumbW = new Spring(0, { stiffness: 0.18, damping: 0.78 });
	const pressScale = new Tween(1, { duration: 110, easing: cubicOut });
	let pressToken = 0;
	let ready = $state(false);

	$effect(() => {
		const stiffness = isUnderline ? 0.14 : 0.18;
		const damping = isUnderline ? 0.55 : 0.78;
		thumbX.stiffness = stiffness;
		thumbX.damping = damping;
		thumbW.stiffness = stiffness;
		thumbW.damping = damping;
	});

	function measure(): void {
		if (!ctx) return;
		const v = ctx.value;
		if (v === undefined) {
			thumbW.set(0, ready ? undefined : { instant: true });
			return;
		}
		const el = ctx.getEl(v);
		if (!el || !container) return;
		const opts = ready ? undefined : { instant: true };
		thumbX.set(el.offsetLeft, opts);
		thumbW.set(el.offsetWidth, opts);
	}

	$effect(() => {
		if (!ctx) return;
		void ctx.value;
		void ctx.order.length;
		measure();
		if (!ready && thumbW.current > 0) {
			const id = requestAnimationFrame(() => (ready = true));
			return () => cancelAnimationFrame(id);
		}
	});

	$effect(() => {
		if (!container) return;
		const ro = new ResizeObserver(() => measure());
		ro.observe(container);
		return () => ro.disconnect();
	});

	$effect(() => {
		ctx?.setThumbLayer(thumbLayer);
		return () => ctx?.setThumbLayer(undefined);
	});

	async function runPress(): Promise<void> {
		if (disabled || isUnderline) return;
		const token = ++pressToken;
		pressScale.set(1, { duration: 0 });
		await pressScale.set(0.85, { duration: 110, easing: cubicOut });
		if (token !== pressToken) return;
		await pressScale.set(1, { duration: 460, easing: backOut });
	}

	function handlePointerDown(e: PointerEvent): void {
		const tab = (e.target as HTMLElement | null)?.closest<HTMLElement>('[role="tab"]');
		if (!tab || tab.hasAttribute('disabled')) return;
		void runPress();
	}
</script>

<div
	bind:this={container}
	class={cn(
		'tab-list',
		`tab-list--${variant}`,
		`tab-list--size-${size}`,
		block && 'tab-list--block',
		disabled && 'tab-list--disabled',
		ready && 'tab-list--ready',
		className
	)}
	style={userStyle}
	role="tablist"
	aria-label={ariaLabel}
	aria-disabled={disabled || undefined}
	data-testid="tab-list"
	onpointerdown={handlePointerDown}
	{...rest}
>
	<span
		class="tab-list__thumb"
		class:tab-list__thumb--hidden={thumbW.current === 0}
		aria-hidden="true"
		style:--x={`${thumbX.current}px`}
		style:--w={`${thumbW.current}px`}
		style:--ps={pressScale.current}
	>
		{#if !isUnderline}
			<span bind:this={thumbLayer} class="tab-list__thumb-ripples" aria-hidden="true"></span>
		{/if}
	</span>
	{@render children?.()}
</div>

<style>
	:where(.tab-list) {
		--x: 0px;
		--w: 0px;
		--pad: 3px;
		--radius: 13px;
		--inner-radius: 10px;
		--item-py: 5px;
		--item-px: 12px;
		--font-size: 0.8rem;
		--ripple-soft-alpha: 0.2;
		--underline-h: 2px;

		position: relative;
		display: inline-flex;
		align-items: stretch;
		padding: var(--pad);
		background: rgb(var(--gray-2));
		border-radius: var(--radius);
		user-select: none;
		isolation: isolate;
	}

	:where(.tab-list--size-xl) {
		--pad: 5px;
		--item-py: 10px;
		--item-px: 20px;
		--font-size: 1.1rem;
		--radius: 22px;
		--inner-radius: 17px;
	}

	:where(.tab-list--size-large) {
		--pad: 4px;
		--item-py: 6px;
		--item-px: 15px;
		--font-size: 1rem;
		--radius: 17px;
		--inner-radius: 13px;
	}

	:where(.tab-list--size-small) {
		--pad: 2px;
		--item-py: 3px;
		--item-px: 10px;
		--font-size: 0.75rem;
		--radius: 10px;
		--inner-radius: 8px;
	}

	:where(.tab-list--size-mini) {
		--pad: 1px;
		--item-py: 2px;
		--item-px: 8px;
		--font-size: 0.6rem;
		--radius: 7px;
		--inner-radius: 6px;
	}

	:where(.tab-list--block) {
		width: 100%;
	}
	.tab-list--block :global(.tab) {
		flex: 1 1 0;
		justify-content: center;
	}

	:where(.tab-list--disabled) {
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
		transition: background-color 220ms cubic-bezier(0.4, 0, 0.2, 1);
	}

	.tab-list__thumb-ripples {
		position: absolute;
		inset: 0;
		overflow: hidden;
		pointer-events: none;
		border-radius: inherit;
	}

	.tab-list__thumb--hidden {
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
		border-radius: 999px;
	}

	/* tonal — soft accent track, slightly accent-tinted thumb */
	:where(.tab-list--tonal) {
		background: rgb(var(--c) / 0.08);
	}
	.tab-list--tonal .tab-list__thumb {
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
