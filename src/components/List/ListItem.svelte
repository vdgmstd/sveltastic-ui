<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { HTMLAnchorAttributes, HTMLAttributes, HTMLButtonAttributes } from 'svelte/elements';
	import type { Color, Size } from '../../types';

	export type ListItemVariant = 'default' | 'flat';

	type CommonProps<V = unknown> = {
		/** Override list color. */
		color?: Color;
		/** Override list size. */
		size?: Size;
		/** Visual variant for the row. */
		variant?: ListItemVariant;
		/** Current navigation target — sets `aria-current="page"`. */
		active?: boolean;
		/** Selected state for `role: 'listbox'` parents. */
		selected?: boolean;
		/** Disabled — sets `aria-disabled`, blocks selection, keeps focus visible. */
		disabled?: boolean;
		/** Loading overlay — disables interaction. */
		loading?: boolean;
		/** Disable click ripple. */
		ripple?: boolean;
		/** Render as a non-interactive `<div role="listitem">` — no hover, no ripple, not focusable. */
		static?: boolean;
		/** Selection value for the listbox-mode parent. */
		value?: V;
		/** Default content (label). */
		children?: Snippet;
		/** Leading visual (avatar / icon). */
		lead?: Snippet;
		/** Trailing visual (badge / arrow / chip). */
		trail?: Snippet;
		/** Secondary text under the label. */
		description?: Snippet;
		/** Click handler. */
		onclick?: (event: MouseEvent) => void;
	};

	type LinkProps = CommonProps & {
		href: string;
	} & Omit<HTMLAnchorAttributes, keyof CommonProps | 'children'>;

	type ButtonProps = CommonProps & {
		href?: undefined;
	} & Omit<HTMLButtonAttributes, keyof CommonProps | 'children'>;

	type StaticProps = CommonProps & {
		href?: undefined;
		onclick?: undefined;
	} & Omit<HTMLAttributes<HTMLDivElement>, keyof CommonProps | 'children'>;

	export type ListItemProps = LinkProps | ButtonProps | StaticProps;
</script>

<script lang="ts">
	import { ripple as rippleAction } from '../../actions/ripple.svelte';
	import { rgbTriplet } from '../../utils/color';
	import { cn } from '../../utils/cn';
	import { nextId } from '../../state/ids.svelte';
	import { useListContext } from './context';

	let {
		color,
		size,
		variant = 'default',
		active = false,
		selected = false,
		disabled = false,
		loading = false,
		ripple: rippleEnabled = true,
		static: isStatic = false,
		value,
		children,
		lead,
		trail,
		description,
		onclick,
		href,
		class: className,
		style: userStyle,
		...rest
	}: ListItemProps = $props();

	const ctx = useListContext();
	const id = nextId('list-item');

	let resolvedColor = $derived<Color>(color ?? ctx?.color ?? 'primary');
	let resolvedSize = $derived<Size>(size ?? ctx?.size ?? 'medium');
	let triplet = $derived(rgbTriplet(resolvedColor));

	let parentRole = $derived(ctx?.role ?? 'list');
	let parentDisabled = $derived(ctx?.disabled ?? false);
	let isInert = $derived(disabled || loading || parentDisabled);

	let listboxSelected = $derived(parentRole === 'listbox' ? ctx?.isSelected(value) ?? false : false);
	let isSelected = $derived(selected || listboxSelected);

	let itemRole = $derived(
		parentRole === 'menu' ? (href ? 'menuitem' : 'menuitem')
		: parentRole === 'listbox' ? 'option'
		: undefined
	);

	let interactive = $derived(!isStatic);

	let isHovered = $state(false);
	let bgEl = $state<HTMLElement>();
	let rootEl = $state<HTMLElement>();

	let rippleOptions = $derived({
		disabled: !rippleEnabled || isInert || !interactive,
		color: resolvedColor,
		solidBg: variant === 'default' && (active || isSelected),
		soft: variant === 'flat' || (!active && !isSelected),
		mountTo: bgEl
	});

	$effect(() => {
		if (!rootEl) return;
		const valueGetter = () => value;
		const disabledGetter = () => isInert;
		ctx?.register(id, rootEl, valueGetter, disabledGetter);
		return () => ctx?.unregister(id);
	});

	function handleClick(event: MouseEvent): void {
		if (isInert) {
			event.preventDefault();
			event.stopPropagation();
			return;
		}
		if (parentRole === 'listbox') {
			ctx?.select(value);
		} else if (parentRole === 'menu') {
			ctx?.select(value);
		}
		onclick?.(event);
	}

	function handleKeydown(event: KeyboardEvent): void {
		if (isInert) return;
		if (parentRole === 'listbox' || parentRole === 'menu') {
			if (event.key === 'ArrowDown') {
				event.preventDefault();
				ctx?.focusNext(id, 1);
				return;
			}
			if (event.key === 'ArrowUp') {
				event.preventDefault();
				ctx?.focusNext(id, -1);
				return;
			}
			if (event.key === 'Home') {
				event.preventDefault();
				ctx?.focusEdge('first');
				return;
			}
			if (event.key === 'End') {
				event.preventDefault();
				ctx?.focusEdge('last');
				return;
			}
		}
	}

	function handleEnter(): void { isHovered = true; }
	function handleLeave(): void { isHovered = false; }
</script>

{#snippet body()}
	<span class="list-item__bg" aria-hidden="true" bind:this={bgEl}></span>
	{#if lead}<span class="list-item__lead">{@render lead()}</span>{/if}
	<span class="list-item__main">
		<span class="list-item__label">{@render children?.()}</span>
		{#if description}<span class="list-item__desc">{@render description()}</span>{/if}
	</span>
	{#if trail}<span class="list-item__trail">{@render trail()}</span>{/if}
	{#if loading}
		<span class="list-item__loading" aria-hidden="true"></span>
	{/if}
{/snippet}

{#if href !== undefined}
	<a
		bind:this={rootEl}
		class={cn(
			'list-item',
			`list-item--${variant}`,
			`list-item--size-${resolvedSize}`,
			active && 'list-item--active',
			isSelected && 'list-item--selected',
			isInert && 'list-item--disabled',
			loading && 'list-item--loading',
			interactive && 'list-item--interactive',
			isHovered && !isInert && 'list-item--hover',
			className
		)}
		style:--c={triplet}
		style={userStyle}
		href={isInert ? undefined : href}
		role={itemRole}
		aria-current={active ? 'page' : undefined}
		aria-selected={parentRole === 'listbox' ? isSelected : undefined}
		aria-disabled={isInert ? 'true' : undefined}
		data-testid="list-item"
		onclick={handleClick}
		onkeydown={handleKeydown}
		onmouseenter={handleEnter}
		onmouseleave={handleLeave}
		use:rippleAction={rippleOptions}
		{...rest as HTMLAnchorAttributes}
	>
		{@render body()}
	</a>
{:else if !isStatic}
	<button
		bind:this={rootEl}
		type="button"
		class={cn(
			'list-item',
			`list-item--${variant}`,
			`list-item--size-${resolvedSize}`,
			active && 'list-item--active',
			isSelected && 'list-item--selected',
			isInert && 'list-item--disabled',
			loading && 'list-item--loading',
			interactive && 'list-item--interactive',
			isHovered && !isInert && 'list-item--hover',
			className
		)}
		style:--c={triplet}
		style={userStyle}
		disabled={isInert || undefined}
		role={itemRole}
		aria-current={active ? 'page' : undefined}
		aria-selected={parentRole === 'listbox' ? isSelected : undefined}
		aria-disabled={isInert ? 'true' : undefined}
		data-testid="list-item"
		onclick={handleClick}
		onkeydown={handleKeydown}
		onmouseenter={handleEnter}
		onmouseleave={handleLeave}
		use:rippleAction={rippleOptions}
		{...rest as HTMLButtonAttributes}
	>
		{@render body()}
	</button>
{:else}
	<div
		bind:this={rootEl}
		class={cn(
			'list-item',
			`list-item--${variant}`,
			`list-item--size-${resolvedSize}`,
			active && 'list-item--active',
			isSelected && 'list-item--selected',
			isInert && 'list-item--disabled',
			loading && 'list-item--loading',
			className
		)}
		style:--c={triplet}
		style={userStyle}
		role={itemRole}
		aria-current={active ? 'page' : undefined}
		aria-disabled={isInert ? 'true' : undefined}
		data-testid="list-item"
		{...rest as HTMLAttributes<HTMLDivElement>}
	>
		{@render body()}
	</div>
{/if}

<style>
	:where(.list-item) {
		--c: var(--primary);
		--item-radius: 12px;
		--item-pad-y: 9px;
		--item-pad-x: 12px;
		--item-gap: 12px;
		--item-font: inherit;
		position: relative;
		z-index: 1;
		display: flex;
		align-items: center;
		gap: var(--item-gap);
		width: 100%;
		min-width: 0;
		box-sizing: border-box;
		padding: 0;
		border: 0;
		background: transparent;
		color: inherit;
		font: inherit;
		font-size: var(--item-font);
		text-align: left;
		text-decoration: none;
		outline: none;
		cursor: default;
	}
	:where(.list-item.list-item--interactive) { cursor: pointer; }

	.list-item__bg {
		position: absolute;
		inset: 2px 4px;
		z-index: 0;
		box-sizing: border-box;
		border-radius: var(--item-radius);
		overflow: hidden;
		pointer-events: none;
		background: transparent;
		transform: scale(1);
		transform-origin: center;
		transition:
			transform 220ms cubic-bezier(0.4, 0, 0.2, 1),
			background-color 200ms cubic-bezier(0.4, 0, 0.2, 1);
	}

	.list-item.list-item--interactive:hover:not(.list-item--active):not(.list-item--selected):not(.list-item--disabled) .list-item__bg {
		background: rgb(var(--text) / 0.05);
	}

	.list-item.list-item--interactive:active:not(.list-item--active):not(.list-item--selected):not(.list-item--disabled) .list-item__bg {
		transform: scale(0.985);
		background: rgb(var(--c) / 0.1);
		transition:
			transform 80ms cubic-bezier(0.4, 0, 0.2, 1),
			background-color 80ms cubic-bezier(0.4, 0, 0.2, 1);
	}
	:where(.list-item:focus-visible) {
		outline: none;
	}
	.list-item:focus-visible .list-item__bg {
		outline: 2px solid rgb(var(--c) / 0.6);
		outline-offset: -2px;
	}

	.list-item__lead,
	.list-item__trail {
		position: relative;
		z-index: 1;
		display: inline-flex;
		flex: 0 0 auto;
		align-items: center;
		justify-content: center;
		transition:
			transform 220ms cubic-bezier(0.5, 1.45, 0.35, 1),
			color 220ms cubic-bezier(0.4, 0, 0.2, 1);
		transform-origin: center;
	}
	.list-item__trail { opacity: 0.65; }

	.list-item.list-item--interactive:hover:not(.list-item--active):not(.list-item--selected):not(.list-item--disabled) .list-item__lead {
		transform: scale(1.18);
		color: rgb(var(--c));
	}

	.list-item__main {
		position: relative;
		z-index: 1;
		display: flex;
		flex-direction: column;
		flex: 1 1 auto;
		min-width: 0;
		gap: 2px;
		padding: var(--item-pad-y) 0;
	}
	.list-item__main:first-child { padding-left: var(--item-pad-x); }
	.list-item__lead + .list-item__main,
	.list-item__main { padding-left: 0; }
	.list-item:not(:has(.list-item__lead)) .list-item__main { padding-left: var(--item-pad-x); }
	.list-item:not(:has(.list-item__trail)) .list-item__main { padding-right: var(--item-pad-x); }
	.list-item:has(.list-item__lead) .list-item__lead { padding-left: var(--item-pad-x); }
	.list-item:has(.list-item__trail) .list-item__trail { padding-right: var(--item-pad-x); }

	.list-item__label {
		display: block;
		min-width: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		line-height: 1.3;
	}
	.list-item__desc {
		display: block;
		min-width: 0;
		font-size: 0.78em;
		opacity: 0.6;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		line-height: 1.3;
	}

	.list-item--active .list-item__bg,
	.list-item--selected .list-item__bg {
		background: rgb(var(--c));
	}
	:where(.list-item--active),
	:where(.list-item--selected) {
		color: rgb(var(--on-accent));
	}
	.list-item--active .list-item__trail,
	.list-item--selected .list-item__trail { opacity: 0.85; }

	.list-item--flat.list-item--active .list-item__bg,
	.list-item--flat.list-item--selected .list-item__bg {
		background: rgb(var(--c) / 0.18);
	}
	:where(.list-item--flat.list-item--active),
	:where(.list-item--flat.list-item--selected) {
		color: rgb(var(--c));
	}

	:where(.list-item--disabled) { opacity: 0.45; cursor: not-allowed; }
	.list-item--disabled .list-item__bg { background: transparent !important; transform: none !important; }

	.list-item--loading .list-item__loading {
		position: absolute;
		inset: 0;
		z-index: 2;
		border-radius: var(--item-radius);
		background: rgb(var(--c) / 0.18);
		backdrop-filter: blur(2px);
		pointer-events: none;
	}

	:where(.list-item--size-xl)     { --item-radius: 16px; --item-pad-y: 14px; --item-pad-x: 18px; --item-gap: 14px; }
	:where(.list-item--size-large)  { --item-radius: 14px; --item-pad-y: 12px; --item-pad-x: 16px; --item-gap: 13px; }
	:where(.list-item--size-medium) { --item-radius: 12px; --item-pad-y: 9px;  --item-pad-x: 12px; --item-gap: 12px; }
	:where(.list-item--size-small)  { --item-radius: 10px; --item-pad-y: 6px;  --item-pad-x: 10px; --item-gap: 10px; }
	:where(.list-item--size-mini)   { --item-radius: 8px;  --item-pad-y: 4px;  --item-pad-x: 8px;  --item-gap: 8px; }
</style>
