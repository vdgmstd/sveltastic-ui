<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { HTMLButtonAttributes } from 'svelte/elements';

	export type TabProps = {
		/** Tab identifier. Must be unique within the parent `<Tabs>`. */
		value: string;
		/** Disable this single tab. */
		disabled?: boolean;
		/** Leading icon. */
		icon?: Snippet;
		/** Label snippet. Falls back to `children`, then to `value`. */
		label?: Snippet;
		/** Default content — same as `label` if both are omitted. */
		children?: Snippet;
	} & Omit<HTMLButtonAttributes, 'children' | 'disabled'>;
</script>

<script lang="ts">
	import { ripple as rippleAction } from '../../actions/ripple.svelte';
	import { cn } from '../../utils/cn';
	import { useTabsContext } from './context';

	let {
		value,
		disabled = false,
		icon,
		label,
		children,
		class: className,
		style: userStyle,
		...rest
	}: TabProps = $props();
	const ctx = useTabsContext();

	let isActive = $derived(ctx?.value === value);
	let isInert = $derived(disabled || (ctx?.disabled ?? false));
	let variant = $derived(ctx?.variant ?? 'underline');
	let color = $derived(ctx?.color ?? 'primary');
	let onFilledThumb = $derived(variant === 'default' || variant === 'relief');

	let el = $state<HTMLButtonElement>();

	let rippleOptions = $derived({
		disabled: isInert || variant === 'underline',
		color: onFilledThumb && isActive ? '255 255 255' : color,
		soft: true,
		duration: 1000,
		mountTo: ctx?.thumbLayer
	});

	$effect(() => {
		if (!el || !ctx) return;
		ctx.register(value, el, () => isInert);
		return () => ctx.unregister(value);
	});

	function handleClick(): void {
		if (isInert) return;
		ctx?.setActive(value);
	}

	function handleKeydown(event: KeyboardEvent): void {
		if (isInert || !ctx) return;
		let handled = true;
		switch (event.key) {
			case 'ArrowRight':
			case 'ArrowDown':
				ctx.focusNext(value, 1);
				break;
			case 'ArrowLeft':
			case 'ArrowUp':
				ctx.focusNext(value, -1);
				break;
			case 'Home':
				ctx.focusEdge('first');
				break;
			case 'End':
				ctx.focusEdge('last');
				break;
			default:
				handled = false;
		}
		if (handled) event.preventDefault();
	}
</script>

<button
	bind:this={el}
	type="button"
	class={cn(
		'tab',
		`tab--variant-${variant}`,
		isActive && 'tab--active',
		isInert && 'tab--disabled',
		className
	)}
	style={userStyle}
	role="tab"
	id={ctx?.tabId(value)}
	aria-selected={isActive}
	aria-controls={ctx?.panelId(value)}
	aria-disabled={isInert ? 'true' : undefined}
	tabindex={isActive ? 0 : -1}
	disabled={isInert || undefined}
	data-testid="tab"
	onclick={handleClick}
	onkeydown={handleKeydown}
	use:rippleAction={rippleOptions}
	{...rest}
>
	{#if icon}<span class="tab__icon">{@render icon()}</span>{/if}
	<span class="tab__label">
		{#if label}{@render label()}{:else if children}{@render children()}{:else}{value}{/if}
	</span>
</button>

<style>
	:where(.tab) {
		position: relative;
		z-index: 2;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 6px;
		padding: var(--item-py, 5px) var(--item-px, 12px);
		background: transparent;
		border: 0;
		color: rgb(var(--text) / 0.6);
		font: inherit;
		font-size: var(--font-size, 0.8rem);
		font-weight: 500;
		cursor: pointer;
		border-radius: var(--inner-radius, 10px);
		white-space: nowrap;
		outline: none;
		transition: color 220ms cubic-bezier(0.4, 0, 0.2, 1);
	}

	:where(.tab:hover:not(.tab--active):not(:disabled)) {
		color: rgb(var(--text) / 0.95);
	}

	:where(.tab:focus-visible:not(.tab--active)) {
		color: rgb(var(--c));
	}

	:where(.tab:disabled),
	:where(.tab--disabled) {
		opacity: 0.45;
		cursor: not-allowed;
	}

	.tab__icon {
		display: inline-flex;
		align-items: center;
		font-size: 1.05em;
	}

	:where(.tab--variant-underline.tab--active),
	:where(.tab--variant-tonal.tab--active),
	:where(.tab--variant-border.tab--active) {
		color: rgb(var(--c));
	}

	:where(.tab--variant-default.tab--active),
	:where(.tab--variant-relief.tab--active) {
		color: rgb(var(--on-accent));
	}
</style>
