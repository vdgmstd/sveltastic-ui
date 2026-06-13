<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import type { WithElementRef } from '../../types';

	export type ListBodyProps = WithElementRef<
		{
			/** Accessible name for the surface when no visible label/header is present. */
			ariaLabel?: string;
			/** Items — `<List.Item>` / `<List.Group>` / `<List.Separator>`. */
			children?: Snippet;
			/** Render-delegation: receive the merged props and render your own element. */
			child?: Snippet<[{ props: Record<string, unknown> }]>;
		} & Omit<HTMLAttributes<HTMLDivElement>, 'children' | 'role'>
	>;
</script>

<script lang="ts">
	import { createAttachmentKey } from 'svelte/attachments';
	import { boolAttr } from '../../utils/attrs';
	import { mergeProps } from '../../utils/mergeProps';
	import { attachRef } from '../../utils/ref';
	import { useListContext } from './context';

	let {
		ariaLabel,
		children,
		child,
		ref = $bindable(null),
		class: className,
		style: userStyle,
		...rest
	}: ListBodyProps = $props();

	const ctx = useListContext();
	let variant = $derived(ctx?.variant ?? 'default');
	let size = $derived(ctx?.size ?? 'medium');
	let role = $derived(ctx?.role ?? 'list');
	// Default 'list' mode renders plain divs (no listitem/group children), so no role to avoid aria-required-children.
	let surfaceRole = $derived(role === 'menu' ? 'menu' : role === 'listbox' ? 'listbox' : undefined);
	let divided = $derived(ctx?.divided ?? false);
	let multiselectable = $derived(role === 'listbox' && (ctx?.multiple ?? false));

	const attrs = $derived({
		class: ['list__body', `list__body--${variant}`, `list__body--size-${size}`].join(' '),
		role: surfaceRole,
		'aria-label': ariaLabel,
		'aria-multiselectable': multiselectable ? true : undefined,
		'data-variant': variant,
		'data-size': size,
		'data-divided': boolAttr(divided),
		style: userStyle
	});
	const merged = $derived(
		mergeProps(rest, attrs, {
			class: className,
			[createAttachmentKey()]: attachRef<HTMLDivElement>((n) => (ref = n))
		})
	);
</script>

{#if child}
	{@render child({ props: merged })}
{:else}
	<div {...merged}>{@render children?.()}</div>
{/if}

<style>
	.list__body {
		--list-radius: var(--rad-xl);
		--list-pad-y: var(--space-4);
		--list-pad-x: var(--space-4);
		--list-gap: 0px;
		--list-font: var(--fs-md);
		display: flex;
		flex-direction: column;
		gap: var(--list-gap);
		padding: var(--list-pad-y) var(--list-pad-x);
		border-radius: var(--list-radius);
		font-size: var(--list-font);
	}

	.list__body--default {
		background: rgb(var(--gray-2));
	}

	.list__body--flat {
		background: rgb(var(--c) / 0.08);
	}

	.list__body--transparent {
		background: transparent;
		padding: 0;
	}

	.list__body--border {
		background: transparent;
		box-shadow: inset 0 0 0 1px rgb(var(--text) / 0.1);
	}

	.list__body--shadow {
		background: rgb(var(--gray-2));
		box-shadow: 0 4px 12px -4px rgb(0 0 0 / 0.18);
	}

	.list__body[data-divided] {
		padding: 0;
	}

	:where(.list__body--size-xl)     { --list-radius: var(--rad-2xl); --list-pad-y: var(--space-5); --list-pad-x: var(--space-5); --list-font: var(--fs-xl); }
	:where(.list__body--size-large)  { --list-radius: 22px; --list-pad-y: 9px;  --list-pad-x: 9px;  --list-font: var(--fs-lg); }
	:where(.list__body--size-medium) { --list-radius: var(--rad-xl); --list-pad-y: var(--space-4);  --list-pad-x: var(--space-4);  --list-font: var(--fs-md); }
	:where(.list__body--size-small)  { --list-radius: var(--rad-lg); --list-pad-y: var(--space-3);  --list-pad-x: var(--space-3);  --list-font: var(--fs-sm); }
	:where(.list__body--size-mini)   { --list-radius: var(--rad-md); --list-pad-y: var(--space-2);  --list-pad-x: var(--space-2);  --list-font: var(--fs-xs); }
</style>
