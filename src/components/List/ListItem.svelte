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
		/** Render-delegation: receive the merged props (the list-item classes + data-state attrs + ref & ripple as attachments) + the kit's `body` snippet (background layer + row content + loading overlay); render your own row element with `{@render body()}` inside it. The row styles are global, so the delegated element reproduces the full look (fill, focus ring, loading overlay, ripple). */
		child?: Snippet<[{ props: Record<string, unknown>; body: Snippet }]>;
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
	import '../../styles/list-item.css';
	import { untrack } from 'svelte';
	import { createAttachmentKey, type Attachment } from 'svelte/attachments';
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
	// Stable, change-guarded ref attachment — re-minting in `merged` bounced the consumer's bound `ref`
	// null→node every recompute.
	const attachNode = attachRef<HTMLElement>((n) => (ref = n));

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

	// Ripple rides the prop bag as an attachment so the child-delegated path keeps it (mirrors ChipRoot).
	let rippleHandle: ReturnType<typeof rippleAction> | undefined;
	const rippleKey = createAttachmentKey();
	const attachRipple: Attachment = (node) => {
		untrack(() => {
			rippleHandle = rippleAction(node as HTMLElement, rippleOptions);
		});
		return () => {
			rippleHandle?.destroy?.();
			rippleHandle = undefined;
		};
	};
	$effect(() => {
		rippleHandle?.update?.(rippleOptions);
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
			[refKey]: attachNode,
			[registerKey]: registerItem,
			[rippleKey]: attachRipple
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
	{@render child({ props: { ...merged, style: `--c:${triplet};${(merged.style as string | undefined) ?? ''}` }, body })}
{:else}
	<svelte:element this={Tag} {...merged} style:--c={triplet}>
		{@render body()}
	</svelte:element>
{/if}

