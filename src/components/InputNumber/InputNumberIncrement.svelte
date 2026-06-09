<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { HTMLButtonAttributes } from 'svelte/elements';
	import type { WithElementRef } from '../../types';

	export type InputNumberIncrementProps = WithElementRef<
		{
			/** Aria-label for the increment button. */
			incrementLabel?: string;
			/** Glyph rendered inside the button. Defaults to a bold plus. */
			children?: Snippet;
			/** Render-delegation: receive the merged props and render your own button element. */
			child?: Snippet<[{ props: Record<string, unknown> }]>;
		} & Omit<HTMLButtonAttributes, 'children' | 'type' | 'disabled'>,
		HTMLButtonElement
	>;
</script>

<script lang="ts">
	import { createAttachmentKey } from 'svelte/attachments';
	import { mergeProps } from '../../utils/mergeProps';
	import { attachRef } from '../../utils/ref';
	import { PlusIcon } from 'phosphor-svelte';
	import { useInputNumberContext } from './context';

	let {
		ref = $bindable(null),
		incrementLabel = 'Increment',
		children,
		child,
		class: className,
		style: userStyle,
		...rest
	}: InputNumberIncrementProps = $props();

	const root = useInputNumberContext();

	const refKey = createAttachmentKey();
	const attrs = $derived({
		type: 'button' as const,
		class: 'input-number__btn input-number__btn--inc',
		'aria-label': incrementLabel,
		'aria-controls': root.fieldId,
		disabled: !root.canInc,
		onclick: () => root.handleClick(1),
		onpointerdown: (e: PointerEvent) => {
			root.startHold(1);
			root.incPress.onpointerdown(e);
		},
		onpointerup: () => root.clearHold(),
		onpointerleave: () => root.clearHold(),
		onpointercancel: () => root.clearHold(),
		onblur: () => root.clearHold()
	});
	const merged = $derived(
		mergeProps(rest, attrs, {
			class: className,
			[refKey]: attachRef<HTMLButtonElement>((n) => (ref = n))
		})
	);
	let cssVars = $derived(`--c-btn:${root.incTriplet};--ps:${root.incPress.scale};${userStyle ?? ''}`);
</script>

{#if child}
	{@render child({ props: { ...merged, style: cssVars } })}
{:else}
	<button {...merged} style={cssVars}>
		{#if children}{@render children()}{:else}<PlusIcon size={root.iconPx} weight="bold" />{/if}
	</button>
{/if}
