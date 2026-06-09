<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { HTMLAnchorAttributes, HTMLAttributes, HTMLButtonAttributes } from 'svelte/elements';
	import type { Color, Size, WithElementRef } from '../../types';

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
		/** Click ripple. Set `false` to opt out. */
		ripple?: boolean;
		/** Render as a non-interactive `<div>` — no hover, no ripple, not focusable. */
		static?: boolean;
		/** Selection value for the listbox-mode parent. */
		value?: V;
		/** Row content — `<List.ItemLead>` / `<List.ItemContent>` / `<List.ItemTrail>`. */
		children?: Snippet;
		/** Render-delegation: receive the merged props and render your own row element. */
		child?: Snippet<[{ props: Record<string, unknown> }]>;
		/** Click handler. */
		onclick?: (event: MouseEvent) => void;
	};

	type LinkProps<V = unknown> = CommonProps<V> & {
		href: string;
	} & Omit<HTMLAnchorAttributes, keyof CommonProps | 'children'>;

	type ButtonProps<V = unknown> = CommonProps<V> & {
		href?: undefined;
	} & Omit<HTMLButtonAttributes, keyof CommonProps | 'children'>;

	type StaticProps<V = unknown> = CommonProps<V> & {
		href?: undefined;
		onclick?: undefined;
	} & Omit<HTMLAttributes<HTMLDivElement>, keyof CommonProps | 'children'>;

	export type ListItemProps<V = unknown> = WithElementRef<
		LinkProps<V> | ButtonProps<V> | StaticProps<V>,
		HTMLElement
	>;

	/** Flattened single-shape Props for the barrel cast — the 3-way union is too large for the d.ts emit. */
	export type ListItemCastProps<V = unknown> = WithElementRef<
		CommonProps<V> & { href?: string } & Omit<HTMLAttributes<HTMLElement>, keyof CommonProps | 'children'>,
		HTMLElement
	>;
</script>

<script lang="ts" generics="V">
	import { createAttachmentKey } from 'svelte/attachments';
	import { ripple as rippleAction } from '../../actions/ripple.svelte';
	import { rgbTriplet } from '../../utils/color';
	import { boolAttr } from '../../utils/attrs';
	import { mergeProps } from '../../utils/mergeProps';
	import { attachRef } from '../../utils/ref';
	import { useListContext } from './context';
	import { ListItemState } from './listState.svelte';

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
		child,
		onclick,
		href,
		ref = $bindable(null),
		class: className,
		...rest
	}: ListItemProps<V> = $props();

	const ctx = useListContext();
	const id = $props.id();
	const refKey = createAttachmentKey();
	const registerKey = createAttachmentKey();

	const item = new ListItemState(
		ctx,
		() => value,
		() => disabled,
		() => loading,
		() => selected,
		() => isStatic
	);

	// Stable identity — inlining re-ran register/deregister each recompute (loop vs tabindexFor).
	const registerItem = (node: HTMLElement) => item.register(id, node);

	let resolvedColor = $derived<Color>(color ?? ctx?.color ?? 'primary');
	let resolvedSize = $derived<Size>(size ?? ctx?.size ?? 'medium');
	let triplet = $derived(rgbTriplet(resolvedColor));

	let isInert = $derived(item.isInert);
	let isSelected = $derived(item.isSelected);
	let interactive = $derived(item.interactive);
	let isRovingItem = $derived(item.isRovingItem);
	let parentRole = $derived(item.parentRole);

	let bgEl = $state<HTMLElement>();

	let rippleOptions = $derived({
		disabled: !rippleEnabled || isInert || !interactive,
		color: resolvedColor,
		solidBg: variant === 'default' && (active || isSelected),
		soft: variant === 'flat' || (!active && !isSelected),
		mountTo: bgEl,
		// Label colour is owned by CSS + the bg fill; a ripple text shift flashes white-wrong on flat rows.
		textColor: 'currentColor' as const
	});

	const Tag = $derived(href !== undefined ? 'a' : isStatic ? 'div' : 'button');

	let tabindex = $derived(isRovingItem && !isInert ? ctx?.tabindexFor(id) : undefined);

	const attrs = $derived({
		class: ['list-item', `list-item--${variant}`, `list-item--size-${resolvedSize}`]
			.filter(Boolean)
			.join(' '),
		'data-testid': 'list-item',
		'data-active': boolAttr(active),
		'data-selected': boolAttr(isSelected),
		'data-disabled': boolAttr(isInert),
		'data-loading': boolAttr(loading),
		'data-interactive': boolAttr(interactive),
		'data-list-id': isRovingItem ? id : undefined,
		'aria-current': active ? 'page' : undefined,
		role: item.itemRole,
		...(Tag === 'a'
			? {
					href: isInert ? undefined : href,
					'aria-selected': parentRole === 'listbox' ? isSelected : undefined,
					'aria-disabled': isInert ? ('true' as const) : undefined,
					tabindex,
					onclick: (e: MouseEvent) => item.handleClick(e, onclick),
					onkeydown: (e: KeyboardEvent) => item.handleKeydown(e, id)
				}
			: Tag === 'button'
				? {
						type: 'button' as const,
						disabled: isInert || undefined,
						'aria-selected': parentRole === 'listbox' ? isSelected : undefined,
						'aria-disabled': isInert ? ('true' as const) : undefined,
						tabindex,
						onclick: (e: MouseEvent) => item.handleClick(e, onclick),
						onkeydown: (e: KeyboardEvent) => item.handleKeydown(e, id)
					}
				: {
						'aria-disabled': isInert ? ('true' as const) : undefined
					})
	});
	const merged = $derived(
		mergeProps(rest, attrs, {
			class: className,
			[refKey]: attachRef<HTMLElement>((n) => (ref = n)),
			[registerKey]: registerItem
		})
	);

	$effect(() => {
		item.claimInitial(id, active);
	});
</script>

{#snippet body()}
	<span class="list-item__bg" aria-hidden="true" {@attach attachRef((n) => (bgEl = n))}></span>
	{@render children?.()}
	{#if loading}
		<span class="list-item__loading" aria-hidden="true"></span>
	{/if}
{/snippet}

{#if child}
	{@render child({ props: { ...merged, style: `--c:${triplet};${(merged.style as string | undefined) ?? ''}` } })}
{:else}
	<svelte:element this={Tag} {...merged} style:--c={triplet} use:rippleAction={rippleOptions}>
		{@render body()}
	</svelte:element>
{/if}

<style>
	:where(.list-item) {
		--c: var(--primary);
		--item-radius: var(--rad-md);
		--item-pad-y: var(--space-4);
		--item-pad-x: var(--space-6);
		--item-gap: var(--space-6);
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
		-webkit-user-select: none;
		user-select: none;
		transition: color 200ms var(--ease-standard);
	}
	:where(.list-item[data-interactive]) { cursor: pointer; }

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
			transform 220ms var(--ease-standard),
			background-color 200ms var(--ease-standard);
	}

	.list-item[data-interactive]:hover:not([data-active]):not([data-selected]):not([data-disabled]) .list-item__bg {
		background: rgb(var(--text) / 0.05);
	}

	.list-item[data-interactive]:active:not([data-active]):not([data-selected]):not([data-disabled]) .list-item__bg {
		transform: scale(0.985);
		background: rgb(var(--c) / 0.1);
		transition:
			transform 80ms var(--ease-standard),
			background-color 80ms var(--ease-standard);
	}
	:where(.list-item:focus-visible) {
		outline: none;
	}
	.list-item:focus-visible .list-item__bg {
		outline: 2px solid rgb(var(--c) / 0.6);
		outline-offset: -2px;
	}

	:global(
		.list-item[data-interactive]:hover:not([data-active]):not([data-selected]):not([data-disabled])
			.list-item__lead
	) {
		transform: scale(1.18);
		color: rgb(var(--c));
	}

	:global(.list-item__main:first-child) { padding-left: var(--item-pad-x); }
	:global(.list-item__lead + .list-item__main),
	:global(.list-item__main) { padding-left: 0; }
	:global(.list-item:not(:has(.list-item__lead)) .list-item__main) { padding-left: var(--item-pad-x); }
	:global(.list-item:not(:has(.list-item__trail)) .list-item__main) { padding-right: var(--item-pad-x); }
	:global(.list-item:has(.list-item__lead) .list-item__lead) { padding-left: var(--item-pad-x); }
	:global(.list-item:has(.list-item__trail) .list-item__trail) { padding-right: var(--item-pad-x); }

	.list-item[data-active] .list-item__bg,
	.list-item[data-selected] .list-item__bg {
		background: rgb(var(--c));
	}
	:where(.list-item[data-active]),
	:where(.list-item[data-selected]) {
		color: rgb(var(--on-accent));
	}
	:global(.list-item[data-active] .list-item__trail),
	:global(.list-item[data-selected] .list-item__trail) { opacity: 0.85; }

	.list-item--flat[data-active] .list-item__bg,
	.list-item--flat[data-selected] .list-item__bg {
		background: rgb(var(--c) / 0.18);
	}
	:where(.list-item--flat[data-active]),
	:where(.list-item--flat[data-selected]) {
		color: rgb(var(--c));
	}

	:where(.list-item[data-disabled]) { opacity: 0.45; cursor: not-allowed; }
	.list-item[data-disabled] .list-item__bg { background: transparent !important; transform: none !important; }

	.list-item[data-loading] .list-item__loading {
		position: absolute;
		inset: 0;
		z-index: 2;
		border-radius: var(--item-radius);
		background: rgb(var(--c) / 0.18);
		-webkit-backdrop-filter: blur(2px);
		backdrop-filter: blur(2px);
		pointer-events: none;
	}

	:global(.list__body[data-divided] .list-item) {
		border-radius: 0;
	}
	:global(.list__body[data-divided] .list-item .list-item__bg) {
		inset: 0;
		border-radius: 0;
	}
	:global(.list__body[data-divided] .list-item:first-child .list-item__bg) {
		border-top-left-radius: var(--list-radius);
		border-top-right-radius: var(--list-radius);
	}
	:global(.list__body[data-divided] .list-item:last-child .list-item__bg) {
		border-bottom-left-radius: var(--list-radius);
		border-bottom-right-radius: var(--list-radius);
	}
	:global(.list__body[data-divided] .list-item + .list-item)::before {
		content: '';
		position: absolute;
		left: 12px;
		right: 12px;
		top: 0;
		height: 1px;
		background: rgb(var(--text) / 0.08);
		z-index: 1;
		pointer-events: none;
	}

	:where(.list-item--size-xl)     { --item-radius: var(--rad-lg); --item-pad-y: var(--space-7); --item-pad-x: var(--space-8); --item-gap: 14px; }
	:where(.list-item--size-large)  { --item-radius: 14px; --item-pad-y: var(--space-6); --item-pad-x: var(--space-7); --item-gap: 13px; }
	:where(.list-item--size-medium) { --item-radius: var(--rad-md); --item-pad-y: var(--space-4);  --item-pad-x: var(--space-6); --item-gap: var(--space-6); }
	:where(.list-item--size-small)  { --item-radius: 10px; --item-pad-y: var(--space-3);  --item-pad-x: var(--space-5); --item-gap: var(--space-5); }
	:where(.list-item--size-mini)   { --item-radius: var(--rad-sm);  --item-pad-y: var(--space-2);  --item-pad-x: var(--space-4);  --item-gap: var(--space-4); }
</style>
