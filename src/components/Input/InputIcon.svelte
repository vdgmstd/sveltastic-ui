<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { HTMLButtonAttributes } from 'svelte/elements';
	import type { WithElementRef } from '../../types';

	export type InputIconProps = WithElementRef<
		{
			children?: Snippet;
			child?: Snippet<[{ props: Record<string, unknown> }]>;
			/** Fires when the icon is clicked — also makes the icon focusable / clickable. */
			oniconclick?: (event: MouseEvent) => void;
		} & Omit<HTMLButtonAttributes, 'children' | 'onclick'>,
		HTMLButtonElement
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

	function handleClick(event: MouseEvent): void {
		oniconclick?.(event);
	}

	let fillStyle = $derived(pulse.style + (userStyle ?? ''));

	const refKey = createAttachmentKey();
	// Mint once: `merged` recomputes every icon-pulse frame (pulse.style reads tweens), which would re-run an inline attachment.
	const refAttach = attachRef<HTMLButtonElement>((n) => {
		ref = n;
		pulse.setNode(n ?? undefined);
	});
	const merged = $derived(
		mergeProps(rest, {
			class: cn(
				'input__icon',
				ctx.iconPosition === 'after' && 'input__icon--after',
				!!oniconclick && 'input__icon--clickable',
				className
			),
			type: 'button' as const,
			tabindex: oniconclick ? 0 : -1,
			disabled: !oniconclick,
			'aria-hidden': !oniconclick,
			style: fillStyle,
			onclick: handleClick,
			[refKey]: refAttach
		})
	);
</script>

{#if child}
	{@render child({ props: merged })}
{:else}
	<button {...merged}>
		{#if ctx.isPlainSurface && ctx.isIconFillBg}
			<span class="input__icon-ripple" aria-hidden="true"></span>
		{/if}
		<span class="input__icon-glyph">{@render children?.()}</span>
		{#if ctx.isPlainSurface && !ctx.isIconFillBg}
			<span class="input__icon-glyph input__icon-glyph--reveal" aria-hidden="true">
				{@render children?.()}
			</span>
		{/if}
	</button>
{/if}
