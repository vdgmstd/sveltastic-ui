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
	import { Tween } from 'svelte/motion';
	import { cubicOut, backOut } from 'svelte/easing';
	import { cn } from '../../utils/cn';
	import { attachRef } from '../../utils/ref';
	import { mergeProps } from '../../utils/mergeProps';
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

	let iconButtonEl: HTMLButtonElement | undefined = $state();
	let iconFillX = $state(0);
	let iconFillY = $state(0);
	let iconFillSize = $state(0);

	const ifsTween = new Tween(0, { duration: 0, easing: cubicOut });
	const ifpTween = new Tween(0, { duration: 450, easing: cubicOut });
	let iconPulseToken = 0;

	async function runIconPulse(): Promise<void> {
		const token = ++iconPulseToken;
		ifsTween.set(0, { duration: 0 });
		await ifsTween.set(1, { duration: 180, easing: cubicOut });
		if (token !== iconPulseToken) return;
		await ifsTween.set(0, { duration: 480, easing: backOut });
	}

	let prevFocusedActive = false;
	$effect(() => {
		const now = ctx.focusedActive;
		if (now && !prevFocusedActive) {
			void runIconPulse();
			if (iconButtonEl) {
				const r = iconButtonEl.getBoundingClientRect();
				const x = Math.random() * r.width;
				const y = Math.random() * r.height;
				iconFillX = x;
				iconFillY = y;
				iconFillSize = Math.ceil(
					Math.max(
						Math.hypot(x, y),
						Math.hypot(r.width - x, y),
						Math.hypot(x, r.height - y),
						Math.hypot(r.width - x, r.height - y)
					) * 2.2
				);
				ifpTween.target = 1;
			}
		} else if (!now && prevFocusedActive) {
			ifpTween.target = 0;
		}
		prevFocusedActive = now;
	});

	function handleClick(event: MouseEvent): void {
		oniconclick?.(event);
	}

	let fillStyle = $derived(
		`--ifs:${ifsTween.current};` +
			`--ifp:${ifpTween.current};` +
			`--icon-fill-x:${iconFillX}px;` +
			`--icon-fill-y:${iconFillY}px;` +
			`--icon-fill-size:${iconFillSize}px;` +
			(userStyle ?? '')
	);

	const refKey = createAttachmentKey();
	// Mint once: `merged` recomputes every icon-pulse frame (fillStyle reads tweens), which would re-run an inline attachment.
	const refAttach = attachRef<HTMLButtonElement>((n) => {
		ref = n;
		iconButtonEl = n ?? undefined;
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
