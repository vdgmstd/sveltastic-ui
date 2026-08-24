<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { HTMLButtonAttributes } from 'svelte/elements';
	import type { WithElementRef } from '../../types';

	export type InputIconProps = WithElementRef<
		{
			children?: Snippet;
			child?: Snippet<[{ props: Record<string, unknown> }]>;
			/** Fires when the icon is clicked — also promotes the decorative `<span>` to a real `<button>`. */
			oniconclick?: (event: MouseEvent) => void;
		} & Omit<HTMLButtonAttributes, 'children' | 'onclick'>,
		HTMLButtonElement | HTMLSpanElement
	>;
</script>

<script lang="ts">
	import { createAttachmentKey } from 'svelte/attachments';
	import { cn } from '../../utils/cn';
	import { attachRef } from '../../utils/ref';
	import { mergeProps } from '../../utils/mergeProps';
	import { IconPulseState } from '../../primitives/iconPulse.svelte';
	import { useInputCtx } from './context';

	let {
		ref = $bindable(null),
		class: className,
		style: userStyle,
		children,
		child,
		oniconclick,
		...rest
	}: InputIconProps = $props();
	const ctx = useInputCtx();

	const pulse = new IconPulseState();
	$effect(() => pulse.sync(ctx.focusedActive));

	let isClickable = $derived(!!oniconclick);

	function handleClick(event: MouseEvent): void {
		oniconclick?.(event);
	}

	let fillStyle = $derived(pulse.style + (userStyle ?? ''));

	const refKey = createAttachmentKey();
	// Mint once: `merged` recomputes every icon-pulse frame (pulse.style reads tweens), which would re-run an inline attachment.
	const refAttach = attachRef<HTMLButtonElement | HTMLSpanElement>((n) => {
		ref = n;
		pulse.setNode(n ?? undefined);
	});
	const merged = $derived(
		mergeProps(rest, {
			class: cn(
				'input__icon',
				ctx.iconPosition === 'after' && 'input__icon--after',
				isClickable && 'input__icon--clickable',
				className
			),
			type: isClickable ? ('button' as const) : undefined,
			'aria-hidden': isClickable ? undefined : true,
			style: fillStyle,
			onclick: isClickable ? handleClick : undefined,
			[refKey]: refAttach
		})
	);
</script>

{#snippet glyph()}
	{#if ctx.isPlainSurface && ctx.isIconFillBg}
		<span class="input__icon-ripple" aria-hidden="true"></span>
	{/if}
	<span class="input__icon-glyph">{@render children?.()}</span>
	{#if ctx.isPlainSurface && !ctx.isIconFillBg}
		<span class="input__icon-glyph input__icon-glyph--reveal" aria-hidden="true">
			{@render children?.()}
		</span>
	{/if}
{/snippet}

{#if child}
	{@render child({ props: merged })}
{:else if isClickable}
	<button {...merged}>{@render glyph()}</button>
{:else}
	<span {...merged}>{@render glyph()}</span>
{/if}
